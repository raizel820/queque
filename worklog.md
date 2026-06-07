# BLASTI (بلاصتي) - Project Worklog

## Current Project Status

**BLASTI** is a smart queue/reservation platform built with Next.js 16, React 19, TypeScript, Prisma 6 + SQLite, Tailwind CSS 4, and shadcn/ui.

### NextAuth CLIENT_FETCH_ERROR Fix + Data Reset (This Session)

#### Root Cause: NextAuth CLIENT_FETCH_ERROR
The `[next-auth][error][CLIENT_FETCH_ERROR]` was caused by a **custom `/api/auth/session/route.ts`** that overrode NextAuth's built-in session endpoint. The custom route used `requireAuth()` which returned `401 {"success":false,"error":"Authentication required"}` for unauthenticated users, but NextAuth's `SessionProvider` expects the standard format `{user: {...}, expires: "..."}` or `{}` for unauthenticated users.

**Fix:** Deleted the custom `/api/auth/session/route.ts` file. NextAuth's built-in `[...nextauth]` catch-all route now handles the session endpoint correctly:
- Unauthenticated users: returns `{}` with 200 status ✅
- Authenticated users: returns `{user: {id, username, fullName, role, language, agencyId}, expires: "..."}` ✅

#### Additional Changes

| # | Change | File(s) | Status |
|---|--------|---------|--------|
| 1 | Deleted custom session route (fixes CLIENT_FETCH_ERROR) | `src/app/api/auth/session/route.ts` | ✅ Deleted |
| 2 | Updated session validation to check response body instead of 401 status | `src/components/providers/auth-provider.tsx` | ✅ Fixed |
| 3 | Added NEXTAUTH_URL and NEXTAUTH_SECRET to .env | `.env` | ✅ Added |
| 4 | Reset all database data to initial state at 0 | `prisma/seed.ts` re-run | ✅ Complete |
| 5 | Added customer test account to seed file | `prisma/seed.ts` | ✅ Added |

#### Data Reset Summary
All database tables cleared and reseeded with fresh data. All counters at 0:
- 👤 Admin user: `admin` / `admin123`
- 👤 Customer user: `customer1` / `customer123`
- 🏢 Demo agency: BLASTI Demo Agency (DEMO001) — 0 waiting, 0 reviews, 0 reservations
- 🌿 Main branch + Counter 1 + General Service
- ⚙️ Queue settings: currentServingNumber=0, lastIssuedNumber=0

#### Browser Verification Results
- ✅ Landing page loads with no console errors
- ✅ Customer login works → customer home loads with agencies data, NO "data load failed" error
- ✅ Admin login works → admin dashboard loads with all panels
- ✅ No CLIENT_FETCH_ERROR in console
- ✅ No "data load failed" error
- ✅ NextAuth session endpoint returns proper response format

---

## Task 3: Prisma Model Name Quirks Audit

**Date**: 2025-03-04
**Scope**: Audit all Prisma model names for casing quirks that could cause runtime errors with the Prisma Client.

### All Models in Schema (20 total)

| Model Name | Prisma Client Accessor | Unusual? |
|------------|----------------------|----------|
| User | `db.user` | No |
| Agency | `db.agency` | No |
| AgencyStaff | `db.agencyStaff` | No |
| Service | `db.service` | No |
| QueueSettings | `db.queueSettings` | No |
| Reservation | `db.reservation` | No |
| Transaction | `db.transaction` | No |
| SmsPurchase | `db.smsPurchase` | No |
| Notification | `db.notification` | No |
| Favorite | `db.favorite` | No |
| Announcement | `db.announcement` | No |
| GlobalAnnouncement | `db.globalAnnouncement` | No |
| SmsSettings | `db.smsSettings` | No |
| SmsLog | `db.smsLog` | No |
| AuditLog | `db.auditLog` | No |
| Review | `db.review` | No |
| **FAQ** | **`db.fAQ`** | **⚠️ YES** |
| PaymentSettings | `db.paymentSettings` | No |
| Branch | `db.branch` | No |
| Counter | `db.counter` | No |

### Key Finding: `FAQ` Model

The model `FAQ` is all-uppercase. Prisma's naming convention lowercases only the **first character**, so `FAQ` becomes `db.fAQ` (not `db.faq` or `db.FAQ`). This is the only model with unusual casing in the schema.

### Code Audit Results — All `db.fAQ` Usages Verified Correct ✅

All 14 occurrences of FAQ model access across 5 API route files correctly use `db.fAQ`:

| File | Line(s) | Usage | Correct? |
|------|---------|-------|----------|
| `src/app/api/faqs/route.ts` | 12 | `db.fAQ.findMany` | ✅ |
| `src/app/api/faq/route.ts` | 7 | `db.fAQ.findMany` | ✅ |
| `src/app/api/admin/faqs/seed/route.ts` | 63, 69 | `db.fAQ.count()`, `db.fAQ.create()` | ✅ |
| `src/app/api/admin/faqs/route.ts` | 16, 36, 67, 72, 105, 110 | `db.fAQ.findMany/create/findUnique/update/delete` | ✅ |
| `src/app/api/admin/faq/route.ts` | 15, 34, 64, 96 | `db.fAQ.findMany/create/update/delete` | ✅ |

### Searched For But NOT Found (Good — no incorrect casing)
- ❌ `db.FAQ` — not found (would be incorrect)
- ❌ `db.faq` — not found (would be incorrect)
- ❌ `prisma.FAQ` / `prisma.faq` — no direct Prisma client usage (all go through `db` wrapper)

