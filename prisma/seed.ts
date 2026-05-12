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




  // ─── Create Queue Settings ─────────────────────────
  console.log('⚙️ Creating queue settings...');


  // ─── Create Sample Reservations ────────────────────
  console.log('🎫 Creating reservations...');


  // ─── Create Transactions ───────────────────────────
  console.log('💰 Creating transactions...');



  // ─── Create Notifications ──────────────────────────
  console.log('🔔 Creating notifications...');



  // ─── Create Audit Logs ─────────────────────────────
  console.log('📝 Creating audit logs...');



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
