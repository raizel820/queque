/**
 * DALTI / QueueWise — E2E Smoke Tests
 * =====================================
 * Quick API smoke tests to verify the app still works after load testing.
 * Run: npx playwright test tests/smoke.spec.ts
 *
 * Tests cover all major API surfaces:
 *   Auth: login, register
 *   Customer: browse agencies, active reservations, notifications, favorites
 *   Agency: stats, call-next, walk-in, services
 *   Admin: dashboard, users, agencies
 *   System: cron jobs, FAQs
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

// Read seed data for credentials
import fs from 'fs'
import path from 'path'
let seedData: Record<string, unknown> | null = null
try {
  const raw = fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf-8')
  seedData = JSON.parse(raw)
} catch {
  seedData = null
}

const CUSTOMER = seedData?.customers?.[0] || { username: 'user001', password: 'test1234', id: '' }
const AGENCY_OWNER = seedData?.agencyOwners?.[0] || { username: 'owner01', password: 'test1234', agencyId: '', agencyCode: '' }
const ADMIN = seedData?.admin || { username: 'admin', password: 'test1234' }

// ── Landing Page ─────────────────────────────────────────
test('Landing page loads successfully', async ({ page }) => {
  const response = await page.goto(BASE_URL)
  // Page returns 200 (or 404 for hash routes — Next.js SPA behavior)
  expect(response!.status()).toBeLessThan(500)

  // Check that the app title is present
  await page.waitForSelector('text=QueueWise', { timeout: 15000 })
  const title = await page.title()
  expect(title).toContain('QueueWise')
})

// ── Auth: Customer Login ─────────────────────────────────
test('Customer login API works', async ({ request }) => {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      username: CUSTOMER.username,
      password: CUSTOMER.password,
      expectedRole: 'CUSTOMER',
    },
  })

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.user.role).toBe('CUSTOMER')
})

// ── Auth: Agency Owner Login ─────────────────────────────
test('Agency owner login API works', async ({ request }) => {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      username: AGENCY_OWNER.username,
      password: AGENCY_OWNER.password,
      expectedRole: 'AGENCY_OWNER',
    },
  })

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.user.role).toBe('AGENCY_OWNER')
})

// ── Auth: Admin Login ────────────────────────────────────
test('Admin login API works', async ({ request }) => {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      username: ADMIN.username,
      password: ADMIN.password,
      expectedRole: 'AGENCY_OWNER', // Admin can login from any tab
    },
  })

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.user.role).toBe('SUPER_ADMIN')
})

// ── Auth: Registration ───────────────────────────────────
test('Customer registration API works', async ({ request }) => {
  const randNum = Math.floor(Math.random() * 99999)
  const res = await request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      username: `smoke_${randNum}`,
      fullName: `Smoke Test User ${randNum}`,
      password: 'test1234',
      role: 'CUSTOMER',
    },
  })

  // Should succeed (201) or conflict if username taken (409)
  expect([201, 409]).toContain(res.status())

  if (res.status() === 201) {
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.user.role).toBe('CUSTOMER')
  }
})

// ── Customer: Agency Browsing ────────────────────────────
test('Agency browsing API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/agencies?limit=10`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.agencies.length).toBeGreaterThan(0)
  // Verify agency has expected fields
  const agency = body.agencies[0]
  expect(agency).toHaveProperty('id')
  expect(agency).toHaveProperty('name')
  expect(agency).toHaveProperty('category')
})

// ── Customer: Active Reservations ────────────────────────
test('Customer active reservations API works', async ({ request }) => {
  if (!CUSTOMER.id) { test.skip(); return }

  const res = await request.get(`${BASE_URL}/api/reservations/active?userId=${CUSTOMER.id}`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(Array.isArray(body.reservations)).toBe(true)
})

// ── Customer: Notifications ──────────────────────────────
test('Customer notifications API works', async ({ request }) => {
  if (!CUSTOMER.id) { test.skip(); return }

  const res = await request.get(`${BASE_URL}/api/notifications?userId=${CUSTOMER.id}`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(Array.isArray(body.notifications)).toBe(true)
})

// ── Customer: Favorites ──────────────────────────────────
test('Favorites API works', async ({ request }) => {
  if (!CUSTOMER.id || !AGENCY_OWNER.agencyId) { test.skip(); return }

  // Toggle favorite
  const toggleRes = await request.post(`${BASE_URL}/api/favorites`, {
    data: {
      userId: CUSTOMER.id,
      agencyId: AGENCY_OWNER.agencyId,
    },
  })

  expect([200, 201]).toContain(toggleRes.status())

  // Get favorites
  const listRes = await request.get(`${BASE_URL}/api/favorites?userId=${CUSTOMER.id}`)
  expect(listRes.status()).toBe(200)
})

// ── Agency: Stats ────────────────────────────────────────
test('Agency stats API works', async ({ request }) => {
  if (!AGENCY_OWNER.agencyId) { test.skip(); return }

  const res = await request.get(`${BASE_URL}/api/agency/stats?agencyId=${AGENCY_OWNER.agencyId}`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('todayReservations')
  expect(body).toHaveProperty('currentlyWaiting')
  expect(body).toHaveProperty('servedToday')
})

// ── Agency: Call Next ────────────────────────────────────
test('Agency call-next API works (200 or 404)', async ({ request }) => {
  if (!AGENCY_OWNER.agencyId) { test.skip(); return }

  const res = await request.post(`${BASE_URL}/api/agency/queue/call-next`, {
    data: { agencyId: AGENCY_OWNER.agencyId },
  })

  // 200 = found next customer, 404 = no one waiting
  expect([200, 404]).toContain(res.status())
})

// ── Agency: Walk-In ──────────────────────────────────────
test('Agency walk-in API works', async ({ request }) => {
  if (!AGENCY_OWNER.agencyId) { test.skip(); return }

  const res = await request.post(`${BASE_URL}/api/agency/queue/walk-in`, {
    data: {
      agencyId: AGENCY_OWNER.agencyId,
      customerName: 'Smoke Test Walk-In',
    },
  })

  // 201 = created, 400 = queue closed/full
  expect([201, 400]).toContain(res.status())
})

// ── Agency: Services ─────────────────────────────────────
test('Agency services API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/agency/services`)

  expect(res.status()).toBe(200)
})

// ── Admin: Dashboard ─────────────────────────────────────
test('Admin dashboard API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/admin/dashboard`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('stats')
  expect(body.stats).toHaveProperty('totalAgencies')
  expect(body.stats).toHaveProperty('totalUsers')
})

// ── Admin: Users List ────────────────────────────────────
test('Admin users API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/admin/users?limit=5`)

  expect(res.status()).toBe(200)
})

// ── Admin: Agencies List ─────────────────────────────────
test('Admin agencies API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/admin/agencies?limit=5`)

  expect(res.status()).toBe(200)
})

// ── System: Cron Check Reminders ─────────────────────────
test('Cron check-reminders API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/cron/check-reminders`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('checked')
  expect(body).toHaveProperty('remindersSent')
})

// ── System: Cron Auto-Skip ───────────────────────────────
test('Cron auto-skip API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/cron/auto-skip`)

  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('checked')
  expect(body).toHaveProperty('skipped')
})

// ── System: Public FAQs ──────────────────────────────────
test('Public FAQs API works', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/faqs`)

  expect(res.status()).toBe(200)
})

// ── End-to-End: Full Join Queue Flow ─────────────────────
test('Full join-queue flow works', async ({ request }) => {
  if (!CUSTOMER.id || !AGENCY_OWNER.agencyId) { test.skip(); return }

  // Step 1: Login
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      username: CUSTOMER.username,
      password: CUSTOMER.password,
      expectedRole: 'CUSTOMER',
    },
  })
  expect(loginRes.status()).toBe(200)

  // Step 2: Browse agencies
  const agenciesRes = await request.get(`${BASE_URL}/api/agencies?limit=10`)
  expect(agenciesRes.status()).toBe(200)

  // Step 3: Join queue (may fail if duplicate or queue closed)
  const joinRes = await request.post(`${BASE_URL}/api/reservations`, {
    data: {
      userId: CUSTOMER.id,
      agencyId: AGENCY_OWNER.agencyId,
    },
  })
  // Accept 201 (created), 409 (duplicate), or 400 (queue closed/paused)
  expect([201, 409, 400]).toContain(joinRes.status())

  // Step 4: Check active reservations
  const activeRes = await request.get(`${BASE_URL}/api/reservations/active?userId=${CUSTOMER.id}`)
  expect(activeRes.status()).toBe(200)
})
