# 🎨 CoopBank Visit Hub – Frontend Clean Code Architecture & Implementation Roadmap

Comprehensive architectural blueprint, design system, API integration sequence, state management strategy, and Clean Code Modular Architecture for **Cooperative Bank of Oromia (CoopBank DxValley)**.

---

## 🏛️ 1. Technical Stack & Core Libraries

| Category | Technology | Version / Tool | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | **React.js (SPA)** | `React 18 + Vite` | Fast Hot Module Replacement (HMR) & clean modular architecture |
| **Language** | **JavaScript (ES6+)** | Modern JS / JSX | Dynamic, readable, and clean component structure |
| **Styling** | **Tailwind CSS** | `Tailwind v3.4+` | Utility-first CSS with custom CoopBank brand design tokens |
| **UI Components** | **Headless UI / Lucide** | `lucide-react` | Enterprise SVG icons and accessible headless modals/menus |
| **State Management** | **Zustand** | `zustand` | Lightweight, domain-isolated state stores |
| **Form Handling** | **React Hook Form** | `react-hook-form` | High-performance uncontrolled forms with minimal re-renders |
| **Validation** | **Zod** | `zod` + `@hookform/resolvers` | Client-side schema validation, regex checks, and sanitization |
| **HTTP Client** | **Axios** | `axios` | Global interceptors for JWT Bearer token & automatic token refresh |
| **Data Visualization** | **Recharts** | `recharts` | Interactive charts for executive deal pipelines, CSAT & conversion |
| **Notifications** | **Sonner** + Web Audio API | `sonner` | Toast popups paired with a pleasant custom audio notification chime |
| **Routing** | **React Router DOM** | `react-router-dom v6` | Protected routes, RBAC guards, and public guest portals |
| **Animations** | **Framer Motion** | `framer-motion` | Smooth page transitions, modal slides, and pulse alerts |

---

## 🏗️ 2. Clean Code & Domain-Driven Modular Folder Architecture

The application adopts a **Clean Code / Feature-Sliced Domain Architecture**. Each business feature is an autonomous module containing its own API integration, components, hooks, pages, schemas, and state store:

