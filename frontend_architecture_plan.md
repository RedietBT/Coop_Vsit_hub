# 🎨 CoopBank Visit Hub – Frontend Architecture & Implementation Roadmap

Comprehensive architectural blueprint, design system, API integration sequence, state management strategy, and UI component hierarchy for **Cooperative Bank of Oromia (CoopBank DxValley)**.

---

## 🏛️ 1. Technical Stack & Core Libraries

| Category | Technology | Version / Tool | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | **React.js (SPA)** | `React 18 + Vite` | Fast Hot Module Replacement (HMR) & clean modular architecture |
| **Language** | **JavaScript (ES6+)** | Modern JS / JSX | Dynamic, readable, and clean component structure |
| **Styling** | **Tailwind CSS** | `Tailwind v3.4+` | Utility-first CSS with custom CoopBank brand design tokens |
| **UI Components** | **Headless UI / Radix / Lucide** | `lucide-react` | Enterprise SVG icons and accessible headless modals/menus |
| **State Management** | **Zustand** | `zustand` | Lightweight, scalable state stores (Auth, Visits, Notifications, UI) |
| **Form Handling** | **React Hook Form** | `react-hook-form` | High-performance uncontrolled forms with minimal re-renders |
| **Validation** | **Zod** | `zod` + `@hookform/resolvers` | Client-side schema validation, regex checks, and sanitization |
| **HTTP Client** | **Axios** | `axios` | Global interceptors for JWT Bearer token & automatic token refresh |
| **Data Visualization** | **Recharts** | `recharts` | Interactive charts for executive deal pipelines, CSAT & conversion |
| **Notifications** | **Sonner** + Web Audio API | `sonner` | Toast popups paired with a pleasant custom audio notification chime |
| **Routing** | **React Router DOM** | `react-router-dom v6` | Protected routes, RBAC guards, and public guest portals |
| **Animations** | **Framer Motion** | `framer-motion` | Smooth page transitions, modal slides, and pulse alerts |

---

## 🎨 2. CoopBank Brand Design System & Aesthetics

### 2.1 Official Color Palette
The UI adheres strictly to the official **Cooperative Bank of Oromia (CoopBank)** corporate visual identity:

* **Primary Gold / Yellow**: `#F39200` (Accent / CTA Buttons / Badges / Highlight Glow)
* **Secondary Gold**: `#FDB714` (Hover states / Gradient blend)
* **Primary Deep Navy**: `#002D62` (Sidebar / Header accents / Primary text contrast)
* **Dark Slate / Charcoal**: `#0B1B3D` & `#0F172A` (Card backgrounds / Dark theme foundations)
* **Surface Light**: `#F8FAFC` & `#FFFFFF` (Light mode backgrounds / Card containers)
* **Status Accents**:
  * `APPROVED` / `COMPLETED`: `#10B981` (Emerald Green)
  * `SUBMITTED` / `UNDER_REVIEW`: `#3B82F6` (Electric Blue)
  * `IN_PROGRESS`: `#F59E0B` (Amber Orange)
  * `REJECTED` / `CANCELLED`: `#EF4444` (Rose Red)

### 2.2 Typography & Hierarchy
* **Headings & Display**: `Outfit` (Google Fonts) – modern, geometric, banking-grade aesthetic.
* **Body, Data Grids & Forms**: `Inter` – ultra-clean legibility for financial numbers and tables.

### 2.3 Visual Design Features
* **Glassmorphism & Frosted Glass**: Modern backdrop blur (`backdrop-blur-md bg-white/80 dark:bg-slate-900/80`).
* **Micro-Interactions**: Button click scale dips, smooth card hover lifts, badge pulse indicators for active check-ins.
* **CoopBank Logo Integration**: Official high-res logo with responsive scaling in Navbar and Auth screens.

---

## 🔔 3. Real-Time Notifications & Auditory Feedback System

