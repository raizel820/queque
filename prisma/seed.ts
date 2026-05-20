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


  // ── Additional Customer Users ──






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


  // ═══════════════════════════════════════════════════════
  // ─── Create Agency Staff Relations ────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('👷 Creating agency staff...');



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
 







  // ═══════════════════════════════════════════════════════
  // ─── Create Queue Settings ────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('⚙️ Creating queue settings...');



  // ═══════════════════════════════════════════════════════
  // ─── Create Favorites ─────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('⭐ Creating favorites...');



  // ═══════════════════════════════════════════════════════
  // ─── Create Sample Reservations ───────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('🎫 Creating reservations...');

  // ── WAITING reservations ──


  // ── COMPLETED reservations with ratings ──



  // ── More WAITING reservations to fill the queues ──


  // ═══════════════════════════════════════════════════════
  // ─── Create Notifications ─────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('🔔 Creating notifications...');





  // ═══════════════════════════════════════════════════════
  // ─── Create Transactions ──────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('💰 Creating transactions...');



  // ═══════════════════════════════════════════════════════
  // ─── Create Global Announcements ──────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📢 Creating global announcements...');



  // ═══════════════════════════════════════════════════════
  // ─── Create Agency Announcements ──────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📣 Creating agency announcements...');



  // ═══════════════════════════════════════════════════════
  // ─── Create Audit Logs ────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📝 Creating audit logs...');

 

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