```
src/
├── app/                                # 🌐 Application Bootstrap & Config Layer
│   ├── providers/                      # ThemeProvider, ToastProvider, RouterProvider
│   ├── routes/                         # AppRoutes.jsx, ProtectedRoute.jsx, RoleGuard.jsx
│   └── App.jsx                         # Main Root Component
│
├── core/                               # ⚙️ Core Infrastructure & Global Utilities
│   ├── api/                            # Axios client instance, interceptors, error envelope handler
│   │   ├── apiClient.js
│   │   └── errorHandler.js
│   ├── assets/                         # CoopBank official logos, vector illustrations, audio chimes
│   │   ├── logo-gold.svg
│   │   ├── logo-navy.svg
│   │   └── sounds/                     # Web Audio fallback
│   ├── config/                         # Environment variables, app constants, navigation menus
│   │   └── constants.js
│   ├── hooks/                          # Reusable infrastructure hooks
│   │   ├── useDebounce.js
│   │   ├── useMediaQuery.js
│   │   └── useAudioNotification.js     # Melodic Web Audio synthesizer (C5-E5 chime)
│   ├── layouts/                        # Global Shell Layouts
│   │   ├── DashboardLayout.jsx         # Sidebar + Topbar + Content Shell
│   │   ├── AuthLayout.jsx              # Branded Center Split Screen
│   │   └── PublicLayout.jsx            # Public Guest Portal Shell
│   └── utils/                          # Pure business & formatting utilities
│       ├── currencyFormatter.js        # USD / ETB currency formatters
│       ├── dateFormatter.js           # ISO timestamp to human-readable date/time
│       ├── xssSanitizer.js             # Client-side string sanitization
│       └── soundPlayer.js              # Web Audio API 2-tone melodic chime
│
├── shared/                             # 🧱 Shared Design System (Dumb UI Components)
│   ├── components/
│   │   ├── ui/                         # Base Atomic Components
│   │   │   ├── Button.jsx              # Gold/Navy/Outline/Ghost variants
│   │   │   ├── Input.jsx               # Floating label & error state input
│   │   │   ├── Modal.jsx               # Accessible glassmorphism dialog
│   │   │   ├── Badge.jsx               # Status & priority badges with glowing dots
│   │   │   ├── Card.jsx                # Glassmorphism container with hover lift
│   │   │   ├── Table.jsx               # Responsive data grid with pagination controls
│   │   │   ├── Dropdown.jsx            # Action menu & filter selectors
│   │   │   ├── Tabs.jsx                # Pill & underline tab switchers
│   │   │   ├── Spinner.jsx             # CoopBank gold branded loading spinner
│   │   │   └── Avatar.jsx              # User & guest initials avatar
│   │   ├── forms/                      # Form-specific Field Wrappers
│   │   │   ├── FormInput.jsx
│   │   │   ├── FormSelect.jsx
│   │   │   ├── FormTextarea.jsx
│   │   │   └── FormDatePicker.jsx
│   │   ├── feedback/                   # Alert & Feedback UI
│   │   │   ├── AlertBanner.jsx         # Info/Warning/Error banners
│   │   │   ├── ConfirmDialog.jsx       # Destructive action confirmations
│   │   │   └── AudioChimeIndicator.jsx # Sound toggle status icon
│   │   └── navigation/                 # Layout Navigation Elements
│   │       ├── Sidebar.jsx             # Role-aware navigation sidebar
│   │       ├── Topbar.jsx              # Search, user menu & notification bell
│   │       ├── NotificationBell.jsx    # Animated bell with unread pulse counter
│   │       └── Breadcrumbs.jsx         # Dynamic path navigation
│   └── schemas/                        # Shared Validation Schemas
│       └── commonSchemas.js
│
└── modules/                            # 🚀 Business Domain Modules (Clean Architecture Layer)
    │
    ├── auth/                           # Module 1: Authentication & User Profile
    │   ├── api/authApi.js              # login(), refresh(), forgotPassword(), resetPassword(), verifyEmail()
    │   ├── components/
    │   │   ├── LoginForm.jsx
    │   │   ├── ForgotPasswordModal.jsx
    │   │   ├── ResetPasswordForm.jsx
    │   │   └── LockoutCountdown.jsx    # 15-minute brute-force lockout timer
    │   ├── hooks/useAuth.js
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── ForgotPasswordPage.jsx
    │   │   ├── ResetPasswordPage.jsx
    │   │   └── VerifyEmailPage.jsx
    │   ├── schemas/authSchemas.js      # Zod validation schemas
    │   └── store/authStore.js          # Zustand store (user, tokens, permissions)
    │
    ├── visits/                         # Module 2: Visits Lifecycle Management
    │   ├── api/visitApi.js             # listVisits(), getVisit(), createVisit(), updateVisit(), transitionStatus(), checkIn(), checkOut()
    │   ├── components/
    │   │   ├── VisitListTable.jsx
    │   │   ├── VisitFilterToolbar.jsx  # Multi-criteria filter
    │   │   ├── CreateVisitModal.jsx    # 3-step wizard with room conflict checking
    │   │   ├── RoomConflictAlert.jsx   # Conflict warning banner
    │   │   ├── StatusTransitionModal.jsx # Approve / Reject / Cancel dialog
    │   │   ├── CheckInModal.jsx        # Front desk badge generator & ID logger
    │   │   ├── CheckOutModal.jsx       # Departure confirmation & survey trigger
    │   │   └── VisitTimelineStepper.jsx # Visual visit state progression
    │   ├── hooks/
    │   │   ├── useVisits.js
    │   │   └── useRoomConflictCheck.js
    │   ├── pages/
    │   │   ├── VisitsListPage.jsx
    │   │   ├── VisitDetailPage.jsx
    │   │   ├── VisitCalendarPage.jsx   # Visual room & time slot calendar
    │   │   └── SecurityDeskPage.jsx    # Front desk arrival cockpit
    │   ├── schemas/visitSchemas.js
    │   └── store/visitStore.js
    │
    ├── organizations/                  # Module 3: Guest Organizations Intelligence
    │   ├── api/organizationApi.js      # listOrgs(), getOrg(), createOrg(), getOrgStats()
    │   ├── components/
    │   │   ├── OrganizationCard.jsx
    │   │   ├── OrganizationProfileHeader.jsx
    │   │   ├── RelationshipScoreGauge.jsx # 0-100 visual health badge
    │   │   ├── AddOrganizationModal.jsx
    │   │   └── OrgVisitHistoryTable.jsx
    │   ├── hooks/useOrganizations.js
    │   ├── pages/
    │   │   ├── OrganizationsListPage.jsx
    │   │   └── OrganizationDetailPage.jsx
    │   ├── schemas/organizationSchemas.js
    │   └── store/organizationStore.js
    │
    ├── guests/                         # Module 3.1: VIP Individual Guests Intelligence
    │   ├── api/guestApi.js             # listGuests(), getGuest(), createGuest(), getGuestStats()
    │   ├── components/
    │   │   ├── GuestCard.jsx
    │   │   ├── VipTierBadge.jsx        # VIP_TIER_1, VIP_TIER_2, STANDARD
    │   │   ├── AddGuestModal.jsx       # Passport / National ID validation
    │   │   └── GuestProfileHeader.jsx
    │   ├── hooks/useGuests.js
    │   ├── pages/
    │   │   ├── GuestsListPage.jsx
    │   │   └── GuestDetailPage.jsx
    │   ├── schemas/guestSchemas.js
    │   └── store/guestStore.js
    │
    ├── feedback/                       # Module 4: Customer Feedback & Public Booking
    │   ├── api/feedbackApi.js          # verifyToken(), submitFeedback(), getAnalytics(), publicBooking()
    │   ├── components/
    │   │   ├── StarRatingInput.jsx     # Interactive 5-Star component
    │   │   ├── NpsScoreSlider.jsx      # 0-10 NPS rating component
    │   │   ├── FeedbackMetricsOverview.jsx # CSAT %, NPS Score, Promoters breakdown
    │   │   ├── PublicBookingForm.jsx   # External client self-service form
    │   │   └── ConfettiCelebration.jsx # canvas-confetti survey completion
    │   ├── hooks/useFeedback.js
    │   ├── pages/
    │   │   ├── PublicBookingPage.jsx   # /book-visit
    │   │   ├── FeedbackSurveyPage.jsx  # /feedback/:token
    │   │   └── FeedbackAnalyticsPage.jsx # Executive CSAT analytics
    │   ├── schemas/feedbackSchemas.js
    │   └── store/feedbackStore.js
    │
    ├── analytics/                      # Module 5: Executive Analytics Dashboard
    │   ├── api/analyticsApi.js         # getDashboardMetrics()
    │   ├── components/
    │   │   ├── PipelineKpiCard.jsx     # Financial pipeline $ USD
    │   │   ├── ConversionRateGauge.jsx # Conversion & approval %
    │   │   ├── PipelineTrendAreaChart.jsx
    │   │   ├── StatusBreakdownDonutChart.jsx
    │   │   ├── TopPartnersRankTable.jsx
    │   │   └── LiveSecurityDeskFeed.jsx
    │   ├── hooks/useDashboardAnalytics.js
    │   ├── pages/
    │   │   └── ExecutiveDashboardPage.jsx # /dashboard
    │   └── store/analyticsStore.js
    │
    ├── notifications/                  # Module 6: Staff Notifications & Auditory Alert System
    │   ├── api/notificationApi.js      # listNotifications(), getUnreadCount(), markAsRead(), markAllAsRead(), dismiss()
    │   ├── components/
    │   │   ├── NotificationDrawer.jsx  # Slide-out interactive alert center
    │   │   ├── NotificationItem.jsx    # Type-colored notification card
    │   │   ├── NotificationBadge.jsx   # Pulsing unread counter
    │   │   └── AudioToggleSwitch.jsx   # Enable / Mute sound chime
    │   ├── hooks/
    │   │   ├── useNotifications.js
    │   │   └── useNotificationSound.js
    │   └── store/notificationStore.js
    │
    └── users/                          # Module 7: Staff User & Access Control Management
        ├── api/userApi.js              # listUsers(), getUser(), updateRoles(), updateStatus(), registerStaff()
        ├── components/
        │   ├── UserRosterTable.jsx
        │   ├── RegisterStaffModal.jsx  # Department & role assignment
        │   ├── UserRoleDrawer.jsx
        │   └── AccountLockToggle.jsx
        ├── hooks/useUsers.js
        ├── pages/
        │   └── UsersManagementPage.jsx # /users (Admin only)
        ├── schemas/userSchemas.js
        └── store/userStore.js
```