### 3.1 Audio Alert Chime (Web Audio API)
* Whenever a new notification is triggered (e.g., visitor arrives at security desk, new visit requested, or survey submitted), a pleasant, low-frequency 2-tone melodic chime plays:
  * Tone 1: `523.25 Hz` (C5) for 120ms
  * Tone 2: `659.25 Hz` (E5) for 240ms
* Configurable sound toggle (Mute / Unmute) saved in user preferences.

### 3.2 Toast System (`Sonner`)
* Position: `top-right` with auto-dismiss (4.5 seconds).
* Displays icon matching `notificationType` (`VISIT_REQUESTED`, `VISIT_APPROVED`, `VISITOR_CHECKED_IN`, `FEEDBACK_SUBMITTED`).
* Direct click-action taking staff to the exact visit detail view.

---

## 🗄️ 4. Zustand State Management Architecture

```
src/store/
├── useAuthStore.js          # User profile, tokens, login/logout, RBAC permissions
├── useVisitStore.js         # Visits list, filters, selected visit, calendar state
├── useOrganizationStore.js  # Partner organizations catalog & stats
├── useGuestStore.js         # VIP Individual guests directory & stats
├── useNotificationStore.js  # Notifications list, unread badge counter, audio player
└── useUIStore.js            # Dark/light theme, sidebar toggle, modal states
```

### 4.1 Auth Store & Silent Refresh Flow
* `useAuthStore` stores `user`, `accessToken`, `refreshToken`, `isAuthenticated`, and `roles`.
* Axios request interceptor injects `Authorization: Bearer <accessToken>`.
* Axios response interceptor intercepts `401 Unauthorized`, automatically calls `POST /api/v1/auth/refresh`, updates the token, and replays the failed request seamlessly without logging the user out.

---

## 🛡️ 5. Form Validation & Client-Side Security

All forms use **React Hook Form + Zod**:

1. **Login Form**:
   * Username / Email: Minimum 3 characters, trimmed.
   * Password: Required.
   * Lockout alert: Listens for `429 Access Restricted` and displays live 15-minute countdown timer.
2. **Visit Request Form**:
   * Title: 5 to 150 chars.
   * Opportunity Value: Positive currency numbers.
   * Room Selection: Dynamic real-time room availability validation.
   * Start / End Time: `scheduledEndTime` must be after `scheduledStartTime`.
   * Either `guestOrganizationId` OR `individualGuestFirstName` + `individualGuestLastName` is enforced dynamically depending on `guestCategory`.
3. **Check-In Form**:
   * Custom badge number: Optional (`COOPV...`).
   * Verified ID number: Optional.
4. **Customer Feedback Form**:
   * Hospitality, Facility, Objective: 1 to 5 Stars required.
   * NPS Score: 0 to 10 Scale required.
   * Comments: Max 1000 characters, XSS escaped.

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

## 🚀 7. Step-by-Step Frontend Implementation Sequence

