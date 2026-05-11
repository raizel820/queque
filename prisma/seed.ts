import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'crypto';

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.reservation.deleteMany();
  await db.transaction.deleteMany();
  await db.queueSettings.deleteMany();
  await db.service.deleteMany();
  await db.agencyStaff.deleteMany();
  await db.smsPurchase.deleteMany();
  await db.agency.deleteMany();
  await db.user.deleteMany();

  // ─── Create Users ─────────────────────────────────
  console.log('👤 Creating users...');

  const admin = await db.user.create({
    data: {
      username: 'admin',
      fullName: 'Platform Admin',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      language: 'ar',
      email: 'admin@queuewise.dz',
      isActive: true,
    },
  });

  const customer1 = await db.user.create({
    data: {
      username: 'ahmed',
      fullName: 'أحمد بن علي',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0555123456',
      email: 'ahmed@email.com',
      freeSmsCount: 10,
      isActive: true,
    },
  });

  const customer2 = await db.user.create({
    data: {
      username: 'fatima',
      fullName: 'فاطمة الزهراء',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0661987654',
      email: 'fatima@email.com',
      freeSmsCount: 8,
      isActive: true,
    },

  });

  const customer3 = await db.user.create({
    data: {
      username: 'youssef',
      fullName: 'Youssef Benmoussa',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'fr',
      phoneNumber: '0770345678',
      email: 'youssef@email.com',
      freeSmsCount: 5,
      isActive: true,
    },
  });

  const agencyOwner = await db.user.create({
    data: {
      username: 'clinic01',
      fullName: 'د. محمد بن عمر',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0555000001',
      email: 'clinic@queuewise.dz',
      isActive: true,
    },
  });

  const agencyStaff = await db.user.create({
    data: {
      username: 'receptionist01',
      fullName: 'سارة بركات',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_STAFF',
      language: 'ar',
      phoneNumber: '0661000002',
      email: 'reception@queuewise.dz',
      isActive: true,
    },
  });

  // ─── Create Agencies ───────────────────────────────
  console.log('🏥 Creating agencies...');

  const clinic1 = await db.agency.create({
    data: {
      name: 'عيادة الشفاء',
      nameFr: 'Clinique Chifaa',
      nameAr: 'عيادة الشفاء',
      customCode: 'CLINIC01',
      category: 'clinic',
      address: 'Centre Ville, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0555000001',
      email: 'contact@chifaa.dz',
      description: 'A leading medical clinic in M\'Sila providing quality healthcare.',
      descriptionAr: 'عيادة رائدة في المسيلة تقدم رعاية صحية عالية الجودة',
      descriptionFr: 'Une clinique médicale de premier plan à M\'Sila',
      averageServiceTime: 15,
      maxActiveReservations: 50,
      isSponsored: true,
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      isQueueOpen: true,
      isActive: true,
      ownerId: agencyOwner.id,
    },
  });

  const lab1 = await db.agency.create({
    data: {
      name: 'مختبر التحاليل الطبية',
      nameFr: 'Laboratoire d\'Analyses Médicales',
      nameAr: 'مختبر التحاليل الطبية',
      customCode: 'LAB01',
      category: 'laboratory',
      address: 'Rue de la Liberté, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0555000003',
      email: 'lab@queuewise.dz',
      description: 'Full-service medical laboratory with fast results.',
      descriptionAr: 'مختبر طبي متكامل مع نتائج سريعة',
      descriptionFr: 'Laboratoire médical complet avec résultats rapides',
      averageServiceTime: 10,
      maxActiveReservations: 30,
      isSponsored: false,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      isQueueOpen: true,
      isActive: true,
      ownerId: agencyOwner.id,
    },
  });

  const agency3 = await db.agency.create({
    data: {
      name: 'مكتب المحامي خالد',
      nameFr: 'Cabinet d\'Avocat Khaled',
      nameAr: 'مكتب المحامي خالد',
      customCode: 'LAW01',
      category: 'law_firm',
      address: 'Cité Administrative, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0555000004',
      averageServiceTime: 20,
      maxActiveReservations: 20,
      isSponsored: false,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'PENDING',
      isQueueOpen: true,
      isActive: true,
      ownerId: agencyOwner.id,
    },
  });

  const govtAgency = await db.agency.create({
    data: {
      name: 'مديرية الضرائب',
      nameFr: 'Direction des Impôts',
      nameAr: 'مديرية الضرائب',
      customCode: 'GOV01',
      category: 'government',
      address: 'Cité Administrative, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0555000005',
      averageServiceTime: 8,
      maxActiveReservations: 100,
      isSponsored: true,
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      isQueueOpen: true,
      isActive: true,
      ownerId: agencyOwner.id,
    },
  });

  // ─── Create Agency Staff Relations ─────────────────
  console.log('👷 Creating agency staff...');
  await db.agencyStaff.create({
    data: { userId: agencyStaff.id, agencyId: clinic1.id, role: 'STAFF' },
  });
  await db.agencyStaff.create({
    data: { userId: agencyOwner.id, agencyId: clinic1.id, role: 'OWNER' },
  });

  // ─── Create Services ───────────────────────────────
  console.log('📋 Creating services...');

  const generalConsultation = await db.service.create({
    data: {
      agencyId: clinic1.id,
      name: 'General Consultation',
      nameAr: 'استشارة عامة',
      nameFr: 'Consultation Générale',
      prefix: 'A',
      isActive: true,
    },
  });

  const specialistConsultation = await db.service.create({
    data: {
      agencyId: clinic1.id,
      name: 'Specialist Consultation',
      nameAr: 'استشارة متخصصة',
      nameFr: 'Consultation Spécialiste',
      prefix: 'B',
      isActive: true,
    },
  });

  const labAnalysis = await db.service.create({
    data: {
      agencyId: lab1.id,
      name: 'Lab Analysis',
      nameAr: 'تحليل مخبري',
      nameFr: 'Analyse de Laboratoire',
      prefix: 'L',
      isActive: true,
    },
  });

  const bloodTest = await db.service.create({
    data: {
      agencyId: lab1.id,
      name: 'Blood Test',
      nameAr: 'تحليل الدم',
      nameFr: 'Prise de Sang',
      prefix: 'S',
      isActive: true,
    },
  });

  const legalConsultation = await db.service.create({
    data: {
      agencyId: agency3.id,
      name: 'Legal Consultation',
      nameAr: 'استشارة قانونية',
      nameFr: 'Consultation Juridique',
      prefix: 'J',
      isActive: true,
    },
  });

  const taxService = await db.service.create({
    data: {
      agencyId: govtAgency.id,
      name: 'Tax Service',
      nameAr: 'خدمة ضريبية',
      nameFr: 'Service Fiscal',
      prefix: 'T',
      isActive: true,
    },
  });

  // ─── Create Queue Settings ─────────────────────────
  console.log('⚙️ Creating queue settings...');

  await db.queueSettings.create({
    data: {
      agencyId: clinic1.id,
      currentServingNumber: 3,
      lastIssuedNumber: 8,
      isPaused: false,
      openedAt: new Date(),
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: lab1.id,
      currentServingNumber: 1,
      lastIssuedNumber: 4,
      isPaused: false,
      openedAt: new Date(),
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: agency3.id,
      currentServingNumber: 0,
      lastIssuedNumber: 0,
      isPaused: false,
      openedAt: new Date(),
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: govtAgency.id,
      currentServingNumber: 12,
      lastIssuedNumber: 25,
      isPaused: false,
      openedAt: new Date(),
    },
  });

  // ─── Create Sample Reservations ────────────────────
  console.log('🎫 Creating reservations...');

  await db.reservation.create({
    data: {
      userId: customer1.id,
      agencyId: clinic1.id,
      serviceId: generalConsultation.id,
      queueNumber: 1,
      displayNumber: 'A-001',
      status: 'COMPLETED',
      estimatedWait: 15,
      joinedAt: new Date(Date.now() - 3600000),
      calledAt: new Date(Date.now() - 2700000),
      completedAt: new Date(Date.now() - 1800000),
    },
  });

  await db.reservation.create({
    data: {
      userId: customer2.id,
      agencyId: clinic1.id,
      serviceId: specialistConsultation.id,
      queueNumber: 1,
      displayNumber: 'B-001',
      status: 'CALLED',
      estimatedWait: 20,
      joinedAt: new Date(Date.now() - 900000),
      calledAt: new Date(Date.now() - 60000),
    },
  });

  await db.reservation.create({
    data: {
      userId: customer3.id,
      agencyId: clinic1.id,
      serviceId: generalConsultation.id,
      queueNumber: 5,
      displayNumber: 'A-005',
      status: 'WAITING',
      estimatedWait: 30,
      joinedAt: new Date(Date.now() - 300000),
    },
  });

  await db.reservation.create({
    data: {
      userId: customer1.id,
      agencyId: lab1.id,
      serviceId: labAnalysis.id,
      queueNumber: 2,
      displayNumber: 'L-002',
      status: 'WAITING',
      estimatedWait: 10,
      joinedAt: new Date(Date.now() - 600000),
    },
  });

  await db.reservation.create({
    data: {
      userId: customer2.id,
      agencyId: govtAgency.id,
      serviceId: taxService.id,
      queueNumber: 20,
      displayNumber: 'T-020',
      status: 'WAITING',
      estimatedWait: 64,
      joinedAt: new Date(Date.now() - 120000),
    },
  });

  // ─── Create Transactions ───────────────────────────
  console.log('💰 Creating transactions...');

  await db.transaction.create({
    data: {
      agencyId: agency3.id,
      amount: 2000,
      plan: 'BASIC',
      paymentMethod: 'CCP',
      receiptUrl: null,
      status: 'PENDING',
    },
  });

  await db.transaction.create({
    data: {
      agencyId: clinic1.id,
      amount: 3000,
      plan: 'PREMIUM',
      paymentMethod: 'BANK_TRANSFER',
      receiptUrl: null,
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date(Date.now() - 86400000 * 7),
    },
  });

  await db.transaction.create({
    data: {
      agencyId: govtAgency.id,
      amount: 3000,
      plan: 'PREMIUM',
      paymentMethod: 'CCP',
      receiptUrl: null,
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date(Date.now() - 86400000 * 3),
    },
  });

  // ─── Create Notifications ──────────────────────────
  console.log('🔔 Creating notifications...');

  await db.notification.create({
    data: {
      userId: customer2.id,
      type: 'QUEUE_CALLED',
      title: 'Your turn!',
      message: 'Your number B-001 has been called at عيادة الشفاء. Please proceed.',
      isRead: false,
    },
  });

  await db.notification.create({
    data: {
      userId: customer1.id,
      type: 'QUEUE_JOINED',
      title: 'Queue Joined',
      message: 'You joined the queue at مختبر التحاليل الطبية. Your number: L-002.',
      isRead: true,
    },
  });

  // ─── Create Audit Logs ─────────────────────────────
  console.log('📝 Creating audit logs...');

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'PAYMENT_APPROVE',
      entityType: 'TRANSACTION',
      details: JSON.stringify({ plan: 'PREMIUM', agency: 'عيادة الشفاء' }),
    },
  });

  await db.auditLog.create({
    data: {
      userId: agencyOwner.id,
      action: 'QUEUE_CALL',
      entityType: 'RESERVATION',
      details: JSON.stringify({ displayNumber: 'B-001', agency: 'عيادة الشفاء' }),
    },
  });

  await db.auditLog.create({
    data: {
      userId: customer1.id,
      action: 'LOGIN',
      entityType: 'USER',
      details: JSON.stringify({ username: 'ahmed' }),
    },
  });

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📋 Demo accounts:');
  console.log('  Admin:       admin / admin123');
  console.log('  Customer 1:  ahmed / user123');
  console.log('  Customer 2:  fatima / user123');
  console.log('  Customer 3:  youssef / user123');
  console.log('  Agency:      clinic01 / agency123');
  console.log('  Staff:       receptionist01 / agency123');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