---

## 🎨 3. CoopBank Brand Design System & Tokens

### 3.1 Official Corporate Color Palette
* **Primary Gold / Yellow**: `#F39200` (Main brand color, Primary CTA buttons, Badges)
* **Secondary Gold**: `#FDB714` (Hover states, gradient glows)
* **Primary Deep Navy**: `#002D62` (Sidebar, Navbar headers, High-contrast text)
* **Dark Slate / Charcoal**: `#0B1B3D` & `#0F172A` (Card backdrops, Dark theme foundation)
* **Surface Light**: `#F8FAFC` & `#FFFFFF` (Backgrounds, clean card panels)

### 3.2 Typography & Hierarchy
* **Display & Headings**: `Outfit` (Google Fonts) – modern, geometric banking aesthetic.
* **Body, Data Grids & Forms**: `Inter` – high legibility for financial figures and tables.

---

## 🔔 4. Auditory Feedback & Toast Notification System

### 4.1 Web Audio API Melodic Chime (`soundPlayer.js`)
When an event occurs (e.g. new visit request, security desk check-in, or survey received):
* Generates a 2-tone melodic chime via browser `AudioContext` (no external MP3 file dependency):
  * **Tone 1**: `523.25 Hz` (C5 Note) for 120ms
  * **Tone 2**: `659.25 Hz` (E5 Note) for 240ms
