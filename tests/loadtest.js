/**
 * DALTI / QueueWise — Full-Day Load Test
 * =======================================
 * Run:   k6 run tests/loadtest.js
 * Smoke: k6 run --iterations 10 --vus 2 tests/loadtest.js
 * Ramp:  k6 run --stage 10s:10,30s:50,60s:100,30s:50,10s:10 tests/loadtest.js
 *
 * Scenarios (weighted):
 *   Customer browsing (20%), Join queue (15%), Cancel/Postpone/Rate (10%),
 *   Favorites+Profile (10%), Agency actions (15%), Login/Register (10%),
 *   Admin reads (10%), Cron jobs (5%), Registration (5%)
 *
 * Prerequisites:
 *   - Run `npx tsx tests/seed.ts` first
 *   - Dev server running on localhost:3000
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// ── Custom Metrics ───────────────────────────────────────
var errorRate = new Rate('errors')
var loginDuration = new Trend('login_duration', true)
var reservationDuration = new Trend('reservation_duration', true)
var callNextDuration = new Trend('call_next_duration', true)
var searchDuration = new Trend('agencies_search_duration', true)
var cancelCounter = new Counter('cancels_total')
var postponeCounter = new Counter('postpones_total')
var joinCounter = new Counter('joins_total')
var registerCounter = new Counter('registers_total')

// ── Configuration ────────────────────────────────────────
var BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

var seedData
try {
  seedData = JSON.parse(open('./seed-data.json'))
} catch (e) {
  console.error('Cannot load tests/seed-data.json - run npx tsx tests/seed.ts first')
  seedData = null
}

// ── Options ──────────────────────────────────────────────
export var options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 50 },
    { duration: '2m',  target: 100 },
    { duration: '3m',  target: 250 },
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.25'],
    login_duration: ['p(95)<2000'],
    reservation_duration: ['p(95)<5000'],
    call_next_duration: ['p(95)<3000'],
  },
  userAgent: 'k6-loadtest/1.0',
}

// ── Helpers ──────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function think(minMs, maxMs) {
  sleep(randInt(minMs, maxMs) / 1000)
}
function get(path) {
  return http.get(BASE_URL + path, { tags: { name: path.split('?')[0] } })
}
function post(path, body) {
  return http.post(BASE_URL + path, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: path },
  })
}
function patch(path, body) {
  return http.patch(BASE_URL + path, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: path },
  })
}
function json(res) {
  try { return JSON.parse(res.body) } catch (e) { return null }
}
// Track unexpected errors only (5xx)
function trackError(res) {
  if (res.status >= 500) {
    errorRate.add(1)
    return true
  }
  errorRate.add(0)
  return false
}

// ── Scenario 1: Customer Browsing ────────────────────────
function customerBrowse(customer) {
  group('Customer Browse', function () {
    var searches = ['', 'clinic', 'lab', 'government', 'agency', 'law']
    var q = pick(searches)
    var r = get('/api/agencies?search=' + q + '&limit=20')
    searchDuration.add(r.timings.duration)
    trackError(r)

    think(1000, 3000)

    if (seedData && seedData.agencies && seedData.agencies.length > 0) {
      var activeAg = seedData.agencies.filter(function (a) { return a.isActive })
      var ag = activeAg.length > 0 ? pick(activeAg) : pick(seedData.agencies)

      var r2 = get('/api/agencies/' + ag.id)
      trackError(r2)
      think(500, 2000)

      var r3 = get('/api/agency/stats?agencyId=' + ag.id)
      trackError(r3)
    }

    trackError(get('/api/favorites?userId=' + customer.id))
    trackError(get('/api/reservations/active?userId=' + customer.id))
    trackError(get('/api/notifications?userId=' + customer.id))
    trackError(get('/api/faqs'))
  })
}

// ── Scenario 2: Login ───────────────────────────────────
function doLogin(user) {
  group('Login', function () {
    var r = post('/api/auth/login', {
      username: user.username,
      password: user.password,
      expectedRole: user.role === 'AGENCY_OWNER' ? 'AGENCY_OWNER' : 'CUSTOMER',
    })
    loginDuration.add(r.timings.duration)
    trackError(r)
  })
}

// ── Scenario 3: Register ────────────────────────────────
function doRegister() {
  group('Register', function () {
    var n = randInt(10000, 99999)
    var r = post('/api/auth/register', {
      username: 'ltuser' + n,
      fullName: 'Load Test User ' + n,
      password: 'test1234',
      phoneNumber: '07' + randInt(10000000, 99999999),
      role: Math.random() > 0.7 ? 'AGENCY_OWNER' : 'CUSTOMER',
    })
    trackError(r) // 201 or 409 are both fine
    registerCounter.add(1)
  })
}

// ── Scenario 4: Join Queue ──────────────────────────────
function joinQueue(customer) {
  group('Join Queue', function () {
    if (!seedData || !seedData.agencies || seedData.agencies.length === 0) return
    var activeAg = seedData.agencies.filter(function (a) { return a.isActive })
    if (activeAg.length === 0) return
    var ag = pick(activeAg)
    var r = post('/api/reservations', { userId: customer.id, agencyId: ag.id })
    reservationDuration.add(r.timings.duration)
    trackError(r) // 201, 409, 400 are all valid
    if (r.status === 201) joinCounter.add(1)
  })
}

// ── Scenario 5: Cancel / Postpone ───────────────────────
function cancelOrPostpone(customer) {
  group('Cancel/Postpone', function () {
    var r = get('/api/reservations/active?userId=' + customer.id)
    if (trackError(r)) return

    var data = json(r)
    if (!data || !data.reservations) return
    var waiting = data.reservations.filter(function (x) { return x.status === 'WAITING' })
    if (waiting.length === 0) return

    var resv = pick(waiting)
    if (Math.random() > 0.5) {
      var cr = post('/api/reservations/' + resv.id + '/cancel', { userId: customer.id })
      if (!trackError(cr)) cancelCounter.add(1)
    } else {
      var pr = post('/api/reservations/' + resv.id + '/postpone', { userId: customer.id, positions: randInt(1, 5) })
      if (!trackError(pr)) postponeCounter.add(1)
    }
  })
}

// ── Scenario 6: Agency Actions ──────────────────────────
function agencyActions(owner) {
  group('Agency Actions', function () {
    if (!owner.agencyId) return

    trackError(get('/api/agency/stats?agencyId=' + owner.agencyId))

    var cr = post('/api/agency/queue/call-next', { agencyId: owner.agencyId })
    callNextDuration.add(cr.timings.duration)
    trackError(cr) // 200 or 404 are both fine
    think(2000, 5000)

    if (Math.random() < 0.1) {
      trackError(post('/api/agency/queue/toggle-pause', { agencyId: owner.agencyId }))
      think(3000, 8000)
      trackError(post('/api/agency/queue/toggle-pause', { agencyId: owner.agencyId }))
    }

    if (Math.random() < 0.2) {
      trackError(post('/api/agency/queue/walk-in', {
        agencyId: owner.agencyId,
        customerName: 'Walk-in ' + randInt(1, 999),
      }))
    }

    trackError(get('/api/agency/services'))
    trackError(get('/api/reservations/agency?agencyId=' + owner.agencyId))
    trackError(get('/api/agency/activity?agencyId=' + owner.agencyId))
  })
}

// ── Scenario 7: Admin Dashboard ─────────────────────────
function adminReads() {
  group('Admin Dashboard', function () {
    trackError(get('/api/admin/dashboard'))
    trackError(get('/api/admin/analytics'))
    trackError(get('/api/admin/users?limit=20&offset=0'))
    trackError(get('/api/admin/agencies?limit=20&offset=0'))
    trackError(get('/api/admin/stats'))
    trackError(get('/api/admin/audit-logs?limit=20'))
    trackError(get('/api/transactions'))
  })
}

// ── Scenario 8: Cron Jobs ───────────────────────────────
function cronJobs() {
  group('Cron Jobs', function () {
    trackError(get('/api/cron/check-reminders'))
    think(1000, 2000)
    trackError(get('/api/cron/auto-skip'))
    think(1000, 2000)
    trackError(get('/api/cron/check-sms-fallback'))
  })
}

// ── Scenario 9: Favorites + Profile ─────────────────────
function favsAndProfile(customer) {
  group('Favorites + Profile', function () {
    if (seedData && seedData.agencies && seedData.agencies.length > 0) {
      var ag = pick(seedData.agencies)
      trackError(post('/api/favorites', { userId: customer.id, agencyId: ag.id }))
    }
    trackError(get('/api/user/profile?userId=' + customer.id))
    trackError(get('/api/user/stats?userId=' + customer.id))
    trackError(get('/api/user/preferences?userId=' + customer.id))
    patch('/api/notifications', { userId: customer.id, markAll: true })
  })
}

// ── Scenario 10: Rate Completed ─────────────────────────
function rateReservation(customer) {
  group('Rate Reservation', function () {
    var r = get('/api/reservations/history?userId=' + customer.id + '&limit=10')
    if (trackError(r)) return
    var data = json(r)
    if (!data || !data.reservations) return
    var completed = data.reservations.filter(function (x) { return x.status === 'COMPLETED' && !x.rating })
    if (completed.length === 0) return
    var resv = pick(completed)
    trackError(post('/api/reservations/' + resv.id + '/rate', {
      userId: customer.id,
      rating: randInt(3, 5),
      feedback: 'Load test feedback ' + randInt(1, 999),
    }))
  })
}

// ══════════════════════════════════════════════════════════
// ── Main VU Function ─────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function () {
  if (!seedData) {
    console.error('No seed data - skipping')
    sleep(1)
    return
  }

  var roll = Math.random()

  if (roll < 0.20) {
    customerBrowse(pick(seedData.customers))
    think(2000, 6000)
  } else if (roll < 0.35) {
    var c = pick(seedData.customers)
    doLogin({ username: c.username, password: c.password, role: 'CUSTOMER' })
    think(500, 1500)
    joinQueue(c)
    think(2000, 5000)
  } else if (roll < 0.45) {
    var c2 = pick(seedData.customers)
    cancelOrPostpone(c2)
    think(1000, 3000)
    rateReservation(c2)
    think(1000, 2000)
  } else if (roll < 0.55) {
    favsAndProfile(pick(seedData.customers))
    think(1000, 3000)
  } else if (roll < 0.70) {
    var ow = pick(seedData.agencyOwners)
    doLogin({ username: ow.username, password: ow.password, role: 'AGENCY_OWNER' })
    think(500, 1500)
    agencyActions(ow)
    think(3000, 8000)
  } else if (roll < 0.80) {
    if (Math.random() < 0.6) {
      if (Math.random() < 0.7) {
        var c3 = pick(seedData.customers)
        doLogin({ username: c3.username, password: c3.password, role: 'CUSTOMER' })
      } else {
        var ow2 = pick(seedData.agencyOwners)
        doLogin({ username: ow2.username, password: ow2.password, role: 'AGENCY_OWNER' })
      }
    } else {
      doRegister()
    }
    think(1000, 4000)
  } else if (roll < 0.90) {
    adminReads()
    think(2000, 5000)
  } else {
    cronJobs()
    think(5000, 15000)
  }
}

// ── Handle Summary ───────────────────────────────────────
export function handleSummary(data) {
  var m = data.metrics || {}
  var rd = m.http_req_duration && m.http_req_duration.values ? m.http_req_duration.values : {}
  var reqs = m.http_reqs && m.http_reqs.values ? m.http_reqs.values.count : 0
  var errR = m.errors && m.errors.values ? m.errors.values.rate : 0
  var p95 = rd['p(95)'] || 0
  var p99 = rd['p(99)'] || 0
  var avg = rd.avg || 0
  var joins = m.joins_total && m.joins_total.values ? m.joins_total.values.count : 0
  var cancels = m.cancels_total && m.cancels_total.values ? m.cancels_total.values.count : 0
  var postpones = m.postpones_total && m.postpones_total.values ? m.postpones_total.values.count : 0
  var registers = m.registers_total && m.registers_total.values ? m.registers_total.values.count : 0

  var s = '\n==================================================\n' +
    '       DALTI Load Test -- Summary Report          \n' +
    '==================================================\n' +
    '  Total Requests:  ' + String(reqs).padStart(28) + '\n' +
    '  5xx Error Rate:  ' + (errR * 100).toFixed(1).padStart(27) + '%\n' +
    '  Avg Latency:     ' + (Math.round(avg) + 'ms').padStart(28) + '\n' +
    '  P95 Latency:     ' + (Math.round(p95) + 'ms').padStart(28) + '\n' +
    '  P99 Latency:     ' + (Math.round(p99) + 'ms').padStart(28) + '\n' +
    '--------------------------------------------------\n' +
    '  Queue Joins:     ' + String(joins).padStart(28) + '\n' +
    '  Cancels:         ' + String(cancels).padStart(28) + '\n' +
    '  Postpones:       ' + String(postpones).padStart(28) + '\n' +
    '  Registrations:   ' + String(registers).padStart(28) + '\n' +
    '==================================================\n'

  console.log(s)
  return {
    stdout: '',
    'tests/loadtest-report.json': JSON.stringify(data, null, 2),
    'tests/loadtest-summary.txt': s,
  }
}
