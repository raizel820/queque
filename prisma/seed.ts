import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Clean up existing data ─────────────────────────
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.globalAnnouncement.deleteMany();
  await db.announcement.deleteMany();
  await db.reservation.deleteMany();
  await db.transaction.deleteMany();
  await db.favorite.deleteMany();
  await db.queueSettings.deleteMany();
  await db.service.deleteMany();
  await db.agencyStaff.deleteMany();
  await db.smsPurchase.deleteMany();
  await db.agency.deleteMany();
  await db.user.deleteMany();

  // ═══════════════════════════════════════════════════════
  // ─── Create Users ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('👤 Creating users...');

  // ── Platform Admin ──
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

  // ── Existing Demo Customer ──
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

  // ── Existing Demo Agency Owner ──
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

  // ── Existing Demo Agency Staff ──
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

  // ── Additional Customer Users ──
  const customer2 = await db.user.create({
    data: {
      username: 'fatima',
      fullName: 'فاطمة الزهراء بوعلام',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0552987654',
      email: 'fatima@email.com',
      freeSmsCount: 8,
      isActive: true,
    },
  });

  const customer3 = await db.user.create({
    data: {
      username: 'youssef',
      fullName: 'يوسف حداد',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0663456789',
      email: 'youssef@email.com',
      freeSmsCount: 5,
      isActive: true,
    },
  });

  const customer4 = await db.user.create({
    data: {
      username: 'karim',
      fullName: 'كريم بوزيد',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'fr',
      phoneNumber: '0558111222',
      email: 'karim@email.com',
      freeSmsCount: 12,
      isActive: true,
    },
  });

  const customer5 = await db.user.create({
    data: {
      username: 'amina',
      fullName: 'أمينة شريف',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0670999888',
      email: 'amina@email.com',
      freeSmsCount: 6,
      isActive: true,
    },
  });

  const customer6 = await db.user.create({
    data: {
      username: 'omar',
      fullName: 'عمر منصوري',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '0545333444',
      email: 'omar@email.com',
      freeSmsCount: 9,
      isActive: true,
    },
  });

  const customer7 = await db.user.create({
    data: {
      username: 'sara',
      fullName: 'سارة بلقاسم',
      passwordHash: hashPassword('user123'),
      role: 'CUSTOMER',
      language: 'fr',
      phoneNumber: '0698777666',
      email: 'sara@email.com',
      freeSmsCount: 7,
      isActive: true,
    },
  });

  // ── Additional Agency Owners ──
  const labOwner = await db.user.create({
    data: {
      username: 'lab01',
      fullName: 'د. خالد مستاوي',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0556123456',
      email: 'lab@queuewise.dz',
      isActive: true,
    },
  });

  const travelOwner = await db.user.create({
    data: {
      username: 'travel01',
      fullName: 'نبيل بوعزة',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0664222333',
      email: 'travel@queuewise.dz',
      isActive: true,
    },
  });

  const lawOwner = await db.user.create({
    data: {
      username: 'law01',
      fullName: 'المحامي حسان بوزيان',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0557444555',
      email: 'law@queuewise.dz',
      isActive: true,
    },
  });

  const govOwner = await db.user.create({
    data: {
      username: 'gov01',
      fullName: 'مديرية الضرائب - المسيلة',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0558666777',
      email: 'gov@queuewise.dz',
      isActive: true,
    },
  });

  const clinic02Owner = await db.user.create({
    data: {
      username: 'clinic02',
      fullName: 'د. نادية بن حسين',
      passwordHash: hashPassword('agency123'),
      role: 'AGENCY_OWNER',
      language: 'ar',
      phoneNumber: '0671888000',
      email: 'noorclinic@queuewise.dz',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Agencies ──────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('🏥 Creating agencies...');

  // ── 1. عيادة الشفاء (Existing) ──
  const clinic1 = await db.agency.create({
    data: {
      name: 'Clinique Chifaa',
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
      descriptionFr: 'Une clinique médicale de premier plan à M\'Sila offrant des soins de qualité.',
      averageServiceTime: 15,
      maxActiveReservations: 50,
      isSponsored: true,
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      isQueueOpen: true,
      isActive: true,
      ownerId: agencyOwner.id,
    },
  });

  // ── 2. مختبر الأمل ──
  const lab1 = await db.agency.create({
    data: {
      name: 'Al-Amal Laboratory',
      nameFr: 'Laboratoire Al-Amal',
      nameAr: 'مختبر الأمل',
      customCode: 'LAB01',
      category: 'lab',
      address: 'Rue Didouche Mourad, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0556123456',
      email: 'info@alamal-lab.dz',
      description: 'A modern medical laboratory offering accurate and fast test results.',
      descriptionAr: 'مختبر طبي حديث يقدم نتائج تحاليل دقيقة وسريعة',
      descriptionFr: 'Un laboratoire médical moderne offrant des résultats d\'analyses précis et rapides.',
      averageServiceTime: 10,
      maxActiveReservations: 40,
      isSponsored: true,
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      workingHoursStart: '07:30',
      workingHoursEnd: '16:30',
      isQueueOpen: true,
      isActive: true,
      ownerId: labOwner.id,
    },
  });

  // ── 3. وكالة السفر النجمية ──
  const travel1 = await db.agency.create({
    data: {
      name: 'Star Travel Agency',
      nameFr: 'Agence de Voyage Stellaire',
      nameAr: 'وكالة السفر النجمية',
      customCode: 'TRAVEL01',
      category: 'agency',
      address: 'Boulevard de la Liberté, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0664222333',
      email: 'contact@startravel.dz',
      description: 'Your trusted travel agency for domestic and international trips.',
      descriptionAr: 'وكالة سفرك الموثوقة للرحلات الداخلية والدولية',
      descriptionFr: 'Votre agence de voyage de confiance pour les voyages nationaux et internationaux.',
      averageServiceTime: 20,
      maxActiveReservations: 30,
      isSponsored: false,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      isQueueOpen: true,
      isActive: true,
      ownerId: travelOwner.id,
    },
  });

  // ── 4. مكتب المحامي حسان ──
  const law1 = await db.agency.create({
    data: {
      name: 'Hassan Law Office',
      nameFr: 'Cabinet de Maître Hassan',
      nameAr: 'مكتب المحامي حسان',
      customCode: 'LAW01',
      category: 'law',
      address: 'Rue des Frères Abbas, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0557444555',
      email: 'contact@hassan-law.dz',
      description: 'Experienced law office specializing in civil and commercial law.',
      descriptionAr: 'مكتب محاماة ذو خبرة متخصص في القانون المدني والتجاري',
      descriptionFr: 'Cabinet d\'avocat expérimenté spécialisé en droit civil et commercial.',
      averageServiceTime: 30,
      maxActiveReservations: 20,
      isSponsored: false,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      workingHoursStart: '09:00',
      workingHoursEnd: '16:00',
      isQueueOpen: true,
      isActive: true,
      ownerId: lawOwner.id,
    },
  });

  // ── 5. مديرية الضرائب ──
  const gov1 = await db.agency.create({
    data: {
      name: 'Tax Directorate',
      nameFr: 'Direction des Impôts',
      nameAr: 'مديرية الضرائب',
      customCode: 'GOV01',
      category: 'government',
      address: 'Centre Administratif, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0558666777',
      email: 'impots@msila.gov.dz',
      description: 'Government tax office providing tax-related services to citizens.',
      descriptionAr: 'مديرية الضرائب الحكومية تقدم الخدمات الضريبية للمواطنين',
      descriptionFr: 'Direction gouvernementale des impôts fournissant des services fiscaux aux citoyens.',
      averageServiceTime: 12,
      maxActiveReservations: 80,
      isSponsored: false,
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      workingHoursStart: '08:30',
      workingHoursEnd: '15:30',
      isQueueOpen: true,
      isActive: true,
      ownerId: govOwner.id,
    },
  });

  // ── 6. عيادة النور ──
  const clinic2 = await db.agency.create({
    data: {
      name: 'Al-Noor Clinic',
      nameFr: 'Clinique Al-Noor',
      nameAr: 'عيادة النور',
      customCode: 'CLINIC02',
      category: 'clinic',
      address: 'Cité 1000 Logements, M\'Sila',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '0671888000',
      email: 'contact@alnoor-clinic.dz',
      description: 'A family-friendly clinic providing general and dental care.',
      descriptionAr: 'عيادة عائلية تقدم خدمات الطب العام وطب الأسنان',
      descriptionFr: 'Une clinique familiale offrant des soins de médecine générale et dentaire.',
      averageServiceTime: 18,
      maxActiveReservations: 45,
      isSponsored: true,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'INACTIVE',
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      isQueueOpen: false,
      isActive: true,
      ownerId: clinic02Owner.id,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Agency Staff Relations ────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('👷 Creating agency staff...');

  await db.agencyStaff.create({
    data: { userId: agencyStaff.id, agencyId: clinic1.id, role: 'STAFF' },
  });
  await db.agencyStaff.create({
    data: { userId: agencyOwner.id, agencyId: clinic1.id, role: 'OWNER' },
  });
  await db.agencyStaff.create({
    data: { userId: labOwner.id, agencyId: lab1.id, role: 'OWNER' },
  });
  await db.agencyStaff.create({
    data: { userId: travelOwner.id, agencyId: travel1.id, role: 'OWNER' },
  });
  await db.agencyStaff.create({
    data: { userId: lawOwner.id, agencyId: law1.id, role: 'OWNER' },
  });
  await db.agencyStaff.create({
    data: { userId: govOwner.id, agencyId: gov1.id, role: 'OWNER' },
  });
  await db.agencyStaff.create({
    data: { userId: clinic02Owner.id, agencyId: clinic2.id, role: 'OWNER' },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Services ──────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📋 Creating services...');

  // ── Clinic 1 Services (existing) ──
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

  // ── Lab 1 Services ──
  const bloodAnalysis = await db.service.create({
    data: {
      agencyId: lab1.id,
      name: 'Blood Analysis',
      nameAr: 'تحليل الدم',
      nameFr: 'Analyse Sanguine',
      prefix: 'L',
      description: 'Complete blood count and biochemistry tests',
      isActive: true,
    },
  });

  const urineAnalysis = await db.service.create({
    data: {
      agencyId: lab1.id,
      name: 'Urine Analysis',
      nameAr: 'تحليل البول',
      nameFr: 'Analyse d\'Urine',
      prefix: 'U',
      description: 'Urinalysis and culture tests',
      isActive: true,
    },
  });

  const xray = await db.service.create({
    data: {
      agencyId: lab1.id,
      name: 'X-Ray',
      nameAr: 'أشعة',
      nameFr: 'Radiographie',
      prefix: 'X',
      description: 'Digital X-ray imaging services',
      isActive: true,
    },
  });

  // ── Travel Agency Services ──
  const ticketBooking = await db.service.create({
    data: {
      agencyId: travel1.id,
      name: 'Ticket Booking',
      nameAr: 'حجز تذاكر',
      nameFr: 'Réservation de Billets',
      prefix: 'T',
      description: 'Book flight, bus, and train tickets',
      isActive: true,
    },
  });

  const travelConsultation = await db.service.create({
    data: {
      agencyId: travel1.id,
      name: 'Travel Consultation',
      nameAr: 'استشارة سفر',
      nameFr: 'Consultation Voyage',
      prefix: 'V',
      description: 'Get expert advice on travel destinations and packages',
      isActive: true,
    },
  });

  // ── Law Office Services ──
  const legalConsultation = await db.service.create({
    data: {
      agencyId: law1.id,
      name: 'Legal Consultation',
      nameAr: 'استشارة قانونية',
      nameFr: 'Consultation Juridique',
      prefix: 'J',
      description: 'One-on-one legal advice session',
      isActive: true,
    },
  });

  const contractNotarization = await db.service.create({
    data: {
      agencyId: law1.id,
      name: 'Contract Notarization',
      nameAr: 'توثيق عقود',
      nameFr: 'Notarisation de Contrats',
      prefix: 'N',
      description: 'Official contract authentication and notarization',
      isActive: true,
    },
  });

  // ── Government Tax Office Services ──
  const taxDeclaration = await db.service.create({
    data: {
      agencyId: gov1.id,
      name: 'Tax Declaration',
      nameAr: 'تصريح ضريبي',
      nameFr: 'Déclaration Fiscale',
      prefix: 'D',
      description: 'Submit your annual or quarterly tax declaration',
      isActive: true,
    },
  });

  const taxPayment = await db.service.create({
    data: {
      agencyId: gov1.id,
      name: 'Tax Payment',
      nameAr: 'دفع الضرائب',
      nameFr: 'Paiement d\'Impôts',
      prefix: 'P',
      description: 'Pay your taxes and fees',
      isActive: true,
    },
  });

  const documentIssuance = await db.service.create({
    data: {
      agencyId: gov1.id,
      name: 'Document Issuance',
      nameAr: 'استخراج وثيقة',
      nameFr: 'Délivrance de Document',
      prefix: 'W',
      description: 'Request and receive official tax documents and certificates',
      isActive: true,
    },
  });

  // ── Clinic 2 (Al-Noor) Services ──
  const generalMedicine = await db.service.create({
    data: {
      agencyId: clinic2.id,
      name: 'General Medicine',
      nameAr: 'طب عام',
      nameFr: 'Médecine Générale',
      prefix: 'G',
      description: 'General health check-ups and consultations',
      isActive: true,
    },
  });

  const dentistry = await db.service.create({
    data: {
      agencyId: clinic2.id,
      name: 'Dentistry',
      nameAr: 'طب أسنان',
      nameFr: 'Dentisterie',
      prefix: 'D',
      description: 'Dental care and oral health services',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Queue Settings ────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('⚙️ Creating queue settings...');

  await db.queueSettings.create({
    data: {
      agencyId: clinic1.id,
      currentServingNumber: 5,
      lastIssuedNumber: 12,
      isPaused: false,
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: lab1.id,
      currentServingNumber: 8,
      lastIssuedNumber: 15,
      isPaused: false,
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: travel1.id,
      currentServingNumber: 3,
      lastIssuedNumber: 7,
      isPaused: false,
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: law1.id,
      currentServingNumber: 2,
      lastIssuedNumber: 4,
      isPaused: false,
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: gov1.id,
      currentServingNumber: 18,
      lastIssuedNumber: 35,
      isPaused: false,
    },
  });

  await db.queueSettings.create({
    data: {
      agencyId: clinic2.id,
      currentServingNumber: 0,
      lastIssuedNumber: 0,
      isPaused: true,
      pausedAt: new Date('2025-03-05T10:00:00.000Z'),
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Favorites ─────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('⭐ Creating favorites...');

  await db.favorite.create({ data: { userId: customer1.id, agencyId: clinic1.id } });
  await db.favorite.create({ data: { userId: customer1.id, agencyId: lab1.id } });
  await db.favorite.create({ data: { userId: customer2.id, agencyId: clinic1.id } });
  await db.favorite.create({ data: { userId: customer2.id, agencyId: gov1.id } });
  await db.favorite.create({ data: { userId: customer3.id, agencyId: travel1.id } });
  await db.favorite.create({ data: { userId: customer4.id, agencyId: lab1.id } });
  await db.favorite.create({ data: { userId: customer5.id, agencyId: law1.id } });
  await db.favorite.create({ data: { userId: customer6.id, agencyId: clinic1.id } });
  await db.favorite.create({ data: { userId: customer6.id, agencyId: gov1.id } });
  await db.favorite.create({ data: { userId: customer7.id, agencyId: clinic2.id } });

  // ═══════════════════════════════════════════════════════
  // ─── Create Sample Reservations ───────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('🎫 Creating reservations...');

  // ── WAITING reservations ──
  const res1 = await db.reservation.create({
    data: {
      userId: customer1.id,
      agencyId: clinic1.id,
      serviceId: generalConsultation.id,
      queueNumber: 6,
      displayNumber: 'A-006',
      status: 'WAITING',
      estimatedWait: 15,
      reservedDate: '2025-03-05',
    },
  });

  const res2 = await db.reservation.create({
    data: {
      userId: customer2.id,
      agencyId: lab1.id,
      serviceId: bloodAnalysis.id,
      queueNumber: 9,
      displayNumber: 'L-009',
      status: 'WAITING',
      estimatedWait: 10,
      reservedDate: '2025-03-05',
    },
  });

  const res3 = await db.reservation.create({
    data: {
      userId: customer4.id,
      agencyId: gov1.id,
      serviceId: taxDeclaration.id,
      queueNumber: 20,
      displayNumber: 'D-020',
      status: 'WAITING',
      estimatedWait: 24,
      reservedDate: '2025-03-05',
    },
  });

  const res4 = await db.reservation.create({
    data: {
      userId: customer6.id,
      agencyId: clinic1.id,
      serviceId: specialistConsultation.id,
      queueNumber: 4,
      displayNumber: 'B-004',
      status: 'WAITING',
      estimatedWait: 30,
      reservedDate: '2025-03-05',
    },
  });

  // ── CALLED reservations ──
  const res5 = await db.reservation.create({
    data: {
      userId: customer3.id,
      agencyId: travel1.id,
      serviceId: ticketBooking.id,
      queueNumber: 4,
      displayNumber: 'T-004',
      status: 'CALLED',
      estimatedWait: 0,
      reservedDate: '2025-03-05',
      calledAt: new Date('2025-03-05T09:45:00.000Z'),
    },
  });

  const res6 = await db.reservation.create({
    data: {
      userId: customer5.id,
      agencyId: law1.id,
      serviceId: legalConsultation.id,
      queueNumber: 3,
      displayNumber: 'J-003',
      status: 'CALLED',
      estimatedWait: 0,
      reservedDate: '2025-03-05',
      calledAt: new Date('2025-03-05T10:15:00.000Z'),
    },
  });

  // ── COMPLETED reservations with ratings ──
  const res7 = await db.reservation.create({
    data: {
      userId: customer1.id,
      agencyId: clinic1.id,
      serviceId: generalConsultation.id,
      queueNumber: 3,
      displayNumber: 'A-003',
      status: 'COMPLETED',
      estimatedWait: 15,
      reservedDate: '2025-03-04',
      calledAt: new Date('2025-03-04T09:20:00.000Z'),
      completedAt: new Date('2025-03-04T09:40:00.000Z'),
      rating: 5,
      feedback: 'خدمة ممتازة وطاقم محترف جداً',
      ratedAt: new Date('2025-03-04T09:45:00.000Z'),
    },
  });

  const res8 = await db.reservation.create({
    data: {
      userId: customer2.id,
      agencyId: lab1.id,
      serviceId: urineAnalysis.id,
      queueNumber: 5,
      displayNumber: 'U-005',
      status: 'COMPLETED',
      estimatedWait: 8,
      reservedDate: '2025-03-04',
      calledAt: new Date('2025-03-04T10:10:00.000Z'),
      completedAt: new Date('2025-03-04T10:25:00.000Z'),
      rating: 4,
      feedback: 'نتائج سريعة ودقيقة، لكن الانتظار كان طويلاً قليلاً',
      ratedAt: new Date('2025-03-04T10:30:00.000Z'),
    },
  });

  const res9 = await db.reservation.create({
    data: {
      userId: customer4.id,
      agencyId: gov1.id,
      serviceId: taxPayment.id,
      queueNumber: 12,
      displayNumber: 'P-012',
      status: 'COMPLETED',
      estimatedWait: 20,
      reservedDate: '2025-03-04',
      calledAt: new Date('2025-03-04T11:00:00.000Z'),
      completedAt: new Date('2025-03-04T11:12:00.000Z'),
      rating: 3,
      feedback: 'الخدمة مقبولة لكن التنظيم يحتاج تحسين',
      ratedAt: new Date('2025-03-04T11:20:00.000Z'),
    },
  });

  const res10 = await db.reservation.create({
    data: {
      userId: customer7.id,
      agencyId: clinic2.id,
      serviceId: dentistry.id,
      queueNumber: 2,
      displayNumber: 'D-002',
      status: 'COMPLETED',
      estimatedWait: 18,
      reservedDate: '2025-03-03',
      calledAt: new Date('2025-03-03T14:30:00.000Z'),
      completedAt: new Date('2025-03-03T14:55:00.000Z'),
      rating: 5,
      feedback: 'طبيب أسنان ممتاز، أنصح الجميع بزيارة العيادة',
      ratedAt: new Date('2025-03-03T15:00:00.000Z'),
    },
  });

  const res11 = await db.reservation.create({
    data: {
      userId: customer3.id,
      agencyId: travel1.id,
      serviceId: travelConsultation.id,
      queueNumber: 2,
      displayNumber: 'V-002',
      status: 'COMPLETED',
      estimatedWait: 20,
      reservedDate: '2025-03-03',
      calledAt: new Date('2025-03-03T10:30:00.000Z'),
      completedAt: new Date('2025-03-03T10:50:00.000Z'),
      rating: 4,
      feedback: 'استشارة مفيدة جداً وشاملة',
      ratedAt: new Date('2025-03-03T11:00:00.000Z'),
    },
  });

  // ── CANCELLED reservations ──
  const res12 = await db.reservation.create({
    data: {
      userId: customer5.id,
      agencyId: gov1.id,
      serviceId: documentIssuance.id,
      queueNumber: 25,
      displayNumber: 'W-025',
      status: 'CANCELLED',
      estimatedWait: 30,
      reservedDate: '2025-03-04',
      cancelledAt: new Date('2025-03-04T09:30:00.000Z'),
      notes: 'لم أستطع الحضور بسبب ظرف طارئ',
    },
  });

  const res13 = await db.reservation.create({
    data: {
      userId: customer6.id,
      agencyId: lab1.id,
      serviceId: xray.id,
      queueNumber: 11,
      displayNumber: 'X-011',
      status: 'CANCELLED',
      estimatedWait: 15,
      reservedDate: '2025-03-04',
      cancelledAt: new Date('2025-03-04T08:15:00.000Z'),
      notes: 'تم إلغاء الموعد وإعادة جدولته',
    },
  });

  // ── More WAITING reservations to fill the queues ──
  const res14 = await db.reservation.create({
    data: {
      userId: customer7.id,
      agencyId: lab1.id,
      serviceId: bloodAnalysis.id,
      queueNumber: 10,
      displayNumber: 'L-010',
      status: 'WAITING',
      estimatedWait: 12,
      reservedDate: '2025-03-05',
    },
  });

  const res15 = await db.reservation.create({
    data: {
      userId: customer1.id,
      agencyId: gov1.id,
      serviceId: documentIssuance.id,
      queueNumber: 22,
      displayNumber: 'W-022',
      status: 'WAITING',
      estimatedWait: 36,
      reservedDate: '2025-03-05',
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Notifications ─────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('🔔 Creating notifications...');

  await db.notification.create({
    data: {
      userId: customer1.id,
      type: 'queue_called',
      title: 'دورك وصل!',
      message: 'تم استدعاء رقمك A-003 في عيادة الشفاء. يرجى التوجه إلى مكتب الاستقبال.',
      isRead: true,
      entityId: res7.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer1.id,
      type: 'completed',
      title: 'تم إنهاء الخدمة',
      message: 'تم إنهاء زيارتك في عيادة الشفاء. شكراً لكم! يمكنك تقييم الخدمة الآن.',
      isRead: true,
      entityId: res7.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer1.id,
      type: 'turn_approaching',
      title: 'اقترب دورك!',
      message: 'أنت التالي بعد 2 أشخاص في عيادة الشفاء. استعد للتوجه.',
      isRead: false,
      entityId: res1.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer2.id,
      type: 'queue_called',
      title: 'دورك وصل!',
      message: 'تم استدعاء رقمك U-005 في مختبر الأمل. يرجى التوجه إلى القسم المطلوب.',
      isRead: true,
      entityId: res8.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer3.id,
      type: 'queue_called',
      title: 'دورك وصل!',
      message: 'تم استدعاء رقمك T-004 في وكالة السفر النجمية. يرجى التوجه إلى المكتب.',
      isRead: false,
      entityId: res5.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer5.id,
      type: 'turn_approaching',
      title: 'اقترب دورك!',
      message: 'أنت التالي بعد 1 شخص في مكتب المحامي حسان.',
      isRead: false,
      entityId: res6.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer4.id,
      type: 'completed',
      title: 'تم إنهاء الخدمة',
      message: 'تم إنهاء معاملتك في مديرية الضرائب. يمكنك تقييم الخدمة.',
      isRead: true,
      entityId: res9.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer6.id,
      type: 'turn_approaching',
      title: 'اقترب دورك!',
      message: 'أنت التالي بعد 3 أشخاص في عيادة الشفاء - استشارة متخصصة.',
      isRead: false,
      entityId: res4.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer7.id,
      type: 'completed',
      title: 'تم إنهاء الخدمة',
      message: 'تم إنهاء زيارتك في عيادة النور - طب أسنان. شكراً لكم!',
      isRead: false,
      entityId: res10.id,
    },
  });

  await db.notification.create({
    data: {
      userId: customer3.id,
      type: 'completed',
      title: 'تم إنهاء الخدمة',
      message: 'تم إنهاء استشارتك في وكالة السفر النجمية. نأمل أن تكون التجربة ممتعة!',
      isRead: true,
      entityId: res11.id,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Transactions ──────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('💰 Creating transactions...');

  await db.transaction.create({
    data: {
      agencyId: clinic1.id,
      amount: 5000,
      plan: 'PREMIUM',
      paymentMethod: 'ccp',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date('2025-02-28T10:00:00.000Z'),
    },
  });

  await db.transaction.create({
    data: {
      agencyId: lab1.id,
      amount: 5000,
      plan: 'PREMIUM',
      paymentMethod: 'bank_transfer',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date('2025-03-01T14:30:00.000Z'),
    },
  });

  await db.transaction.create({
    data: {
      agencyId: travel1.id,
      amount: 2000,
      plan: 'BASIC',
      paymentMethod: 'ccp',
      status: 'PENDING',
    },
  });

  await db.transaction.create({
    data: {
      agencyId: law1.id,
      amount: 2000,
      plan: 'BASIC',
      paymentMethod: 'cash',
      status: 'REJECTED',
      rejectionReason: 'إيصال الدفع غير واضح، يرجى إعادة الرفع',
    },
  });

  await db.transaction.create({
    data: {
      agencyId: gov1.id,
      amount: 5000,
      plan: 'PREMIUM',
      paymentMethod: 'bank_transfer',
      status: 'PENDING',
    },
  });

  await db.transaction.create({
    data: {
      agencyId: clinic2.id,
      amount: 2000,
      plan: 'BASIC',
      paymentMethod: 'ccp',
      status: 'PENDING',
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Global Announcements ──────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📢 Creating global announcements...');

  await db.globalAnnouncement.create({
    data: {
      message: 'مرحباً بكم في QueueWise! المنصة الآن متاحة في ولاية المسيلة. سجّل الآن واحجز دورك بدون انتظار.',
      type: 'INFO',
      createdBy: admin.id,
    },
  });

  await db.globalAnnouncement.create({
    data: {
      message: 'تنبيه: بعض الخدمات الحكومية قد تتأخر بسبب الصيانة الدورية للأنظمة. نعتذر عن أي إزعاج.',
      type: 'WARNING',
      createdBy: admin.id,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Agency Announcements ──────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📣 Creating agency announcements...');

  await db.announcement.create({
    data: {
      agencyId: clinic1.id,
      message: 'عيادة الشفاء تعلن عن توفر حجز مواعيد لطبيب القلب ابتداءً من الأسبوع القادم.',
      type: 'INFO',
      isActive: true,
    },
  });

  await db.announcement.create({
    data: {
      agencyId: gov1.id,
      message: 'آخر موعد لتقديم التصاريح الضريبية هو 31 مارس 2025. لا تتأخر!',
      type: 'WARNING',
      isActive: true,
      expiresAt: new Date('2025-03-31T23:59:59.000Z'),
    },
  });

  await db.announcement.create({
    data: {
      agencyId: lab1.id,
      message: 'عرض خاص: تحليل شامل بـ 2500 دج بدل 3500 دج خلال شهر مارس!',
      type: 'INFO',
      isActive: true,
      expiresAt: new Date('2025-03-31T23:59:59.000Z'),
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Audit Logs ────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📝 Creating audit logs...');

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'APPROVE_TRANSACTION',
      entityType: 'Transaction',
      details: 'Approved PREMIUM subscription for Clinique Chifaa',
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'APPROVE_TRANSACTION',
      entityType: 'Transaction',
      details: 'Approved PREMIUM subscription for Al-Amal Laboratory',
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'REJECT_TRANSACTION',
      entityType: 'Transaction',
      details: 'Rejected BASIC subscription for Hassan Law Office - unclear receipt',
    },
  });

  await db.auditLog.create({
    data: {
      userId: agencyOwner.id,
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      details: 'Created General Consultation service',
    },
  });

  await db.auditLog.create({
    data: {
      userId: agencyOwner.id,
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      details: 'Created Specialist Consultation service',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📋 Demo accounts:');
  console.log('  Admin:         admin / admin123');
  console.log('  Customer 1:    ahmed / user123');
  console.log('  Customer 2:    fatima / user123');
  console.log('  Customer 3:    youssef / user123');
  console.log('  Customer 4:    karim / user123');
  console.log('  Customer 5:    amina / user123');
  console.log('  Customer 6:    omar / user123');
  console.log('  Customer 7:    sara / user123');
  console.log('  Agency Owner:  clinic01 / agency123');
  console.log('  Agency Staff:  receptionist01 / agency123');
  console.log('');
  console.log('🏥 Agencies:');
  console.log('  CLINIC01 - عيادة الشفاء (PREMIUM, ACTIVE, Sponsored)');
  console.log('  LAB01    - مختبر الأمل (PREMIUM, ACTIVE, Sponsored)');
  console.log('  TRAVEL01 - وكالة السفر النجمية (BASIC, ACTIVE)');
  console.log('  LAW01    - مكتب المحامي حسان (BASIC, ACTIVE)');
  console.log('  GOV01    - مديرية الضرائب (PREMIUM, ACTIVE)');
  console.log('  CLINIC02 - عيادة النور (BASIC, INACTIVE, Sponsored)');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
