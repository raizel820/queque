# QueueWise - Dynamic Queue Management & Reservation Platform

## Current Project Status (Assessment)
**Status**: 🟢 Stable - Production-ready MVP
**Phase**: 7 - UI Redesign & Feature Enhancements (Completed)
**Dev Server**: Running clean on port 3000, ESLint 0 errors
**Test Coverage**: All 4 roles tested via agent-browser (Customer, Agency Owner, Agency Staff, Admin)
**Known Issues**: None critical. Minor: Language dropdown on profile page interaction can be improved.

### Completed Features Summary
- ✅ Full auth system (register, login, session, 4 roles)
- ✅ Customer: Home (search, categories, QR join), Queue (progress ring, auto-refresh), History, Favorites, Profile (notif prefs, SMS wallet, theme), Notifications
- ✅ Agency: Dashboard (live stats, call next, service breakdown, efficiency ring), Settings (working hours, services), Profile (QR code, share link), Subscription (Basic/Premium, CCP/Bank payment)
- ✅ Admin: Dashboard (system health, activity feed), Analytics (14-day trend, peak hours, top agencies, weekly summary), Transactions (approve/reject), Agencies (CRUD, suspend), Audit Logs, User Management
- ✅ i18n: Arabic (RTL), French, English with 400+ translation keys
- ✅ Dark/light mode with persistence
- ✅ Framer Motion page transitions
- ✅ Redesigned bottom navigation (4+1 pattern)
- ✅ Notification badge system

### Next Phase Priorities
1. **Real-time updates via WebSocket** (queue-ws mini-service exists but not integrated)
2. **Push notification system** (Web Push API integration)
3. **Payment integration** (CCP/bank receipt OCR verification)
4. **PWA support** (service worker, offline mode)
5. **Performance optimization** (code splitting, image optimization)