* Supports mute/unmute toggle in topbar stored in `localStorage`.

### 4.2 Toast Notifications (`Sonner`)
* Position: `top-right` with 4.5s auto-dismiss.
* Actionable buttons taking the user directly to the relevant visit or survey.

---

## 📋 5. Form Validation & Client-Side Security (Zod + React Hook Form)

Every form has dedicated Zod validation schemas with XSS escaping:
* **Login Form**: Required identifier, min 3 chars, 15-minute countdown on 429 lockout.
* **Visit Booking Form**: Title, date range (`endTime > startTime`), dynamic room conflict check, opportunity value currency validation.
* **Front Desk Check-In**: Optional custom badge (`COOPV...`), optional verified ID.
* **Customer Feedback**: 1-5 Star Ratings, 0-10 NPS slider, max 1000 character escaped comments.

---

## 🗺️ 6. Screen Hierarchy & Navigation Layout

```
CoopBank Visit Hub UI
├── 🌐 Public Guest Portals
│   ├── /login                     (Staff Authentication with Brute-Force Warning)
│   ├── /forgot-password           (Password Recovery Request)
│   ├── /reset-password            (Password Reset with Token)
│   ├── /book-visit                (Public Visitor Booking Portal)
│   └── /feedback/:token           (5-Star Interactive CSAT / NPS Survey)
│
└── 🔒 Protected Staff Portal (Role-Based Access)
    ├── /dashboard                 (Executive Analytics Cockpit)
    ├── /visits                    (Visits List, Status Badges, Conflict Checks)
    ├── /visits/calendar           (Visual Room & Time Slot Booking Calendar)
    ├── /visits/:id                (Deep Visit Intelligence, Timeline, Notes)
    ├── /security-desk             (Front Desk Check-In / Check-Out & Badging)
    ├── /organizations             (Corporate Partner Directory & Health Scores)
    ├── /organizations/:id         (Organization Profile, History & Deal Pipeline)
    ├── /guests                    (VIP Individual Guest Directory & Stats)
    ├── /notifications             (All Staff Notifications & Activity Feed)
    └── /users                     (Admin User Management & Role Assignment)
```

---

## 🚀 7. Phased Implementation Roadmap

* **Phase 1: Foundation & Design System Setup**:
  * Initialize Vite React in `Coop_Vsit_hub_frontend`.
  * Setup Tailwind CSS with CoopBank gold/navy design tokens and `Outfit`/`Inter` fonts.
  * Implement `core/api/apiClient.js` with Axios interceptors and silent token refresh.
  * Implement `core/utils/soundPlayer.js` (Web Audio API chime).

* **Phase 2: Auth Module (`modules/auth`)**:
  * Login with brute-force lockout countdown timer.
  * Email verification and password reset flows.
  * Role-based route guards (`RoleGuard.jsx`, `ProtectedRoute.jsx`).

* **Phase 3: Core Shell & Navigation (`shared/components/navigation`)**:
  * Brand Sidebar with CoopBank Logo.
  * Topbar with live search, theme toggle, and audio chime notification bell.

* **Phase 4: Executive Analytics Module (`modules/analytics`)**:
  * `/dashboard` executive cockpit with Recharts (Pipeline Trends, CSAT gauge, KPIs).

* **Phase 5: Visits Lifecycle Module (`modules/visits`)**:
  * Paginated & filtered data grid.
  * Multi-step Visit Booking Wizard with real-time room conflict detection.
  * Visit Detail timeline and Approver workflow (`Approve`, `Reject`, `Cancel`).

* **Phase 6: Front Desk Security Cockpit (`modules/visits/pages/SecurityDeskPage`)**:
  * 1-Click Check-In with auto-generated badge (`COOPV2026080001`).
  * 1-Click Check-Out with departure timestamping & survey email dispatch.

* **Phase 7: Intelligence Catalogs (`modules/organizations` & `modules/guests`)**:
  * Partner Organizations cards with 0-100 relationship score gauges.
  * VIP Individual Guests catalog with tiered badges (`VIP_TIER_1`, `VIP_TIER_2`).

* **Phase 8: Public Portals (`modules/feedback`)**:
  * `/book-visit` public booking self-service portal.
  * `/feedback/:token` 5-Star interactive survey with confetti celebration animation.

* **Phase 9: Notifications & User Management (`modules/notifications` & `modules/users`)**:
  * Slide-out interactive notification drawer.
  * Admin user onboarding and role assignment.
