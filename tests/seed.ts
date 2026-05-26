/**
 * Load-Test Seed Script
 * =====================
 * Creates a large, realistic dataset for k6 load testing.
 * Run with: npx tsx tests/seed.ts
 *
 * What it creates:
 *   - 1 SUPER_ADMIN
 *   - 20 AGENCY_OWNER users → 20 agencies (5 categories × 4 each)
 *   - 5 AGENCY_STAFF users
 *   - 100 CUSTOMER users
 *   - 3-5 services per agency (~80 total)
 *   - Queue settings for every agency
 *   - 5-15 WAITING reservations per agency (~200 total)
 *   - 5-10 COMPLETED reservations per agency (~150 total)
 *   - A few CALLED / CANCELLED reservations
 *   - Notifications, favorites, transactions
 *
 * Password for ALL users: "test1234"
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const db = new PrismaClient()
const PASSWORD = 'test1234'
const passwordHash = hashPassword(PASSWORD)

// ── Helpers ──────────────────────────────────────────────
const categories = ['clinic', 'lab', 'government', 'agency', 'law'] as const
const categoryNames: Record<string, { en: string; ar: string; fr: string }[]> = {
  clinic: [
    { en: 'Healing Clinic', ar: 'عيادة الشفاء', fr: 'Clinique Chifaa' },
    { en: 'Al-Noor Clinic', ar: 'عيادة النور', fr: 'Clinique Al-Noor' },
    { en: 'Safa Medical Center', ar: 'مركز الصفاء الطبي', fr: 'Centre Médical Safa' },
    { en: 'Rahma Polyclinic', ar: 'مستوصف الرحمة', fr: 'Polyclinique Rahma' },
  ],
  lab: [
    { en: 'Al-Amal Laboratory', ar: 'مختبر الأمل', fr: 'Laboratoire Al-Amal' },
    { en: 'Modern Lab', ar: 'المختبر الحديث', fr: 'Laboratoire Moderne' },
    { en: 'Precision Lab', ar: 'مختبر الدقة', fr: 'Laboratoire Précision' },
    { en: 'BioLab Plus', ar: 'مختبر البيو بلس', fr: 'BioLab Plus' },
  ],
  government: [
    { en: 'Tax Directorate', ar: 'مديرية الضرائب', fr: 'Direction des Impôts' },
    { en: 'Civil Status Office', ar: 'مصلحة الحالة المدنية', fr: 'Bureau État Civil' },
    { en: 'Social Security', ar: 'الضمان الاجتماعي', fr: 'Sécurité Sociale' },
    { en: 'Post Office', ar: 'مكتب البريد', fr: 'Bureau de Poste' },
  ],
  agency: [
    { en: 'Star Travel', ar: 'وكالة النجمة للسفر', fr: 'Star Voyage' },
    { en: 'Speed Trans', ar: 'سبيد ترانس', fr: 'Speed Trans' },
    { en: 'El-Hajj Services', ar: 'خدمات الحج', fr: 'Services El-Hajj' },
    { en: 'Quick Express', ar: 'كويك اكسبرس', fr: 'Quick Express' },
  ],
  law: [
    { en: 'Hassan Law Office', ar: 'مكتب المحامي حسان', fr: 'Cabinet Hassan' },
    { en: 'Justice Partners', ar: 'شركاء العدالة', fr: 'Partenaires Justice' },
    { en: 'Al-Haq Legal', ar: 'الحق القانونية', fr: 'Al-Haq Juridique' },
    { en: 'Mediation Center', ar: 'مركز الوساطة', fr: 'Centre Médiation' },
  ],
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

// ── Main Seed ────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding load-test data...')
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

  // ── Agency Owners (20) ──
  console.log('  🏢 Creating agency owners...')
  const agencyOwners = []
  for (let i = 0; i < 20; i++) {
    const cat = categories[i % 5]
    const idx = Math.floor(i / 5)
    const owner = await db.user.create({
      data: {
        username: `owner${String(i + 1).padStart(2, '0')}`,
        fullName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        passwordHash,
        role: 'AGENCY_OWNER',
        language: Math.random() > 0.5 ? 'ar' : 'fr',
        phoneNumber: `0555${String(randomInt(100000, 999999))}`,
        email: `owner${i + 1}@loadtest.dz`,
        isActive: true,
      },
    })
    agencyOwners.push({ ...owner, _cat: cat, _idx: idx })
  }

  // ── Agency Staff (5) ──
  console.log('  👷 Creating agency staff...')
  const staffUsers = []
  for (let i = 0; i < 5; i++) {
    const staff = await db.user.create({
      data: {
        username: `staff${String(i + 1).padStart(2, '0')}`,
        fullName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        passwordHash,
        role: 'AGENCY_STAFF',
        language: 'ar',
        phoneNumber: `0661${String(randomInt(100000, 999999))}`,
        email: `staff${i + 1}@loadtest.dz`,
        isActive: true,
      },
    })
    staffUsers.push(staff)
  }

  // ── Customers (100) ──
  console.log('  👥 Creating 100 customers...')
  const customers = []
  for (let i = 0; i < 100; i++) {
    const customer = await db.user.create({
      data: {
        username: `user${String(i + 1).padStart(3, '0')}`,
        fullName: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
        passwordHash,
        role: 'CUSTOMER',
        language: Math.random() > 0.3 ? 'ar' : 'fr',
        phoneNumber: `07${String(randomInt(10000000, 99999999))}`,
        email: `user${i + 1}@loadtest.dz`,
        freeSmsCount: randomInt(3, 15),
        isActive: true,
      },
    })
    customers.push(customer)
  }

  // ── Agencies (20) ──
  console.log('  🏥 Creating 20 agencies...')
  const agencies = []
  for (let i = 0; i < 20; i++) {
    const { _cat, _idx, ...owner } = agencyOwners[i]
    const names = categoryNames[_cat][_idx % categoryNames[_cat].length]
    const avgServiceTime = _cat === 'law' ? 30 : _cat === 'clinic' ? 15 : _cat === 'lab' ? 10 : 12
    const maxReservations = _cat === 'government' ? 80 : _cat === 'clinic' ? 50 : 30

    const agency = await db.agency.create({
      data: {
        name: names.en,
        nameAr: names.ar,
        nameFr: names.fr,
        customCode: `AG${String(i + 1).padStart(3, '0')}`,
        category: _cat,
        address: `Rue ${i + 1}, M'Sila`,
        city: "M'Sila",
        wilaya: '28',
        phone: `055${String(randomInt(1000000, 9999999))}`,
        email: `agency${i + 1}@loadtest.dz`,
        averageServiceTime: avgServiceTime,
        maxActiveReservations: maxReservations,
        isSponsored: i < 4,
        subscriptionTier: i < 8 ? 'PREMIUM' : 'BASIC',
        subscriptionStatus: i < 18 ? 'ACTIVE' : 'INACTIVE', // 2 inactive
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        isQueueOpen: i < 18,
        isActive: true,
        ownerId: owner.id,
      },
    })
    agencies.push(agency)

    // Staff relation
    await db.agencyStaff.create({
      data: { userId: owner.id, agencyId: agency.id, role: 'OWNER' },
    })
    // Assign some staff to first 5 agencies
    if (i < 5) {
      await db.agencyStaff.create({
        data: { userId: staffUsers[i].id, agencyId: agency.id, role: 'STAFF' },
      })
    }
  }

  // ── Services (~80) ──
  console.log('  📋 Creating services...')
  const services: { id: string; agencyId: string; prefix: string }[] = []
  for (const agency of agencies) {
    const cat = agency.category as keyof typeof serviceTemplates
    const templates = serviceTemplates[cat] || serviceTemplates.clinic
    const count = randomInt(3, templates.length)
    for (let j = 0; j < count; j++) {
      const tmpl = templates[j]
      const svc = await db.service.create({
        data: {
          agencyId: agency.id,
          name: `${tmpl.name} ${agency.customCode}`,
          nameAr: tmpl.nameAr,
          nameFr: tmpl.nameFr,
          prefix: tmpl.prefix,
          isActive: true,
        },
      })
      services.push({ id: svc.id, agencyId: agency.id, prefix: svc.prefix })
    }
  }

  // ── Queue Settings ──
  console.log('  ⚙️ Creating queue settings...')
  for (const agency of agencies) {
    const isPaused = !agency.isQueueOpen
    await db.queueSettings.create({
      data: {
        agencyId: agency.id,
        currentServingNumber: randomInt(0, 20),
        lastIssuedNumber: randomInt(20, 60),
        isPaused,
        ...(isPaused ? { pausedAt: new Date() } : {}),
      },
    })
  }

  // ── Reservations ──
  console.log('  🎫 Creating reservations...')
  let totalReservations = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  for (const agency of agencies) {
    if (!agency.isQueueOpen) continue
    const agencyServices = services.filter(s => s.agencyId === agency.id)
    if (agencyServices.length === 0) continue

    // WAITING reservations (5-15 per active agency)
    const waitingCount = randomInt(5, 15)
    for (let j = 0; j < waitingCount; j++) {
      const customer = randomFrom(customers)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 99)
      try {
        await db.reservation.create({
          data: {
            userId: customer.id,
            agencyId: agency.id,
            serviceId: service.id,
            queueNumber: qNum,
            displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
            status: 'WAITING',
            estimatedWait: randomInt(5, 60),
            reservedDate: today,
          },
        })
        totalReservations++
      } catch {
        // Skip duplicates
      }
    }

    // COMPLETED reservations (5-10 per active agency)
    const completedCount = randomInt(5, 10)
    for (let j = 0; j < completedCount; j++) {
      const customer = randomFrom(customers)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 50)
      const calledAt = new Date(Date.now() - randomInt(3600000, 7200000))
      try {
        await db.reservation.create({
          data: {
            userId: customer.id,
            agencyId: agency.id,
            serviceId: service.id,
            queueNumber: qNum,
            displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
            status: 'COMPLETED',
            estimatedWait: randomInt(5, 30),
            reservedDate: yesterday,
            calledAt,
            completedAt: new Date(calledAt.getTime() + randomInt(600000, 1800000)),
            rating: randomInt(3, 5),
            ratedAt: new Date(),
          },
        })
        totalReservations++
      } catch {
        // Skip
      }
    }

    // A few CALLED
    for (let j = 0; j < randomInt(1, 3); j++) {
      const customer = randomFrom(customers)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 30)
      try {
        await db.reservation.create({
          data: {
            userId: customer.id,
            agencyId: agency.id,
            serviceId: service.id,
            queueNumber: qNum,
            displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
            status: 'CALLED',
            estimatedWait: 0,
            reservedDate: today,
            calledAt: new Date(),
          },
        })
        totalReservations++
      } catch {
        // Skip
      }
    }

    // A few CANCELLED
    for (let j = 0; j < randomInt(1, 2); j++) {
      const customer = randomFrom(customers)
      const service = randomFrom(agencyServices)
      const qNum = randomInt(1, 40)
      try {
        await db.reservation.create({
          data: {
            userId: customer.id,
            agencyId: agency.id,
            serviceId: service.id,
            queueNumber: qNum,
            displayNumber: `${service.prefix}-${String(qNum).padStart(3, '0')}`,
            status: 'CANCELLED',
            estimatedWait: randomInt(5, 40),
            reservedDate: yesterday,
            cancelledAt: new Date(),
          },
        })
        totalReservations++
      } catch {
        // Skip
      }
    }
  }

  // ── Favorites ──
  console.log('  ⭐ Creating favorites...')
  let favCount = 0
  for (let i = 0; i < 100; i++) {
    const customer = customers[i]
    const favAgencyCount = randomInt(1, 4)
    for (let j = 0; j < favAgencyCount; j++) {
      const agency = agencies[randomInt(0, agencies.length - 1)]
      try {
        await db.favorite.create({
          data: { userId: customer.id, agencyId: agency.id },
        })
        favCount++
      } catch {
        // Skip duplicate
      }
    }
  }

  // ── Notifications ──
  console.log('  🔔 Creating notifications...')
  let notifCount = 0
  const notifTypes = ['queue_called', 'turn_approaching', 'completed', 'SYSTEM']
  const notifTitles = ['دورك وصل!', 'اقترب دورك!', 'تم إنهاء الخدمة', 'تنبيه']
  for (let i = 0; i < 100; i++) {
    const customer = customers[i]
    const nCount = randomInt(1, 5)
    for (let j = 0; j < nCount; j++) {
      const tIdx = randomInt(0, notifTypes.length - 1)
      await db.notification.create({
        data: {
          userId: customer.id,
          type: notifTypes[tIdx],
          title: notifTitles[tIdx],
          message: `Test notification ${notifCount + 1}`,
          isRead: Math.random() > 0.5,
        },
      })
      notifCount++
    }
  }

  // ── Transactions ──
  console.log('  💰 Creating transactions...')
  const txStatuses = ['APPROVED', 'PENDING', 'REJECTED']
  const txMethods = ['ccp', 'bank_transfer', 'cash']
  for (const agency of agencies) {
    await db.transaction.create({
      data: {
        agencyId: agency.id,
        amount: agency.subscriptionTier === 'PREMIUM' ? 5000 : 2000,
        plan: agency.subscriptionTier,
        paymentMethod: randomFrom(txMethods),
        status: randomFrom(txStatuses),
        reviewedBy: Math.random() > 0.5 ? admin.id : undefined,
      },
    })
  }

  // ── Reviews ──
  console.log('  ⭐ Creating reviews...')
  let reviewCount = 0
  for (let i = 0; i < 30; i++) {
    const customer = customers[i]
    const agency = agencies[i % agencies.length]
    try {
      await db.review.create({
        data: {
          userId: customer.id,
          agencyId: agency.id,
          rating: randomInt(3, 5),
          comment: `Review from load test user ${i + 1}`,
        },
      })
      reviewCount++
    } catch {
      // Skip duplicate
    }
  }

  // ── Output summary ──
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log('')
  console.log('✅ Load-test seed complete!')
  console.log(`   Time: ${elapsed}s`)
  console.log(`   Users:        ${1 + 20 + 5 + 100} (1 admin, 20 owners, 5 staff, 100 customers)`)
  console.log(`   Agencies:     ${agencies.length}`)
  console.log(`   Services:     ${services.length}`)
  console.log(`   Reservations: ${totalReservations}`)
  console.log(`   Favorites:    ${favCount}`)
  console.log(`   Notifications:${notifCount}`)
  console.log(`   Reviews:      ${reviewCount}`)
  console.log('')
  console.log('  🔑 All passwords: test1234')
  console.log('  👤 Admin:  admin / test1234')
  console.log('  🏢 Owners: owner01..owner20 / test1234')
  console.log('  🧑 Customers: user001..user100 / test1234')
  console.log('  👷 Staff: staff01..staff05 / test1234')

  // ── Write reference file for k6 ──
  const fs = await import('fs/promises')
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
    customers: customers.map(c => ({
      id: c.id,
      username: c.username,
      password: PASSWORD,
    })),
    agencies: agencies.map(a => ({
      id: a.id,
      code: a.customCode,
      category: a.category,
      isActive: a.subscriptionStatus === 'ACTIVE',
    })),
  }
  await fs.writeFile('tests/seed-data.json', JSON.stringify(ref, null, 2))
  console.log('  📄 Reference data written to tests/seed-data.json')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
