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
  // ─── Create Admin User ────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('👤 Creating admin user...');

  const admin = await db.user.create({
    data: {
      username: 'admin',
      fullName: 'Platform Admin',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      language: 'ar',
      email: 'admin@blasti.dz',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════
  // ─── Create Welcome Announcement ──────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('📢 Creating welcome announcement...');

  await db.globalAnnouncement.create({
    data: {
      message: 'مرحباً بكم في BLASTI! المنصة الآن متاحة في ولاية المسيلة. سجّل الآن واحجز دورك بدون انتظار.',
      type: 'INFO',
      createdBy: admin.id,
    },
  });

  console.log('✅ Seed completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