## Project Overview
A digital queue management platform for clinics, agencies, law firms, laboratories, and service providers in Algeria (pilot city: M'Sila). B2B2C model with customer, agency staff, agency owner, and super admin roles.

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui (New York style)
- Prisma ORM with SQLite
- Zustand for state management
- next-themes for dark/light mode
- Custom i18n for Arabic (RTL), French, English
- Framer Motion for animations
- Crypto.scryptSync for password hashing

## Architecture
- Single-page application at `/` route
- Client-side view routing via Zustand store
- API routes for all backend operations
- Mobile-first responsive design

## Key Files

### Database
- `prisma/schema.prisma` - 11 models: User, Agency, AgencyStaff, Service, QueueSettings, Reservation, Transaction, SmsPurchase, Notification, AuditLog, Favorite
- `prisma/seed.ts` - Demo data with 6 users, 4 agencies, 6 services, 5 reservations, 3 transactions

### i18n
- `src/i18n/ar.ts` - Arabic translations (RTL)
- `src/i18n/fr.ts` - French translations
- `src/i18n/en.ts` - English translations
- `src/i18n/index.ts` - i18n utilities

### State Management
- `src/store/use-app-store.ts` - Main app state (auth, navigation, sidebar)
- `src/hooks/use-language.ts` - Language hook

### Main Entry
- `src/app/page.tsx` - View router with Customer/Agency/Admin layouts
- `src/app/layout.tsx` - Root layout with ThemeProvider

### API Routes (30+)
- Auth: register, login, session
- Agencies: CRUD + search + code lookup
- Services: CRUD per agency
- Reservations: create, active, history, status update
- Queue: call-next, pause, resume, settings, status
- Agency: stats, queue management, settings, services, working-hours
- Transactions: create, list, review
- Admin: dashboard, stats, audit logs, agencies, analytics, users
- Notifications: list + mark read
- Favorites: list, toggle
- User: profile, preferences

### UI Components
- **Auth**: LandingPage, LoginForm, RegisterForm
- **Customer**: CustomerHome, CustomerQueue, CustomerHistory, CustomerProfile, CustomerNotifications, CustomerFavorites
- **Agency**: AgencyDashboard, AgencySettings, AgencyProfile, AgencySubscription
- **Admin**: AdminDashboard, AdminTransactions, AdminAgencies, AdminAuditLogs, AdminUsers, AdminAnalytics
- **Shared**: LanguageSwitcher, ThemeToggle, QueueStatusBadge

## Demo Accounts
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Customer | ahmed | user123 |
| Customer | fatima | user123 |
| Customer | youssef | user123 |
| Agency Owner | clinic01 | agency123 |
| Agency Staff | receptionist01 | agency123 |

## Agency Codes
| Code | Name | Category |
|------|------|----------|
| CLINIC01 | عيادة الشفاء | Clinic |
| LAB01 | مختبر التحاليل الطبية | Laboratory |
| LAW01 | مكتب المحامي خالد | Law Firm |
| GOV01 | مديرية الضرائب | Government |

## Progress

### Phase 1 - Foundation ✅
### Phase 2 - Core Modules ✅
### Phase 3 - Polish & Seed ✅

### Task ID: 6-a - Completed ✅
- [x] Admin Analytics Dashboard with bar charts, top agencies, peak hours
- [x] Customer Favorites system with heart toggle and quick join
- [x] Agency Working Hours display and editing
- [x] Notification Preferences in customer profile
- [x] Enhanced Register Form with phone prefix, terms, role-specific fields
- [x] 45+ new i18n keys across ar/fr/en
- [x] Prisma schema updated (Favorite model, new fields)
- [x] ESLint clean, dev server stable

---
Task ID: 6-a
Agent: Full-Stack Developer
Task: Build 5 features - Analytics, Favorites, Working Hours, Notification Prefs, Enhanced Register

Work Log:
- Prisma: Added Favorite model, notificationPreferences to User, workingHoursStart/End to Agency
- API Routes Created: admin/analytics, favorites (GET+POST), working-hours, user/preferences
- API Routes Updated: auth/register (SUPER_ADMIN, agencyCode), agencies (working hours in response), agency/settings (working hours)
- Components Created: admin-analytics.tsx, customer-favorites.tsx
- Components Updated: customer-home.tsx (hearts, working hours), customer-profile.tsx (notif prefs), agency-settings.tsx (working hours inputs), agency-profile.tsx (working hours display), admin-agencies.tsx (working hours badges), register-form.tsx (phone prefix, terms, role fields, admin code)
- Store: Added customer-favorites and admin-analytics to ViewName type
- Page.tsx: Added imports, routing, and nav items for both new views
- i18n: 45+ new keys across ar.ts, fr.ts, en.ts
- ESLint clean, db:push successful, dev server running on port 3000

### Task ID: 7-a - UI Redesign & Feature Enhancements ✅
- [x] Redesigned customer bottom nav: 4 main tabs + "More" sheet
- [x] Added notification unread badge on More button
- [x] More sheet: Favorites, Notifications (with count), Settings
- [x] Enhanced Customer Queue with SVG progress ring, turn alert banner
- [x] Quick Stats glass-morphism banner on Customer Home
- [x] Framer Motion page transitions (AnimatePresence mode="wait")
- [x] Enhanced Agency Dashboard: Service Breakdown bars, Queue Efficiency ring, Live indicator
- [x] Enhanced Admin Dashboard: System Health panel, Weekly Growth badge, Activity icons by type
- [x] Enhanced Admin Analytics: Weekly Summary card, medals for top 3, 14-day + 24h charts
- [x] 30+ new i18n keys across ar/fr/en
- [x] Fixed lucide-react import: CheckBadge → Check, CircleDot → Circle

---
Task ID: 7-a
Agent: Full-Stack Developer (2 parallel subagents)
Task: Comprehensive UI redesign, styling improvements, and feature additions

Work Log:
- page.tsx: Redesigned CustomerBottomNav (4 tabs + MoreHorizontal sheet with Sheet component)
- page.tsx: Added notification badge fetching unread count from /api/notifications
- page.tsx: Added AnimatePresence page transitions with fade+slide
- customer-queue.tsx: Added SVG progress ring with gradient stroke, pulsing position indicator
- customer-queue.tsx: Enhanced "YOUR TURN!" banner with glow animation and larger number
- customer-queue.tsx: Added gradient card borders for CALLED status
- customer-queue.tsx: Set auto-refresh to 10 seconds
- customer-home.tsx: Added Quick Stats banner with glass-morphism (backdrop-blur-xl)
- admin-dashboard.tsx: Added System Health panel (Uptime, Response Time, Active Users)
- admin-dashboard.tsx: Added Weekly Growth badge (+12%), Platform Version footer
- admin-dashboard.tsx: Added ActivityIcon component with color-coded icons by action type
- admin-dashboard.tsx: Fixed CheckBadge → Check, CircleDot → Circle (lucide-react compatibility)
- agency-dashboard.tsx: Added Service Breakdown card with gradient horizontal bars
- agency-dashboard.tsx: Added Queue Efficiency circular progress ring
- agency-dashboard.tsx: Added "● Live" pulsing indicator next to dashboard title
- admin-analytics.tsx: Added Weekly Summary card (this week vs last week comparison)
- admin-analytics.tsx: Added medals (🥇🥈🥉) for top 3 agencies
- admin-analytics.tsx: Padded charts to always show 14 days and 24 hours
- i18n: Added 30+ new keys (more, moreMenuTitle, quickStats, systemHealth, uptime, etc.)

Stage Summary:
- All 6 customer views functional with improved UX
- Bottom nav redesigned from 6 to 4+1 pattern (major UX improvement)
- Notification badge system integrated
- Admin dashboard significantly enhanced with system health indicators
- Agency dashboard enhanced with service breakdown and efficiency metrics
- ESLint clean, dev server stable, all QA tests passed
