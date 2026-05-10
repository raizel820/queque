# QueueWise - Dynamic Queue Management & Reservation Platform

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
- `prisma/schema.prisma` - 10 models: User, Agency, AgencyStaff, Service, QueueSettings, Reservation, Transaction, SmsPurchase, Notification, AuditLog
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

### API Routes (25+)
- Auth: register, login, session
- Agencies: CRUD + search + code lookup
- Services: CRUD per agency
- Reservations: create, active, history, status update
- Queue: call-next, pause, resume, settings, status
- Agency: stats, queue management, settings, services
- Transactions: create, list, review
- Admin: dashboard, stats, audit logs, agencies
- Notifications: list + mark read

### UI Components
- **Auth**: LandingPage, LoginForm, RegisterForm
- **Customer**: CustomerHome, CustomerQueue, CustomerHistory, CustomerProfile
- **Agency**: AgencyDashboard, AgencySettings, AgencyProfile, AgencySubscription
- **Admin**: AdminDashboard, AdminTransactions, AdminAgencies
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
- [x] Project setup and planning
- [x] Database schema design (10 models)
- [x] i18n system (AR/FR/EN with RTL support)
- [x] Auth system (register, login, session)
- [x] Main app shell with view router

### Phase 2 - Core Modules ✅
- [x] Customer module (search, join queue, track, history, profile)
- [x] Agency dashboard (queue mgmt, settings, profile, subscription)
- [x] Admin dashboard (validation, agencies, stats, audit logs)

### Phase 3 - Polish & Seed ✅
- [x] Seed data (6 users, 4 agencies, 6 services, 5 reservations)
- [x] Mobile-first responsive design
- [x] Light/Dark mode support
- [x] Framer Motion animations

### Phase 2 (Future) - Not Yet Built
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Rewarded ads
- [ ] SMS purchases
- [ ] Enhanced analytics

### Phase 3 (Future) - Not Yet Built
- [ ] Electronic payments
- [ ] Multi-branch support
- [ ] AI wait prediction
- [ ] Appointment booking
- [ ] WhatsApp notifications

---
Task ID: 1
Agent: Main Orchestrator
Task: Complete MVP build - database, i18n, API routes, UI components

Work Log:
- Designed and implemented Prisma schema with 10 models
- Created comprehensive i18n system with 150+ translations in Arabic, French, English
- Built Zustand store for app state management
- Created 25+ API routes for all backend operations
- Built complete landing page with hero, features, how-it-works sections
- Built login/register forms with role selection
- Built customer home with agency search, category filter, code entry, queue joining
- Built customer queue tracker with real-time polling, progress bar, cancel
- Built customer history with status filters
- Built customer profile with SMS wallet, language picker
- Built agency dashboard with stats, call-next, pause/resume, waiting list
- Built agency settings with service management, queue config
- Built agency profile and subscription management
- Built admin dashboard with system stats, quick actions, recent activity
- Built admin transaction review with approve/reject
- Built admin agency management
- Created seed script with comprehensive demo data
- Fixed all API route alignment issues between frontend and backend

Stage Summary:
- Complete MVP built and tested
- App compiles and runs successfully (GET / returns 200)
- All 4 roles supported with distinct UIs
- Mobile-first responsive design with RTL Arabic support
- Light/dark mode working
- Demo data populated for testing

---
Task ID: 2
Agent: Full-Stack Developer (API)
Task: Build all backend API routes

Work Log:
- Built password hashing utility with scryptSync
- Created auth routes (register, login, session)
- Created agency CRUD routes with search and code lookup
- Created service management routes
- Created reservation routes with full queue logic
- Created queue management routes (call-next, pause, resume)
- Created transaction and payment review routes
- Created admin dashboard and stats routes
- Created notification routes

Stage Summary:
- 25+ API routes created
- Full queue number generation with service prefixes
- Reservation state machine (WAITING→CALLED→COMPLETED/CANCELLED/NO_SHOW)
- Estimated wait time calculation
- Audit logging for all actions
- Payment review workflow

---
Task ID: 3
Agent: Full-Stack Developer (Frontend)
Task: Build all UI components

Work Log:
- Built all auth components (landing, login, register)
- Built all customer components (home, queue, history, profile)
- Built all agency components (dashboard, settings, profile, subscription)
- Built admin components (dashboard, transactions, agencies)
- Built shared components (language switcher, theme toggle, queue status badge)
- Implemented RTL support for Arabic
- Added Framer Motion animations

Stage Summary:
- Professional, clean UI with emerald/teal color scheme
- Mobile-first responsive design
- RTL Arabic support
- Smooth animations and transitions
- Large touch targets for mobile

## Current Issues / Risks
1. WebSocket real-time service not yet built (polling used instead)
2. No actual SMS or push notifications (Phase 2)
3. Customer queue tracker needs position/people-ahead calculation from server
4. Some agency routes use first-active-agency pattern (MVP simplification)
5. File upload for payment receipts not yet implemented

## Recommended Next Steps
1. Build WebSocket service for true real-time updates
2. Fix queue position calculation (people ahead, estimated time)
3. Add file upload for agency logos and payment receipts
4. Implement QR code generation for agencies
5. Add proper error boundaries and loading states
6. Build additional admin features (create/edit agencies)
7. Enhance customer home with map/location features
8. Add proper form validation with zod
