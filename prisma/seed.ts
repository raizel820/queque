import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database (brand new state)...');

  // ─── Clean up existing data (order matters for foreign keys) ─────────────────────────
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.globalAnnouncement.deleteMany();
  await db.announcement.deleteMany();
  await db.review.deleteMany();
  await db.reservation.deleteMany();
  await db.transaction.deleteMany();
  await db.smsLog.deleteMany();
  await db.smsSettings.deleteMany();
  await db.favorite.deleteMany();
  await db.queueSettings.deleteMany();
  await db.service.deleteMany();
  await db.agencyStaff.deleteMany();
  await db.smsPurchase.deleteMany();
  await db.fAQ.deleteMany();
  await db.agency.deleteMany();
  await db.user.deleteMany();

  // ═══════════════════════════════════════════════════════
  // ─── Create Super Admin (only user) ──────────────────
  // ═══════════════════════════════════════════════════════
  console.log('👤 Creating super admin...');

  await db.user.create({
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

  // ═══════════════════════════════════════════════════════
  // ─── Create Welcome Global Announcement ──────────────
  // ═══════════════════════════════════════════════════════
  console.log('📢 Creating welcome announcement...');

  const admin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  if (admin) {
    await db.globalAnnouncement.create({
      data: {
        message: 'مرحباً بكم في DALTI! سجّل الآن واحجز دورك بدون انتظار.',
        type: 'INFO',
        createdBy: admin.id,
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // ─── Done ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  console.log('✅ Database seeded successfully (brand new state)');
  console.log('👤 Admin login: admin / admin123');

  await db.$disconnect();
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
