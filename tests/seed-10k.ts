/**
 * 10K Load-Test Seed Script
 * =========================
 * Creates a massive dataset for 10,000 concurrent-user k6 load testing.
 * Run with: npx tsx tests/seed-10k.ts  (or: bun run test:seed:10k)
 *
 * What it creates:
 *   - 1 SUPER_ADMIN
 *   - 100 AGENCY_OWNER users → 100 agencies (5 categories × 20 each)
 *   - 20 AGENCY_STAFF users
 *   - 5,000 CUSTOMER users
 *   - 3-5 services per agency (~400 total)
 *   - Queue settings for every agency
 *   - 5-30 WAITING reservations per active agency (~1,500 total)
 *   - 5-15 COMPLETED reservations per active agency (~1,000 total)
 *   - A few CALLED / CANCELLED per agency
 *   - Notifications, favorites, transactions, reviews
 *
 * Performance optimizations:
 *   - Password hashed ONCE, reused for all users
 *   - createMany for bulk inserts
 *   - Chunked processing (100 records at a time) to limit memory
 *   - Progress logging every 100 records
 *
 * Password for ALL users: "test1234"
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
import { writeFileSync } from 'fs'

const db = new PrismaClient()
const PASSWORD = 'test1234'
const passwordHash = hashPassword(PASSWORD)

// ── Helpers ──────────────────────────────────────────────
const categories = ['clinic', 'lab', 'government', 'agency', 'law'] as const
type Category = (typeof categories)[number]

const categoryLabels: Record<Category, { en: string; ar: string; fr: string }> = {
  clinic: { en: 'Clinic', ar: 'عيادة', fr: 'Clinique' },
  lab: { en: 'Lab', ar: 'مختبر', fr: 'Laboratoire' },
  government: { en: 'Directorate', ar: 'مديرية', fr: 'Direction' },
  agency: { en: 'Agency', ar: 'وكالة', fr: 'Agence' },
  law: { en: 'Law Office', ar: 'مكتب محاماة', fr: 'Cabinet Juridique' },
}

const serviceTemplates: Record<string, { name: string; nameAr: string; nameFr: string; prefix: string }[]> = {
  clinic: [
    { name: 'General Consultation', nameAr: 'استشارة عامة', nameFr: 'Consultation Générale', prefix: 'A' },
    { name: 'Specialist Consultation', nameAr: 'استشارة متخصصة', nameFr: 'Consultation Spécialiste', prefix: 'B' },
    { name: 'Dental Care', nameAr: 'طب أسنان', nameFr: 'Dentisterie', prefix: 'C' },
    { name: 'Pediatrics', nameAr: 'طب أطفال', nameFr: 'Pédiatrie', prefix: 'D' },
    { name: 'Cardiology', nameAr: 'طب القلب', nameFr: 'Cardiologie', prefix: 'E' },
  ],
  lab: [
    { name: 'Blood Analysis', nameAr: 'تحليل الدم', nameFr: 'Analyse Sanguine', prefix: 'L' },
    { name: 'Urine Analysis', nameAr: 'تحليل البول', nameFr: 'Analyse Urine', prefix: 'U' },
    { name: 'X-Ray', nameAr: 'أشعة', nameFr: 'Radiographie', prefix: 'X' },
    { name: 'MRI', nameAr: 'رنين مغناطيسي', nameFr: 'IRM', prefix: 'M' },
  ],
  government: [
    { name: 'Tax Declaration', nameAr: 'تصريح ضريبي', nameFr: 'Déclaration Fiscale', prefix: 'D' },
    { name: 'Tax Payment', nameAr: 'دفع الضرائب', nameFr: 'Paiement Impôts', prefix: 'P' },
    { name: 'Document Issuance', nameAr: 'استخراج وثيقة', nameFr: 'Délivrance Document', prefix: 'W' },
    { name: 'Certificate', nameAr: 'شهادة', nameFr: 'Certificat', prefix: 'C' },
    { name: 'Registration', nameAr: 'تسجيل', nameFr: 'Inscription', prefix: 'R' },
  ],
  agency: [
    { name: 'Ticket Booking', nameAr: 'حجز تذاكر', nameFr: 'Réservation Billets', prefix: 'T' },
    { name: 'Travel Consultation', nameAr: 'استشارة سفر', nameFr: 'Consultation Voyage', prefix: 'V' },
    { name: 'Visa Service', nameAr: 'خدمة تأشيرة', nameFr: 'Service Visa', prefix: 'S' },
  ],
  law: [
    { name: 'Legal Consultation', nameAr: 'استشارة قانونية', nameFr: 'Consultation Juridique', prefix: 'J' },
    { name: 'Contract Notarization', nameAr: 'توثيق عقود', nameFr: 'Notarisation Contrats', prefix: 'N' },
    { name: 'Court Filing', nameAr: 'تقديم دعوى', nameFr: 'Dépôt Plainte', prefix: 'F' },
  ],
}

const firstNames = ['أحمد', 'فاطمة', 'يوسف', 'كريم', 'أمينة', 'عمر', 'سارة', 'محمد', 'خديجة', 'بلال', 'نورة', 'علي', 'مريم', 'حسين', 'زينب', 'عبدالله', 'ليلى', 'إبراهيم', 'هدى', 'رشيد']
const lastNames = ['بن علي', 'بوعلام', 'حداد', 'بوزيد', 'شريف', 'منصوري', 'بلقاسم', 'بن عمر', 'مستاوي', 'بوعزة', 'بوزيان', 'الحمدي', 'الطارقي', 'الزيتوني', 'العربي']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Deterministic seed-based random for reproducible names
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ── Main Seed ────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding 10K load-test data...')
  const start = Date.now()

  // ── Clean ──
  console.log('  🧹 Cleaning existing data...')
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.globalAnnouncement.deleteMany()
  await db.announcement.deleteMany()
  await db.reservation.deleteMany()
  await db.transaction.deleteMany()
  await db.favorite.deleteMany()
  await db.queueSettings.deleteMany()
  await db.service.deleteMany()
  await db.agencyStaff.deleteMany()
  await db.smsPurchase.deleteMany()
  await db.review.deleteMany()
  await db.agency.deleteMany()
  await db.user.deleteMany()
  await db.smsSettings.deleteMany()
  await db.fAQ.deleteMany()
  console.log('  🧹 Clean complete.')

  // ── SUPER_ADMIN ──
  console.log('  👑 Creating admin...')
  const admin = await db.user.create({
    data: {
      username: 'admin',
      fullName: 'Platform Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      language: 'ar',
      email: 'admin@queuewise.dz',
      isActive: true,
    },
  })

  // ── Agency Owners (100) — batch insert ──
  console.log('  🏢 Creating 100 agency owners...')
  const ownerUsernames: string[] = []
  const ownerData = []
  for (let i = 0; i < 100; i++) {
    const username = `owner${String(i + 1).padStart(3, '0')}`
    ownerUsernames.push(username)
    const rng = seededRandom(i * 31 + 7)
    ownerData.push({
      username,
      fullName: `${firstNames[Math.floor(rng() * firstNames.length)]} ${lastNames[Math.floor(rng() * lastNames.length)]}`,
      passwordHash,
      role: 'AGENCY_OWNER' as string,
      language: rng() > 0.5 ? 'ar' : 'fr',
      phoneNumber: `0555${String(100000 + i).padStart(6, '0')}`,
      email: `owner${i + 1}@loadtest10k.dz`,
      isActive: true,
    })
  }
  // Insert in chunks of 50
  for (let chunk = 0; chunk < ownerData.length; chunk += 50) {
    await db.user.createMany({ data: ownerData.slice(chunk, chunk + 50) })
  }
  const agencyOwners = await db.user.findMany({
    where: { username: { in: ownerUsernames } },
    orderBy: { username: 'asc' },
  })
  console.log(`  ✅ Created ${agencyOwners.length} agency owners`)

  // ── Agency Staff (20) — batch insert ──
  console.log('  👷 Creating 20 agency staff...')
  const staffUsernames: string[] = []
  const staffData = []
  for (let i = 0; i < 20; i++) {
    const username = `staff${String(i + 1).padStart(2, '0')}`
    staffUsernames.push(username)
    const rng = seededRandom(i * 53 + 13)
    staffData.push({
      username,
      fullName: `${firstNames[Math.floor(rng() * firstNames.length)]} ${lastNames[Math.floor(rng() * lastNames.length)]}`,
      passwordHash,
      role: 'AGENCY_STAFF' as string,
      language: 'ar',
      phoneNumber: `0661${String(100000 + i).padStart(6, '0')}`,
      email: `staff${i + 1}@loadtest10k.dz`,
      isActive: true,
    })
  }
  await db.user.createMany({ data: staffData })
  const staffUsers = await db.user.findMany({
    where: { username: { in: staffUsernames } },
    orderBy: { username: 'asc' },
  })
  console.log(`  ✅ Created ${staffUsers.length} staff users`)

  // ── Customers (5,000) — batch insert in chunks ──
  console.log('  👥 Creating 5,000 customers...')
  const customerUsernames: string[] = []
  const CHUNK_SIZE = 100
  let customersCreated = 0

  for (let batch = 0; batch < 5000; batch += CHUNK_SIZE) {
    const batchData = []
    const end = Math.min(batch + CHUNK_SIZE, 5000)
    for (let i = batch; i < end; i++) {
      const num = i + 1
      const username = `user${String(num).padStart(4, '0')}`
      customerUsernames.push(username)
      const rng = seededRandom(i * 71 + 37)
      batchData.push({
        username,
        fullName: `${firstNames[Math.floor(rng() * firstNames.length)]} ${lastNames[Math.floor(rng() * lastNames.length)]}`,
        passwordHash,
        role: 'CUSTOMER' as string,
        language: rng() > 0.3 ? 'ar' : 'fr',
        phoneNumber: `07${String(10000000 + num)}`,
        email: `user${num}@loadtest10k.dz`,
        freeSmsCount: Math.floor(rng() * 13) + 3,
        isActive: true,
      })
    }
    await db.user.createMany({ data: batchData })
    customersCreated += batchData.length
    if (customersCreated % 500 === 0) {
      console.log(`    👥 ${customersCreated}/5,000 customers created`)
    }
  }
  console.log(`  ✅ Created ${customersCreated} customers`)

  // Load all customers (needed for reservation creation)
  // We'll load them in batches when needed to save memory
  console.log('  📋 Loading customer IDs for reference...')
  const allCustomerIds: string[] = []
  for (let batch = 0; batch < customerUsernames.length; batch += 500) {
    const batchNames = customerUsernames.slice(batch, batch + 500)
    const users = await db.user.findMany({
      where: { username: { in: batchNames } },
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
    })
    allCustomerIds.push(...users.map(u => u.id))
  }
  console.log(`  📋 Loaded ${allCustomerIds.length} customer IDs`)

  // ── Agencies (100) ──
  console.log('  🏥 Creating 100 agencies...')
  const agencies: {
    id: string; customCode: string; category: string; isQueueOpen: boolean;
    subscriptionStatus: string; subscriptionTier: string; ownerId: string;
  }[] = []

  for (let i = 0; i < 100; i++) {
    const owner = agencyOwners[i]
    if (!owner) continue
    const cat = categories[i % 5]
    const catLabel = categoryLabels[cat]
    const catIdx = Math.floor(i / 5) + 1 // 1-20 per category
    const isActive = i < 90 // 90 active, 10 inactive
    const avgServiceTime = cat === 'law' ? 30 : cat === 'clinic' ? 15 : cat === 'lab' ? 10 : 12
    const maxReservations = cat === 'government' ? 200 : cat === 'clinic' ? 100 : 50

    const agency = await db.agency.create({
      data: {
        name: `${catLabel.en} ${catIdx}`,
        nameAr: `${catLabel.ar} ${catIdx}`,
        nameFr: `${catLabel.fr} ${catIdx}`,
        customCode: `AG${String(i + 1).padStart(4, '0')}`,
        category: cat,
        address: `Rue ${catIdx}, District ${i + 1}, M'Sila`,
        city: "M'Sila",
        wilaya: '28',
        phone: `055${String(1000000 + i).padStart(7, '0')}`,
        email: `agency${i + 1}@loadtest10k.dz`,
        averageServiceTime: avgServiceTime,
        maxActiveReservations: maxReservations,
        isSponsored: i < 15,
        subscriptionTier: i < 40 ? 'PREMIUM' : 'BASIC',
        subscriptionStatus: isActive ? 'ACTIVE' : 'INACTIVE',
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        isQueueOpen: isActive,
        isActive: true,
        ownerId: owner.id,
      },
    })
    agencies.push({
      id: agency.id,
      customCode: agency.customCode,
      category: agency.category,
      isQueueOpen: agency.isQueueOpen,
      subscriptionStatus: agency.subscriptionStatus,
      subscriptionTier: agency.subscriptionTier,
      ownerId: owner.id,
    })

    // Owner staff relation
    await db.agencyStaff.create({
      data: { userId: owner.id, agencyId: agency.id, role: 'OWNER' },
    })

    // Assign staff to first 20 agencies
    if (i < 20) {
      await db.agencyStaff.create({
        data: { userId: staffUsers[i]?.id, agencyId: agency.id, role: 'STAFF' },
      })
    }

    if ((i + 1) % 20 === 0) {
      console.log(`    🏥 ${i + 1}/100 agencies created`)
    }
  }
  console.log(`  ✅ Created ${agencies.length} agencies`)

  // ── Services (~400) — batch per agency ──
  console.log('  📋 Creating services...')
  const services: { id: string; agencyId: string; prefix: string }[] = []

  for (const agency of agencies) {
    const cat = agency.category as Category
    const templates = serviceTemplates[cat] || serviceTemplates.clinic
    const count = randomInt(3, Math.min(5, templates.length))
    const svcData = []
    for (let j = 0; j < count; j++) {
      const tmpl = templates[j]
      svcData.push({
        agencyId: agency.id,
        name: `${tmpl.name} ${agency.customCode}`,
        nameAr: tmpl.nameAr,
        nameFr: tmpl.nameFr,
        prefix: tmpl.prefix,
        isActive: true,
      })
    }
    await db.service.createMany({ data: svcData })
    // Fetch back the service IDs for this agency
    const created = await db.service.findMany({
      where: { agencyId: agency.id },
      select: { id: true, agencyId: true, prefix: true },
    })
    services.push(...created)
  }
  console.log(`  ✅ Created ${services.length} services`)

  // Build a lookup: agencyId -> services
  const servicesByAgency: Record<string, typeof services> = {}
  for (const svc of services) {
    if (!servicesByAgency[svc.agencyId]) servicesByAgency[svc.agencyId] = []
    servicesByAgency[svc.agencyId].push(svc)
  }

  // ── Queue Settings ──
  console.log('  ⚙️ Creating queue settings...')
  const queueSettingsData = agencies.map(agency => ({
    agencyId: agency.id,
    currentServingNumber: randomInt(0, 40),
    lastIssuedNumber: randomInt(40, 120),
    isPaused: !agency.isQueueOpen,
    openedAt: new Date(),
  }))
  // Insert in chunks
  for (let chunk = 0; chunk < queueSettingsData.length; chunk += 50) {
    await db.queueSettings.createMany({ data: queueSettingsData.slice(chunk, chunk + 50) })
  }
  console.log(`  ✅ Created ${queueSettingsData.length} queue settings`)

  // ── Reservations ──
  console.log('  🎫 Creating reservations...')
  let totalReservations = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const reservationData: {
    userId: string; agencyId: string; serviceId: string; queueNumber: number;
    displayNumber: string; status: string; estimatedWait: number;
    reservedDate: string; calledAt?: Date; completedAt?: Date; cancelledAt?: Date;
    rating?: number; ratedAt?: Date;
  }[] = []

  for (const agency of agencies) {
    if (!agency.isQueueOpen) continue
    const agencyServices = servicesByAgency[agency.id]
    if (!agencyServices || agencyServices.length === 0) continue

    // WAITING reservations (5-30 per active agency)
    const waitingCount = randomInt(5, 30)
    for (let j = 0; j < waitingCount; j++) {
      const customerIdx = randomInt(0, allCustomerIds.length - 1)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 199)
      reservationData.push({
        userId: allCustomerIds[customerIdx],
        agencyId: agency.id,
        serviceId: service.id,
        queueNumber: qNum,
        displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
        status: 'WAITING',
        estimatedWait: randomInt(5, 120),
        reservedDate: today,
      })
    }

    // COMPLETED reservations (5-15 per active agency)
    const completedCount = randomInt(5, 15)
    for (let j = 0; j < completedCount; j++) {
      const customerIdx = randomInt(0, allCustomerIds.length - 1)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 100)
      const calledAt = new Date(Date.now() - randomInt(3600000, 7200000))
      reservationData.push({
        userId: allCustomerIds[customerIdx],
        agencyId: agency.id,
        serviceId: service.id,
        queueNumber: qNum,
        displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
        status: 'COMPLETED',
        estimatedWait: randomInt(5, 60),
        reservedDate: yesterday,
        calledAt,
        completedAt: new Date(calledAt.getTime() + randomInt(600000, 1800000)),
        rating: randomInt(3, 5),
        ratedAt: new Date(),
      })
    }

    // A few CALLED (1-3)
    for (let j = 0; j < randomInt(1, 3); j++) {
      const customerIdx = randomInt(0, allCustomerIds.length - 1)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 60)
      reservationData.push({
        userId: allCustomerIds[customerIdx],
        agencyId: agency.id,
        serviceId: service.id,
        queueNumber: qNum,
        displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
        status: 'CALLED',
        estimatedWait: 0,
        reservedDate: today,
        calledAt: new Date(),
      })
    }

    // A few CANCELLED (1-2)
    for (let j = 0; j < randomInt(1, 2); j++) {
      const customerIdx = randomInt(0, allCustomerIds.length - 1)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 80)
      reservationData.push({
        userId: allCustomerIds[customerIdx],
        agencyId: agency.id,
        serviceId: service.id,
        queueNumber: qNum,
        displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
        status: 'CANCELLED',
        estimatedWait: randomInt(5, 60),
        reservedDate: yesterday,
        cancelledAt: new Date(),
      })
    }
  }

  // Insert reservations in chunks of 100
  for (let chunk = 0; chunk < reservationData.length; chunk += CHUNK_SIZE) {
    const batch = reservationData.slice(chunk, chunk + CHUNK_SIZE)
    try {
      await db.reservation.createMany({ data: batch })
      totalReservations += batch.length
    } catch {
      // Fall back to individual inserts for this chunk if batch fails
      for (const r of batch) {
        try {
          await db.reservation.create({ data: r })
          totalReservations++
        } catch {
          // Skip
        }
      }
    }
    if (totalReservations % 500 < CHUNK_SIZE) {
      console.log(`    🎫 ${totalReservations}/${reservationData.length} reservations created`)
    }
  }
  console.log(`  ✅ Created ${totalReservations} reservations`)

  // ── Favorites ──
  console.log('  ⭐ Creating favorites...')
  let favCount = 0
  const favData: { userId: string; agencyId: string }[] = []
  // Create favorites for first 500 customers to keep it manageable
  const favCustomerIds = allCustomerIds.slice(0, 500)
  for (const customerId of favCustomerIds) {
    const favAgencyCount = randomInt(1, 5)
    for (let j = 0; j < favAgencyCount; j++) {
      const agency = randomFrom(agencies)
      favData.push({ userId: customerId, agencyId: agency.id })
    }
  }
  // Use individual inserts since there's a unique constraint on [userId, agencyId]
  for (let chunk = 0; chunk < favData.length; chunk += CHUNK_SIZE) {
    const batch = favData.slice(chunk, chunk + CHUNK_SIZE)
    for (const fav of batch) {
      try {
        await db.favorite.create({ data: fav })
        favCount++
      } catch {
        // Skip duplicates
      }
    }
  }
  console.log(`  ✅ Created ${favCount} favorites`)

  // ── Notifications ──
  console.log('  🔔 Creating notifications...')
  let notifCount = 0
  const notifTypes = ['queue_called', 'turn_approaching', 'completed', 'SYSTEM']
  const notifTitles = ['دورك وصل!', 'اقترب دورك!', 'تم إنهاء الخدمة', 'تنبيه']
  const notifData: { userId: string; type: string; title: string; message: string; isRead: boolean }[] = []
  // Create notifications for first 500 customers
  for (let i = 0; i < 500; i++) {
    const customerId = allCustomerIds[i]
    if (!customerId) continue
    const nCount = randomInt(1, 5)
    for (let j = 0; j < nCount; j++) {
      const tIdx = randomInt(0, notifTypes.length - 1)
      notifData.push({
        userId: customerId,
        type: notifTypes[tIdx],
        title: notifTitles[tIdx],
        message: `Load test notification ${notifData.length + 1}`,
        isRead: Math.random() > 0.5,
      })
    }
  }
  // Insert in chunks
  for (let chunk = 0; chunk < notifData.length; chunk += CHUNK_SIZE) {
    await db.notification.createMany({ data: notifData.slice(chunk, chunk + CHUNK_SIZE) })
    notifCount += notifData.slice(chunk, chunk + CHUNK_SIZE).length
  }
  console.log(`  ✅ Created ${notifCount} notifications`)

  // ── Transactions ──
  console.log('  💰 Creating transactions...')
  const txStatuses = ['APPROVED', 'PENDING', 'REJECTED']
  const txMethods = ['ccp', 'bank_transfer', 'cash']
  const txData = agencies.map(agency => ({
    agencyId: agency.id,
    amount: agency.subscriptionTier === 'PREMIUM' ? 5000 : 2000,
    plan: agency.subscriptionTier,
    paymentMethod: randomFrom(txMethods),
    status: randomFrom(txStatuses),
    reviewedBy: Math.random() > 0.5 ? admin.id : undefined,
  }))
  for (let chunk = 0; chunk < txData.length; chunk += 50) {
    await db.transaction.createMany({ data: txData.slice(chunk, chunk + 50) })
  }
  console.log(`  ✅ Created ${txData.length} transactions`)

  // ── Reviews ──
  console.log('  ⭐ Creating reviews...')
  let reviewCount = 0
  const reviewComments = [
    'خدمة ممتازة', 'تجربة جيدة', 'سريع وفعال', 'خدمة سيئة', 'طوابير طويلة',
    'موصى به', 'Needs improvement', 'Bon service', 'Très bien', 'Excellent',
  ]
  // Create reviews for first 200 customers (avoiding unique constraint violations on [userId, agencyId])
  const usedPairs = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const customerId = allCustomerIds[i]
    if (!customerId) continue
    // Pick a random agency, avoid duplicates
    const agencyIdx = randomInt(0, agencies.length - 1)
    const pairKey = `${customerId}-${agencies[agencyIdx].id}`
    if (usedPairs.has(pairKey)) continue
    usedPairs.add(pairKey)
    try {
      await db.review.create({
        data: {
          userId: customerId,
          agencyId: agencies[agencyIdx].id,
          rating: randomInt(1, 5),
          comment: randomFrom(reviewComments),
        },
      })
      reviewCount++
    } catch {
      // Skip duplicate
    }
  }
  console.log(`  ✅ Created ${reviewCount} reviews`)

  // ── Announcements for active agencies ──
  console.log('  📢 Creating announcements...')
  const announcementData: { agencyId: string; message: string; type: string; isActive: boolean }[] = []
  for (let i = 0; i < 90; i++) {
    const agency = agencies[i]
    if (!agency) continue
    announcementData.push({
      agencyId: agency.id,
      message: `Welcome to ${agency.customCode}! We are open and ready to serve you.`,
      type: 'INFO',
      isActive: true,
    })
    // Some agencies get a second announcement
    if (i % 3 === 0) {
      announcementData.push({
        agencyId: agency.id,
        message: 'Special hours today: extended service until 8 PM.',
        type: 'INFO',
        isActive: true,
      })
    }
  }
  for (let chunk = 0; chunk < announcementData.length; chunk += CHUNK_SIZE) {
    await db.announcement.createMany({ data: announcementData.slice(chunk, chunk + CHUNK_SIZE) })
  }
  console.log(`  ✅ Created ${announcementData.length} announcements`)

  // ── Output summary ──
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log('')
  console.log('✅ 10K load-test seed complete!')
  console.log(`   Time: ${elapsed}s`)
  console.log(`   Users:        ${1 + 100 + 20 + 5000} (1 admin, 100 owners, 20 staff, 5000 customers)`)
  console.log(`   Agencies:     ${agencies.length} (${agencies.filter(a => a.isQueueOpen).length} active)`)
  console.log(`   Services:     ${services.length}`)
  console.log(`   Reservations: ${totalReservations}`)
  console.log(`   Favorites:    ${favCount}`)
  console.log(`   Notifications:${notifCount}`)
  console.log(`   Reviews:      ${reviewCount}`)
  console.log('')
  console.log('  🔑 All passwords: test1234')
  console.log('  👤 Admin:  admin / test1234')
  console.log('  🏢 Owners: owner001..owner100 / test1234')
  console.log('  🧑 Customers: user0001..user5000 / test1234')
  console.log('  👷 Staff: staff01..staff20 / test1234')

  // ── Write reference file for k6 ──
  console.log('  📄 Writing reference data to tests/seed-data-10k.json...')

  // Load all customers for reference (in batches)
  const customerRefs: { id: string; username: string }[] = []
  for (let batch = 0; batch < customerUsernames.length; batch += 500) {
    const batchNames = customerUsernames.slice(batch, batch + 500)
    const users = await db.user.findMany({
      where: { username: { in: batchNames } },
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
    })
    customerRefs.push(...users)
  }

  const ref = {
    baseUrl: 'http://localhost:3000',
    admin: { id: admin.id, username: 'admin', password: PASSWORD },
    agencyOwners: agencyOwners.map((o, i) => ({
      id: o.id,
      username: o.username,
      password: PASSWORD,
      agencyId: agencies[i]?.id,
      agencyCode: agencies[i]?.customCode,
    })),
    staffUsers: staffUsers.map(s => ({
      id: s.id,
      username: s.username,
      password: PASSWORD,
    })),
    customers: customerRefs.map(c => ({
      id: c.id,
      username: c.username,
      password: PASSWORD,
    })),
    agencies: agencies.map(a => ({
      id: a.id,
      code: a.customCode,
      category: a.category,
      isActive: a.subscriptionStatus === 'ACTIVE',
      isQueueOpen: a.isQueueOpen,
    })),
  }
  writeFileSync('tests/seed-data-10k.json', JSON.stringify(ref, null, 2))
  console.log('  📄 Reference data written to tests/seed-data-10k.json')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
