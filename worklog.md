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
