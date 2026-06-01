import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, authErrorResponse } from '@/lib/auth-guard'
import { adminCreateAgencySchema, validateBody } from '@/lib/validations'
import { enforceRateLimit, AGENCY_LISTING_RATE_LIMIT, RateLimitError, IpBlockedError, recordFailedRequest, recordSuccessfulRequest } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limit public agency listing
    const clientIp = enforceRateLimit(request, AGENCY_LISTING_RATE_LIMIT)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10)
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Math.min(Math.max(rawLimit, 1), 50)
    const offset = Math.max(rawOffset, 0)

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameFr: { contains: search } },
        { nameAr: { contains: search } },
        { customCode: { contains: search } },
      ]
    }

    if (category) {
      where.category = category
    }

    const [agencies, total] = await Promise.all([
      db.agency.findMany({
        where,
        include: {
          _count: {
            select: { services: { where: { isActive: true } } },
          },
          queueSettings: {
            select: { isPaused: true },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
          reservations: {
            select: { id: true },
            where: { status: { in: ['WAITING', 'CALLED'] } },
          },
        },
        orderBy: [
          { isSponsored: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      db.agency.count({ where }),
    ])

    // Fetch average ratings separately using raw SQL to avoid dependency on
    // the `reviews` relation which may not exist in the Vercel Prisma Client
    const agencyIds = agencies.map(a => a.id)
    const ratingResults = agencyIds.length > 0
      ? await db.$queryRaw<Array<{ agencyId: string; avgRating: number | null; reviewCount: number }>>`
          SELECT agencyId, 
                 ROUND(AVG(CAST(rating AS REAL)) * 10) / 10 as avgRating,
                 COUNT(*) as reviewCount
          FROM reviews 
          WHERE agencyId IN (${agencyIds.join(',')})
          GROUP BY agencyId
        `
      : []

    const ratingMap = new Map(ratingResults.map(r => [r.agencyId, { avgRating: r.avgRating ?? 0, reviewCount: Number(r.reviewCount) }]))

    const formattedAgencies = agencies.map((agency) => {
      const ratingInfo = ratingMap.get(agency.id) || { avgRating: 0, reviewCount: 0 }
      return {
        id: agency.id,
        name: agency.name,
        nameFr: agency.nameFr,
        nameAr: agency.nameAr,
        customCode: agency.customCode,
        category: agency.category,
        address: agency.address,
        city: agency.city,
        phone: agency.phone,
        email: agency.email,
        logoUrl: agency.logoUrl,
        isSponsored: agency.isSponsored,
        isQueueOpen: agency.isQueueOpen,
        serviceCount: agency._count.services,
        waitingCount: agency.reservations.length,
        workingHoursStart: agency.workingHoursStart,
        workingHoursEnd: agency.workingHoursEnd,
        isPaused: agency.queueSettings.length > 0 ? agency.queueSettings[0].isPaused : false,
        avgServiceTime: agency.averageServiceTime,
        averageRating: ratingInfo.avgRating,
        reviewCount: ratingInfo.reviewCount,
        subscriptionStatus: agency.subscriptionStatus,
        createdAt: agency.createdAt,
      }
    })

    recordSuccessfulRequest(clientIp)

    return NextResponse.json({
      success: true,
      agencies: formattedAgencies,
      total,
      limit,
      offset,
    })
  } catch (error: unknown) {
    if (error instanceof RateLimitError || error instanceof IpBlockedError) {
      recordFailedRequest(enforceRateLimit.length > 0 ? getClientIp(request) : 'unknown')
      return NextResponse.json(
        { success: false, error: error.message, retryAfter: (error as RateLimitError | IpBlockedError).retryAfter },
        { status: 429, headers: { 'Retry-After': String((error as RateLimitError | IpBlockedError).retryAfter) } }
      )
    }
    console.error('[AGENCIES] Error fetching agencies:', error);
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only SUPER_ADMIN or AGENCY_OWNER can create agencies
    const user = await requireRole(request, 'SUPER_ADMIN', 'AGENCY_OWNER')

    const body = await request.json()

    // Validate input with Zod
    const validation = validateBody(adminCreateAgencySchema, body)
    if (validation.error) return validation.error

    const { name, nameAr, nameFr, customCode, category, address, phone, ownerId } = validation.data

    // SECURITY: Derive ownerId from session (not trust client)
    // - SUPER_ADMIN can specify any ownerId
    // - AGENCY_OWNER creating for themselves: always use their own ID
    const resolvedOwnerId = user.role === 'SUPER_ADMIN' ? (ownerId || user.id) : user.id

    // Check for duplicate customCode
    if (customCode) {
      const existingCode = await db.agency.findUnique({
        where: { customCode },
      })
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: 'Agency code already taken' },
          { status: 409 }
        )
      }
    }

    // Create agency with queue settings
    const agency = await db.agency.create({
      data: {
        name,
        nameAr,
        nameFr,
        customCode: customCode || name.slice(0, 3).toUpperCase(),
        category: category || 'other',
        address,
        phone,
        email: body.email,
        ownerId: resolvedOwnerId,
        queueSettings: {
          create: {},
        },
      },
    })

    // Create audit log — use session user.id, not client-provided ownerId
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AGENCY_CREATE',
        entityType: 'AGENCY',
        entityId: agency.id,
        details: JSON.stringify({ name, customCode, category, ownerId: resolvedOwnerId }),
      },
    })

    return NextResponse.json({ success: true, agency }, { status: 201 })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