### `@@map` / `@@id` Check

- **`@@map`**: None found. All table names default to model names. No table name mismatches possible.
- **`@@id`**: None found (only `@@unique` and `@@index` which don't affect naming).

### Raw SQL Table Name Check

10 raw SQL queries found across 6 files, all referencing the `Reservation` table. Since there's no `@@map`, the default SQLite table name matches the model name `Reservation`. SQLite is case-insensitive for identifiers, so these work correctly:

| File | Table Referenced | Correct? |
|------|-----------------|----------|
| `reviews/route.ts` (3 queries) | `Reservation` | ✅ |
| `cron/check-sms-fallback/route.ts` | `Reservation` | ✅ |
| `cron/auto-skip/route.ts` | `Reservation` | ✅ |
| `agencies/route.ts` | `Review` (via subquery) | ✅ |
| `reservations/reclaim/route.ts` | `Reservation` | ✅ |
| `reservations/[id]/rate/route.ts` (2 queries) | `Reservation` | ✅ |
| `agency/no-show-analytics/route.ts` | `Reservation` | ✅ |
| `agency/peak-hours/route.ts` | `Reservation` | ✅ |

### All Other Model Accessors Verified Correct

Checked all `db.<model>` and `tx.<model>` calls across the entire `src/` directory — every accessor uses the correct Prisma camelCase convention. No instances of `db.<Uppercase>` (e.g., `db.Review`, `db.User`) were found.

### Conclusion

**No runtime bugs found.** All Prisma client calls use the correct casing. However, there is one **maintainability risk**:

### ⚠️ Maintainability Risk: `FAQ` → `db.fAQ`

- `db.fAQ` is non-intuitive and looks like a typo to future developers
- A developer could easily write `db.FAQ` or `db.faq`, both of which would cause a **runtime error** (property does not exist on PrismaClient)
- **Recommended fix**: Rename the model from `FAQ` to `Faq` in `prisma/schema.prisma`, then update all `db.fAQ` references to `db.faq`. This makes the accessor follow standard camelCase convention and eliminates confusion.

---

## Task 10: Integrate `fetchWithRetry` into Data-Loading Components

**Date**: 2025-03-05
**Scope**: Replace `fetch()` with `fetchWithRetry()` in all main data-fetching functions across 8 components to add automatic retry on transient errors (5xx, 429, network errors) with exponential backoff.

### Utility Used
`/home/z/my-project/src/lib/fetch-with-retry.ts` — shared `fetchWithRetry` utility that:
- Retries on 5xx server errors and 429 rate-limiting
- Retries on network errors (when `fetch` throws)
- Uses exponential backoff: 1s, 2s (2 retries by default)
- Respects `Retry-After` header for 429 responses
- Returns the Response object (even non-retried 4xx) so callers handle normally

### Changes Made

Each edit uses dynamic import: `const { fetchWithRetry } = await import('@/lib/fetch-with-retry');`

| # | File | Function | Change | Status |
|---|------|----------|--------|--------|
| 1 | `src/components/agency/agency-dashboard.tsx` | `fetchData` | Replaced 4 `fetch()` calls inside `Promise.all` with `fetchWithRetry()` | ✅ |
| 2 | `src/components/admin/admin-dashboard.tsx` | `fetchDashboard` | Replaced `fetch('/api/admin/dashboard')` with `fetchWithRetry(...)` | ✅ |
| 3 | `src/components/customer/customer-history.tsx` | `fetchHistory` | Replaced `fetch('/api/reservations/history?...')` with `fetchWithRetry(...)` | ✅ |
| 4 | `src/components/customer/customer-notifications.tsx` | `fetchNotifications` | Replaced `fetch('/api/notifications?...')` with `fetchWithRetry(...)` | ✅ |
| 5 | `src/components/customer/customer-favorites.tsx` | `fetchFavorites` | Replaced `fetch('/api/favorites?...')` with `fetchWithRetry(...)` | ✅ |
| 6 | `src/components/admin/admin-audit-logs.tsx` | `fetchLogs` | Replaced `fetch('/api/admin/audit-logs?...')` with `fetchWithRetry(...)` | ✅ |
| 7 | `src/components/admin/admin-users.tsx` | `fetchUsers` | Replaced `fetch('/api/admin/users?...')` with `fetchWithRetry(...)` | ✅ |
| 8 | `src/components/admin/admin-analytics.tsx` | `fetchAnalytics` | Replaced `fetch('/api/admin/analytics')` with `fetchWithRetry(...)` | ✅ |

### What Was NOT Changed
- POST/PUT/DELETE mutation calls (e.g., `handleCallNext`, `handleTogglePause`, `handleAction`, `handleBatchComplete`, `handleCreateAnnouncement`, `handleDeleteAnnouncement`, `confirmRejoin`, `toggleFavorite`, `handleMarkAllRead`, `handleMarkRead`, `handleDelete`, `handleToggleStatus`, `handleDeleteUser`, `handleResetPassword`, `handleSaveSmsSettings`, `handleSendTestSms`, `handleValidateGateway`)
- Other GET calls not in the main data-fetch functions (e.g., `fetchAgencyCode`, `fetchAnnouncements`, `fetchServiceAnalytics`, `handleExportCsv`, `fetchSmsSettings`, `fetchRealAnnouncements`, `handleAdminExport`, `handleExportCsv` in audit-logs) — these are secondary/utility fetches

### Lint Check
- Ran `bun run lint` — no new errors introduced by these changes
- Pre-existing errors (2 in `mini-services/realtime-service/index.cjs`) are unrelated