### Phase 1: Project Scaffolding & Design Foundation
1. Initialize Vite React project in `Coop_Vsit_hub_frontend`.
2. Install dependencies: `tailwindcss`, `lucide-react`, `zustand`, `axios`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`, `recharts`, `sonner`, `framer-motion`, `canvas-confetti`.
3. Configure `tailwind.config.js` with CoopBank gold, navy, and dark mode palette.
4. Set up `api/client.js` with Axios interceptors and token refresh handler.
5. Create sound utility (`utils/audioChime.js`) for notifications.

### Phase 2: Authentication & Onboarding Module
1. Build `useAuthStore.js`.
2. Implement **Login Screen** (`/login`) with error banners and lockout timer.
3. Implement **Email Verification** (`/verify-email/:token`) & **Password Reset** (`/forgot-password`, `/reset-password`).
4. Implement `ProtectedRoute` with Role-Based Access Control (`ROLE_ADMIN`, `ROLE_RELATIONSHIP_MANAGER`, `ROLE_APPROVER`, `ROLE_SECURITY_DESK`).

### Phase 3: Global Shell & Notification System
1. Implement **Sidebar Navigation** with active route highlights and CoopBank logo.
2. Implement **Top Navbar**:
   * Global search bar.
   * **Notification Bell** with unread count badge, real-time audio chime, and interactive dropdown drawer.
   * User profile menu & 1-click logout with token revocation.
3. Implement `useNotificationStore.js` with polling and notification management.

### Phase 4: Executive Analytics Dashboard (`/dashboard`)
1. Implement `GET /api/v1/analytics/dashboard` integration.
2. Key KPI Metric Cards:
   * Total Financial Pipeline ($ USD) & Realized Value.
   * Deal Conversion Rate % & CSAT Score Gauge.
   * Active, In-Progress, and Scheduled Visits.
3. Interactive Charts:
   * Monthly Pipeline Trends (Area Chart).
   * Visit Status Breakdown (Donut Chart).
   * Top Partner Organizations & VIP Guests Table.
   * Live Security Desk Activity Stream.

### Phase 5: Visits Lifecycle Management (`/visits`)
1. Implement Paginated & Filterable Visits Data Grid (`GET /api/v1/visits`).
2. Multi-criteria filters (Search text, Status pill selector, Priority, Room, Date range).
3. **Create Visit Modal / Multi-step Wizard**:
   * Step 1: Visit Details & Objectives ($ pipeline value).
   * Step 2: Guest Category (Select from Partner Org or Individual VIP).
   * Step 3: Room Selection with live double-booking conflict prevention alerts.
4. Visit Detail View (`/visits/:id`):
   * Status workflow action bar (`Approve`, `Reject`, `Cancel`).
   * Timeline stepper (`Draft` ➡️ `Submitted` ➡️ `Approved` ➡️ `In Progress` ➡️ `Completed`).
   * Meeting notes, sensitive topics, and presentation theme details.

### Phase 6: Front Desk Security Cockpit (`/security-desk`)
1. Filtered view of `APPROVED` & `IN_PROGRESS` visits for the current day.
2. Quick Search by Visitor Name, Company, or Visit Code (`VIS-2026-XXXX`).
3. **1-Click Check-In Modal**:
   * Displays visitor details.
   * Optional custom badge or auto-generates badge (`COOPV2026080001`).
   * Optional verified ID number.
   * Check-in confirmation with instant badge print preview.
4. **1-Click Check-Out Modal**:
   * Departure timestamp recording.
   * Triggers automatic customer satisfaction survey email dispatch.

### Phase 7: Guest Organizations & VIP Individual Intelligence
1. **Organizations Catalog** (`/organizations`):
   * Corporate cards with Relationship Health Score badges (0–100).
   * Add Partner Org modal (`POST /api/v1/organizations`).
   * Org Profile with attended visit logs and deal value summary.
2. **VIP Individual Guests Directory** (`/guests`):
   * Tiered VIP badges (`VIP_TIER_1`, `VIP_TIER_2`, `STANDARD_GUEST`).
   * Add VIP Guest modal with Passport / National ID validation.

### Phase 8: Public Client Portals
1. **Public Visit Request Portal** (`/book-visit`):
   * Sleek, branded self-service form for external clients to request an executive visit.
   * Confirmation screen with human-readable tracking code.
2. **Post-Visit CSAT & NPS Survey Portal** (`/feedback/:token`):
   * Validates survey token on page load (`GET /api/v1/feedback/verify/:token`).
   * Interactive 5-Star rating components for Hospitality, Facilities, and Objectives.
   * 0–10 Net Promoter Score (NPS) slider.
   * Submit survey with confetti celebration animation (`canvas-confetti`).

### Phase 9: Staff User & Access Control Management (`/users`)
1. User Management roster (Admin only).
2. Register staff member modal with department & role multi-select.
3. User profile details, lock/unlock toggle, and role modification drawer.
