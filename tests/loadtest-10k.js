/**
 * DALTI / QueueWise — 10,000 Concurrent User Load Test
 * ====================================================
 * Run:   k6 run tests/loadtest-10k.js
 * Quick: k6 run --iterations 10 --vus 2 tests/loadtest-10k.js
 * 1K:    k6 run --stage 30s:10,1m:100,2m:500,3m:1000,1m:500,30s:0 tests/loadtest-10k.js
 * 5K:    k6 run --stage 30s:10,1m:500,2m:1000,3m:5000,1m:1000,30s:0 tests/loadtest-10k.js
 *
 * Stages (~40 minutes total):
 *   1. Warm-up      — 2min ramp to 100 VUs
 *   2. Baseline      — 3min hold at 100 VUs
 *   3. Scale-up      — 5min ramp to 500 VUs
 *   4. Hold          — 3min hold at 500 VUs
 *   5. Stress        — 5min ramp to 1000 VUs
 *   6. Hold          — 3min hold at 1000 VUs
 *   7. Peak Stress   — 5min ramp to 2000 VUs
 *   8. Hold          — 3min hold at 2000 VUs
 *   9. Spike         — 2min ramp to 5000 VUs
 *  10. Hold          — 2min hold at 5000 VUs
 *  11. Recovery      — 5min ramp down to 1000 VUs
 *  12. Cool-down     — 2min ramp down to 0
 *
 * Scenarios (weighted):
 *   Customer browsing (25%), Join queue (15%), Cancel/Postpone/Rate (10%),
 *   Favorites+Profile (10%), Agency actions (15%), Login/Register (10%),
 *   Admin dashboard reads (8%), Cron jobs (2%), Registration (5%)
 *
 * Prerequisites:
 *   - Run the 10K seed script first (creates seed-data-10k.json)
 *   - Dev server running on localhost:3000
 *
 * IMPORTANT: Uses ES5/6 syntax only (var, no spread, no ?., no ??)
 *            k6 does not support modern JS features.
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'

// ── Custom Metrics ───────────────────────────────────────
var errorRate = new Rate('errors')
var loginDuration = new Trend('login_duration', true)
var reservationDuration = new Trend('reservation_duration', true)
var callNextDuration = new Trend('call_next_duration', true)
var searchDuration = new Trend('agencies_search_duration', true)
var adminDashboardDuration = new Trend('admin_dashboard_duration', true)
var cronDuration = new Trend('cron_duration', true)
var cancelCounter = new Counter('cancels_total')
var postponeCounter = new Counter('postpones_total')
var joinCounter = new Counter('joins_total')
var registerCounter = new Counter('registers_total')
var rateCounter = new Counter('rates_total')
var walkInCounter = new Counter('walkins_total')
var pauseToggleCounter = new Counter('pause_toggles_total')
var favoriteCounter = new Counter('favorites_total')
var loginCounter = new Counter('logins_total')
var browseCounter = new Counter('browses_total')

// Per-scenario error rates
var browseErrors = new Rate('browse_errors')
var joinErrors = new Rate('join_errors')
var cancelPostponeErrors = new Rate('cancel_postpone_errors')
var favsProfileErrors = new Rate('favs_profile_errors')
var agencyErrors = new Rate('agency_errors')
var authErrors = new Rate('auth_errors')
var adminErrors = new Rate('admin_errors')
var cronErrors = new Rate('cron_errors')
var registerErrors = new Rate('register_errors')

// Throughput tracking
var requestCounter = new Counter('requests_total')
var throughputGauge = new Gauge('throughput_rps')

// Connection tracking
var activeConnections = new Gauge('active_connections')

// ── Configuration ────────────────────────────────────────
var BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Load 10K seed data (with fallback to standard seed data)
var seedData
try {
  seedData = JSON.parse(open('./seed-data-10k.json'))
  console.log('[10K] Loaded seed-data-10k.json — ' +
    (seedData.customers ? seedData.customers.length : 0) + ' customers, ' +
    (seedData.agencies ? seedData.agencies.length : 0) + ' agencies, ' +
    (seedData.agencyOwners ? seedData.agencyOwners.length : 0) + ' owners')
} catch (e) {
  console.warn('[10K] Cannot load seed-data-10k.json, trying seed-data.json fallback')
  try {
    seedData = JSON.parse(open('./seed-data.json'))
    console.warn('[10K] Loaded fallback seed-data.json (not optimized for 10K)')
  } catch (e2) {
    console.error('[10K] No seed data available — run the 10K seed script first')
    seedData = null
  }
}

// ── Options — 12-Stage 10K Progression ───────────────────
export var options = {
  stages: [
    { duration: '2m', target: 100 },      // Stage 1:  Warm-up
    { duration: '3m', target: 100 },      // Stage 2:  Baseline hold
    { duration: '5m', target: 500 },      // Stage 3:  Scale-up
    { duration: '3m', target: 500 },      // Stage 4:  Hold at 500
    { duration: '5m', target: 1000 },     // Stage 5:  Stress ramp
    { duration: '3m', target: 1000 },     // Stage 6:  Hold at 1000
    { duration: '5m', target: 2000 },     // Stage 7:  Peak stress ramp
    { duration: '3m', target: 2000 },     // Stage 8:  Hold at 2000
    { duration: '2m', target: 5000 },     // Stage 9:  Spike to 5000
    { duration: '2m', target: 5000 },     // Stage 10: Hold at 5000
    { duration: '5m', target: 1000 },     // Stage 11: Recovery ramp down
    { duration: '2m', target: 0 },        // Stage 12: Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],     // 5s P95 acceptable at peak
    errors: ['rate<0.30'],                  // 30% error rate threshold (at 10K, some failures expected)
    login_duration: ['p(95)<3000'],
    reservation_duration: ['p(95)<8000'],
    call_next_duration: ['p(95)<5000'],
  },
  userAgent: 'k6-loadtest-10k/1.0',
  // Allow k6 to handle high connection counts
  noConnectionReuse: false,
  batch: 20,       // max concurrent requests per batch
  batchPerHost: 10, // max concurrent requests per host per batch
}

// ── Helpers ──────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// More relaxed think times for 10K scale (simulates real user behavior)
function think(minMs, maxMs) {
  sleep(randInt(minMs, maxMs) / 1000)
}

// Pick a random item weighted towards the tail of the array (better distribution at scale)
function pickDistributed(arr) {
  if (!arr || arr.length === 0) return null
  // Use a slight exponential bias to spread across all items, not just first few
  var idx = Math.floor(Math.pow(Math.random(), 0.7) * arr.length)
  if (idx >= arr.length) idx = arr.length - 1
  return arr[idx]
}

// Pick from a range of indices (for distributing across many agencies/customers)
function pickFromRange(arr, chunkSize) {
  if (!arr || arr.length === 0) return null
  var vuId = __VU || 0
  var chunk = Math.floor(vuId / chunkSize) % Math.ceil(arr.length / chunkSize)
  var startIdx = chunk * chunkSize
  var endIdx = Math.min(startIdx + chunkSize, arr.length)
  if (startIdx >= arr.length) startIdx = 0
  if (endIdx > arr.length) endIdx = arr.length
  var idx = startIdx + Math.floor(Math.random() * (endIdx - startIdx))
  return arr[idx]
}

function get(path) {
  var res = http.get(BASE_URL + path, { tags: { name: path.split('?')[0] } })
  requestCounter.add(1)
  return res
}

function post(path, body) {
  var res = http.post(BASE_URL + path, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: path },
  })
  requestCounter.add(1)
  return res
}

function patch(path, body) {
  var res = http.patch(BASE_URL + path, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: path },
  })
  requestCounter.add(1)
  return res
}

function del(path) {
  var res = http.del(BASE_URL + path, null, { tags: { name: path } })
  requestCounter.add(1)
  return res
}

function json(res) {
  try { return JSON.parse(res.body) } catch (e) { return null }
}

// Track errors — returns true if 5xx error
function trackError(res) {
  if (res.status >= 500) {
    errorRate.add(1)
    return true
  }
  errorRate.add(0)
  return false
}

// Track per-scenario errors
function trackScenarioError(scenarioRate, res) {
  if (res.status >= 500) {
    scenarioRate.add(1)
    errorRate.add(1)
    return true
  }
  scenarioRate.add(0)
  errorRate.add(0)
  return false
}

// Get active agencies (cached per VU iteration)
var _activeAgencies = null
function getActiveAgencies() {
  if (_activeAgencies !== null) return _activeAgencies
  if (!seedData || !seedData.agencies) return []
  _activeAgencies = seedData.agencies.filter(function (a) { return a.isActive })
  if (_activeAgencies.length === 0) _activeAgencies = seedData.agencies
  return _activeAgencies
}

// Pick a random customer (distributed across 5000)
function pickCustomer() {
  if (!seedData || !seedData.customers || seedData.customers.length === 0) return null
  // Use VU-based distribution + randomness to spread across all customers
  return pickFromRange(seedData.customers, 50)
}

// Pick a random agency (distributed across 100)
function pickAgency() {
  var active = getActiveAgencies()
  if (active.length === 0) return null
  return pickDistributed(active)
}

// ── Scenario 1: Customer Browsing (25%) ──────────────────
// Read-heavy, most common action at scale
function customerBrowse(customer) {
  group('Customer Browse', function () {
    if (!customer) return
    browseCounter.add(1)

    // Search agencies with various terms
    var searches = ['', 'clinic', 'lab', 'government', 'agency', 'law', 'bank', 'hospital', 'office', 'service']
    var q = pick(searches)
    var limit = randInt(10, 50)
    var r = get('/api/agencies?search=' + q + '&limit=' + limit)
    searchDuration.add(r.timings.duration)
    trackScenarioError(browseErrors, r)
    think(2000, 5000)  // relaxed think time

    // View a specific agency profile
    var ag = pickAgency()
    if (ag) {
      var r2 = get('/api/agencies/' + ag.id)
      trackScenarioError(browseErrors, r2)
      think(1500, 4000)

      var r3 = get('/api/agency/stats?agencyId=' + ag.id)
      trackScenarioError(browseErrors, r3)
      think(1000, 3000)
    }

    // Check personal data (simulates dashboard loading)
    trackScenarioError(browseErrors, get('/api/favorites?userId=' + customer.id))
    trackScenarioError(browseErrors, get('/api/reservations/active?userId=' + customer.id))
    trackScenarioError(browseErrors, get('/api/notifications?userId=' + customer.id))

    // Occasionally check FAQs
    if (Math.random() < 0.2) {
      trackScenarioError(browseErrors, get('/api/faqs'))
    }
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
    loginCounter.add(1)
    trackScenarioError(authErrors, r)
  })
}

// ── Scenario 3: Register ────────────────────────────────
function doRegister() {
  group('Register', function () {
    var n = randInt(100000, 999999)
    var r = post('/api/auth/register', {
      username: 'lt10k_' + n,
      fullName: 'Load Test 10K User ' + n,
      password: 'test1234',
      phoneNumber: '07' + randInt(10000000, 99999999),
      role: Math.random() > 0.8 ? 'AGENCY_OWNER' : 'CUSTOMER',
    })
    trackScenarioError(registerErrors, r) // 201 or 409 are both fine
    registerCounter.add(1)
  })
}

// ── Scenario 4: Join Queue (15%) ─────────────────────────
// Write-heavy, creates reservations
function joinQueue(customer) {
  group('Join Queue', function () {
    if (!customer) return
    var ag = pickAgency()
    if (!ag) return

    // Optionally include preferredTime (10% of joins)
    var body = { userId: customer.id, agencyId: ag.id }
    if (Math.random() < 0.1) {
      var hours = randInt(8, 17)
      var mins = randInt(0, 59)
      body.preferredTime = hours + ':' + (mins < 10 ? '0' + mins : '' + mins)
      if (Math.random() < 0.3) {
        body.fixedTimeEnabled = true
      }
    }

    var r = post('/api/reservations', body)
    reservationDuration.add(r.timings.duration)
    trackScenarioError(joinErrors, r) // 201, 409, 400 are all valid
    if (r.status === 201) joinCounter.add(1)
  })
}

// ── Scenario 5: Cancel / Postpone / Rate (10%) ──────────
// Mixed read/write operations
function cancelOrPostpone(customer) {
  group('Cancel/Postpone/Rate', function () {
    if (!customer) return
    var r = get('/api/reservations/active?userId=' + customer.id)
    if (trackScenarioError(cancelPostponeErrors, r)) return

    var data = json(r)
    if (!data || !data.reservations) return
    var waiting = data.reservations.filter(function (x) { return x.status === 'WAITING' })
    if (waiting.length === 0) return

    var resv = pick(waiting)
    var action = Math.random()
    if (action < 0.4) {
      // Cancel
      var cr = post('/api/reservations/' + resv.id + '/cancel', { userId: customer.id })
      if (!trackScenarioError(cancelPostponeErrors, cr)) cancelCounter.add(1)
    } else if (action < 0.75) {
      // Postpone
      var pr = post('/api/reservations/' + resv.id + '/postpone', {
        userId: customer.id,
        positions: randInt(1, 10),
      })
      if (!trackScenarioError(cancelPostponeErrors, pr)) postponeCounter.add(1)
    } else {
      // Toggle fixed time
      var tr = post('/api/reservations/' + resv.id + '/toggle-fixed-time', { userId: customer.id })
      trackScenarioError(cancelPostponeErrors, tr)
    }
  })
}

// ── Scenario 6: Agency Actions (15%) ────────────────────
// call-next, pause, walk-in — heavier operations
function agencyActions(owner) {
  group('Agency Actions', function () {
    if (!owner || !owner.agencyId) return

    // Get stats first
    trackScenarioError(agencyErrors, get('/api/agency/stats?agencyId=' + owner.agencyId))
    think(500, 2000)

    // Call next customer (most common agency action)
    var cr = post('/api/agency/queue/call-next', { agencyId: owner.agencyId })
    callNextDuration.add(cr.timings.duration)
    trackScenarioError(agencyErrors, cr) // 200 or 404 are both fine
    think(3000, 8000)  // agencies think more between actions

    // Occasionally toggle pause
    if (Math.random() < 0.08) {
      trackScenarioError(agencyErrors, post('/api/agency/queue/toggle-pause', { agencyId: owner.agencyId }))
      pauseToggleCounter.add(1)
      think(5000, 12000)
      trackScenarioError(agencyErrors, post('/api/agency/queue/toggle-pause', { agencyId: owner.agencyId }))
      pauseToggleCounter.add(1)
    }

    // Walk-in customer
    if (Math.random() < 0.15) {
      trackScenarioError(agencyErrors, post('/api/agency/queue/walk-in', {
        agencyId: owner.agencyId,
        customerName: 'Walk-in-10K-' + randInt(1, 9999),
      }))
      walkInCounter.add(1)
    }

    // Read agency data
    trackScenarioError(agencyErrors, get('/api/agency/services'))
    trackScenarioError(agencyErrors, get('/api/reservations/agency?agencyId=' + owner.agencyId))

    // Check activity log occasionally
    if (Math.random() < 0.3) {
      trackScenarioError(agencyErrors, get('/api/agency/activity?agencyId=' + owner.agencyId))
    }
  })
}

// ── Scenario 7: Admin Dashboard Reads (8%) ──────────────
// Heavy aggregation queries
function adminReads() {
  group('Admin Dashboard', function () {
    var start = Date.now()

    trackScenarioError(adminErrors, get('/api/admin/dashboard'))
    trackScenarioError(adminErrors, get('/api/admin/analytics'))

    // Paginated user and agency lists (simulate browsing admin panels)
    var offset = randInt(0, 200)
    trackScenarioError(adminErrors, get('/api/admin/users?limit=20&offset=' + offset))

    var agOffset = randInt(0, 100)
    trackScenarioError(adminErrors, get('/api/admin/agencies?limit=20&offset=' + agOffset))

    trackScenarioError(adminErrors, get('/api/admin/stats'))

    // Audit logs (expensive query)
    if (Math.random() < 0.5) {
      trackScenarioError(adminErrors, get('/api/admin/audit-logs?limit=20'))
    }

    // Transactions
    if (Math.random() < 0.3) {
      trackScenarioError(adminErrors, get('/api/transactions'))
    }

    var elapsed = Date.now() - start
    adminDashboardDuration.add(elapsed)
  })
}

// ── Scenario 8: Cron Jobs (2%) ──────────────────────────
// Periodic background tasks
function cronJobs() {
  group('Cron Jobs', function () {
    var start = Date.now()

    trackScenarioError(cronErrors, get('/api/cron/check-reminders'))
    think(2000, 5000)  // cron spacing
    trackScenarioError(cronErrors, get('/api/cron/auto-skip'))
    think(2000, 5000)
    trackScenarioError(cronErrors, get('/api/cron/check-sms-fallback'))

    var elapsed = Date.now() - start
    cronDuration.add(elapsed)
  })
}

// ── Scenario 9: Favorites + Profile (10%) ───────────────
// Mixed read/write
function favsAndProfile(customer) {
  group('Favorites + Profile', function () {
    if (!customer) return

    // Toggle a favorite
    var ag = pickAgency()
    if (ag) {
      trackScenarioError(favsProfileErrors, post('/api/favorites', { userId: customer.id, agencyId: ag.id }))
      favoriteCounter.add(1)
    }
    think(1000, 3000)

    // Profile reads
    trackScenarioError(favsProfileErrors, get('/api/user/profile?userId=' + customer.id))
    trackScenarioError(favsProfileErrors, get('/api/user/stats?userId=' + customer.id))

    // Preferences (less common)
    if (Math.random() < 0.4) {
      trackScenarioError(favsProfileErrors, get('/api/user/preferences?userId=' + customer.id))
    }

    // Mark notifications
    trackScenarioError(favsProfileErrors, patch('/api/notifications', { userId: customer.id, markAll: true }))
  })
}

// ── Scenario 10: Rate Completed ─────────────────────────
function rateReservation(customer) {
  group('Rate Reservation', function () {
    if (!customer) return
    var r = get('/api/reservations/history?userId=' + customer.id + '&limit=10')
    if (trackScenarioError(cancelPostponeErrors, r)) return
    var data = json(r)
    if (!data || !data.reservations) return
    var completed = data.reservations.filter(function (x) { return x.status === 'COMPLETED' && !x.rating })
    if (completed.length === 0) return
    var resv = pick(completed)
    trackScenarioError(cancelPostponeErrors, post('/api/reservations/' + resv.id + '/rate', {
      userId: customer.id,
      rating: randInt(3, 5),
      feedback: 'Load test 10K feedback ' + randInt(1, 9999),
    }))
    rateCounter.add(1)
  })
}

// ══════════════════════════════════════════════════════════
// ── Main VU Function ─────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function () {
  if (!seedData) {
    console.error('[10K] No seed data — skipping iteration')
    sleep(5)
    return
  }

  // Update connection gauge
  activeConnections.add(1)

  // Weighted scenario selection matching the 10K spec
  var roll = Math.random()

  if (roll < 0.25) {
    // ── Customer Browsing (25%) ──
    var cust1 = pickCustomer()
    customerBrowse(cust1)
    think(3000, 8000)  // relaxed think times at scale

  } else if (roll < 0.40) {
    // ── Join Queue (15%) ──
    var cust2 = pickCustomer()
    if (cust2) {
      doLogin({ username: cust2.username, password: cust2.password, role: 'CUSTOMER' })
      think(1000, 3000)
    }
    joinQueue(cust2)
    think(3000, 7000)

  } else if (roll < 0.50) {
    // ── Cancel/Postpone/Rate (10%) ──
    var cust3 = pickCustomer()
    cancelOrPostpone(cust3)
    think(1500, 4000)
    rateReservation(cust3)
    think(2000, 5000)

  } else if (roll < 0.60) {
    // ── Favorites + Profile (10%) ──
    var cust4 = pickCustomer()
    favsAndProfile(cust4)
    think(2000, 6000)

  } else if (roll < 0.75) {
    // ── Agency Actions (15%) ──
    if (seedData.agencyOwners && seedData.agencyOwners.length > 0) {
      var ow = pickFromRange(seedData.agencyOwners, 10)
      if (ow) {
        doLogin({ username: ow.username, password: ow.password, role: 'AGENCY_OWNER' })
        think(1000, 3000)
        agencyActions(ow)
      }
    }
    think(4000, 10000)

  } else if (roll < 0.85) {
    // ── Login/Register (10%) ──
    if (Math.random() < 0.5) {
      // Login as customer
      if (seedData.customers && seedData.customers.length > 0) {
        var cust5 = pickCustomer()
        if (cust5) {
          doLogin({ username: cust5.username, password: cust5.password, role: 'CUSTOMER' })
        }
      }
    } else if (Math.random() < 0.6) {
      // Login as agency owner
      if (seedData.agencyOwners && seedData.agencyOwners.length > 0) {
        var ow2 = pick(seedData.agencyOwners)
        doLogin({ username: ow2.username, password: ow2.password, role: 'AGENCY_OWNER' })
      }
    } else {
      // Register
      doRegister()
    }
    think(2000, 6000)

  } else if (roll < 0.93) {
    // ── Admin Dashboard Reads (8%) ──
    adminReads()
    think(3000, 8000)

  } else if (roll < 0.95) {
    // ── Cron Jobs (2%) ──
    cronJobs()
    think(8000, 20000)  // long think between cron runs

  } else {
    // ── Registration (5%) ──
    doRegister()
    think(2000, 5000)
  }

  activeConnections.add(-1)
}

// ── Handle Summary ───────────────────────────────────────
export function handleSummary(data) {
  var m = data.metrics || {}

  // HTTP request duration metrics
  var rd = m.http_req_duration && m.http_req_duration.values ? m.http_req_duration.values : {}
  var reqs = m.http_reqs && m.http_reqs.values ? m.http_reqs.values : {}
  var totalReqs = reqs.count || 0
  var errR = m.errors && m.errors.values ? m.errors.values.rate : 0
  var p50 = rd['p(50)'] || 0
  var p90 = rd['p(90)'] || 0
  var p95 = rd['p(95)'] || 0
  var p99 = rd['p(99)'] || 0
  var avg = rd.avg || 0
  var min = rd.min || 0
  var max = rd.max || 0

  // Calculate throughput (requests per second)
  var testRunTime = data.state && data.state.testRunDurationMs ? data.state.testRunDurationMs / 1000 : 1
  var rps = totalReqs / testRunTime

  // Scenario-specific durations
  var loginD = m.login_duration && m.login_duration.values ? m.login_duration.values : {}
  var resD = m.reservation_duration && m.reservation_duration.values ? m.reservation_duration.values : {}
  var callD = m.call_next_duration && m.call_next_duration.values ? m.call_next_duration.values : {}
  var searchD = m.agencies_search_duration && m.agencies_search_duration.values ? m.agencies_search_duration.values : {}
  var adminD = m.admin_dashboard_duration && m.admin_dashboard_duration.values ? m.admin_dashboard_duration.values : {}
  var cronD = m.cron_duration && m.cron_duration.values ? m.cron_duration.values : {}

  // Counters
  var joins = m.joins_total && m.joins_total.values ? m.joins_total.values.count : 0
  var cancels = m.cancels_total && m.cancels_total.values ? m.cancels_total.values.count : 0
  var postpones = m.postpones_total && m.postpones_total.values ? m.postpones_total.values.count : 0
  var registers = m.registers_total && m.registers_total.values ? m.registers_total.values.count : 0
  var rates = m.rates_total && m.rates_total.values ? m.rates_total.values.count : 0
  var walkins = m.walkins_total && m.walkins_total.values ? m.walkins_total.values.count : 0
  var pausetoggles = m.pause_toggles_total && m.pause_toggles_total.values ? m.pause_toggles_total.values.count : 0
  var favs = m.favorites_total && m.favorites_total.values ? m.favorites_total.values.count : 0
  var logins = m.logins_total && m.logins_total.values ? m.logins_total.values.count : 0
  var browses = m.browses_total && m.browses_total.values ? m.browses_total.values.count : 0

  // Per-scenario error rates
  var browseErr = m.browse_errors && m.browse_errors.values ? m.browse_errors.values.rate : 0
  var joinErr = m.join_errors && m.join_errors.values ? m.join_errors.values.rate : 0
  var cancelErr = m.cancel_postpone_errors && m.cancel_postpone_errors.values ? m.cancel_postpone_errors.values.rate : 0
  var favsErr = m.favs_profile_errors && m.favs_profile_errors.values ? m.favs_profile_errors.values.rate : 0
  var agencyErr = m.agency_errors && m.agency_errors.values ? m.agency_errors.values.rate : 0
  var authErr = m.auth_errors && m.auth_errors.values ? m.auth_errors.values.rate : 0
  var adminErr = m.admin_errors && m.admin_errors.values ? m.admin_errors.values.rate : 0
  var cronErr = m.cron_errors && m.cron_errors.values ? m.cron_errors.values.rate : 0
  var regErr = m.register_errors && m.register_errors.values ? m.register_errors.values.rate : 0

  // Connection metrics
  var conns = m.active_connections && m.active_connections.values ? m.active_connections.values : {}

  // Iteration info
  var iters = m.iterations && m.iterations.values ? m.iterations.values.count : 0

  // Data size info
  var dataRecv = m.data_received && m.data_received.values ? m.data_received.values : {}
  var dataSent = m.data_sent && m.data_sent.values ? m.data_sent.values : {}

  var pad = function (str, len) {
    str = String(str)
    while (str.length < len) str = ' ' + str
    return str
  }

  var s = '\n' +
    '╔══════════════════════════════════════════════════════════════╗\n' +
    '║    DALTI / QueueWise — 10K Load Test Summary Report        ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n' +
    '\n' +
    '─── Overall Metrics ─────────────────────────────────────────\n' +
    '  Total Requests:       ' + pad(totalReqs, 14) + '\n' +
    '  Requests/second:      ' + pad(rps.toFixed(1), 14) + ' rps\n' +
    '  Total Iterations:     ' + pad(iters, 14) + '\n' +
    '  Test Duration:        ' + pad((testRunTime / 60).toFixed(1) + ' min', 14) + '\n' +
    '  5xx Error Rate:       ' + pad((errR * 100).toFixed(2) + '%', 14) + '\n' +
    '\n' +
    '─── Latency ─────────────────────────────────────────────────\n' +
    '  Min:                  ' + pad(Math.round(min) + 'ms', 14) + '\n' +
    '  Avg:                  ' + pad(Math.round(avg) + 'ms', 14) + '\n' +
    '  P50 (Median):         ' + pad(Math.round(p50) + 'ms', 14) + '\n' +
    '  P90:                  ' + pad(Math.round(p90) + 'ms', 14) + '\n' +
    '  P95:                  ' + pad(Math.round(p95) + 'ms', 14) + '\n' +
    '  P99:                  ' + pad(Math.round(p99) + 'ms', 14) + '\n' +
    '  Max:                  ' + pad(Math.round(max) + 'ms', 14) + '\n' +
    '\n' +
    '─── Per-Scenario Latency (P95) ──────────────────────────────\n' +
    '  Login:                ' + pad(Math.round(loginD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '  Reservation:          ' + pad(Math.round(resD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '  Call-Next:            ' + pad(Math.round(callD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '  Search:               ' + pad(Math.round(searchD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '  Admin Dashboard:      ' + pad(Math.round(adminD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '  Cron Jobs:            ' + pad(Math.round(cronD['p(95)'] || 0) + 'ms', 14) + '\n' +
    '\n' +
    '─── Per-Scenario Error Rates ────────────────────────────────\n' +
    '  Browse:               ' + pad((browseErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Join Queue:           ' + pad((joinErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Cancel/Postpone:      ' + pad((cancelErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Favorites/Profile:    ' + pad((favsErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Agency Actions:       ' + pad((agencyErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Auth (Login):         ' + pad((authErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Admin Dashboard:      ' + pad((adminErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Cron Jobs:            ' + pad((cronErr * 100).toFixed(2) + '%', 14) + '\n' +
    '  Registration:         ' + pad((regErr * 100).toFixed(2) + '%', 14) + '\n' +
    '\n' +
    '─── Action Counts ───────────────────────────────────────────\n' +
    '  Queue Joins:          ' + pad(joins, 14) + '\n' +
    '  Cancels:              ' + pad(cancels, 14) + '\n' +
    '  Postpones:            ' + pad(postpones, 14) + '\n' +
    '  Ratings:              ' + pad(rates, 14) + '\n' +
    '  Walk-ins:             ' + pad(walkins, 14) + '\n' +
    '  Pause Toggles:        ' + pad(pausetoggles, 14) + '\n' +
    '  Favorites:            ' + pad(favs, 14) + '\n' +
    '  Logins:               ' + pad(logins, 14) + '\n' +
    '  Browses:              ' + pad(browses, 14) + '\n' +
    '  Registrations:        ' + pad(registers, 14) + '\n' +
    '\n' +
    '─── Data Transfer ───────────────────────────────────────────\n' +
    '  Received:             ' + pad(((dataRecv.count || 0) / 1024 / 1024).toFixed(2) + ' MB', 14) + '\n' +
    '  Sent:                 ' + pad(((dataSent.count || 0) / 1024 / 1024).toFixed(2) + ' MB', 14) + '\n' +
    '\n' +
    '══════════════════════════════════════════════════════════════\n'

  console.log(s)

  return {
    stdout: '',
    'tests/loadtest-report-10k.json': JSON.stringify(data, null, 2),
    'tests/loadtest-summary-10k.txt': s,
  }
}
