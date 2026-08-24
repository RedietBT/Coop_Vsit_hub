# 🏦 CoopBank Visit Hub – End-to-End API Testing & QA Guide

Complete step-by-step testing manual and request payload library for **Cooperative Bank of Oromia (CoopBank DxValley)**.

---

## 🔑 Environment & Credentials Quick Reference

| Service | URL / Port | Credentials / Notes |
| :--- | :--- | :--- |
| **Backend API** | `http://localhost:8080` | Spring Boot 3.3.4 (Java 21) |
| **Swagger UI Docs** | `http://localhost:8080/swagger-ui/index.html` | **Basic Auth**: `coop_admin` / `CoopBank2026!` |
| **MailHog Web UI** | `http://localhost:8025` | Inspect HTML emails and verification tokens |
| **PostgreSQL DB** | `localhost:5432` (`coop_visit_db`) | `coop_user` / `coop_secure_pass` |
| **Redis Cache** | `localhost:6379` | Session tokens, blacklist & rate-limiting |
| **Admin User** | Identifier: `admin` | Password: `ChangeMe@CoopBank2026!` |

---

## 📋 Table of Contents
1. [Module 1: Authentication & User Management](#module-1-authentication--user-management)
2. [Module 2: Visits Lifecycle Management](#module-2-visits-lifecycle-management)
3. [Module 3: Guest Organizations Intelligence](#module-3-guest-organizations-intelligence)
4. [Module 3.1: VIP Individual Guests Intelligence](#module-31-vip-individual-guests-intelligence)
5. [Module 4: Customer Feedback & Public Booking](#module-4-customer-feedback--public-booking)
6. [Module 5: Executive Analytics Dashboard](#module-5-executive-analytics-dashboard)
7. [Module 6: Staff Notifications & Alerts](#module-6-staff-notifications--alerts)

---

# Module 1: Authentication & User Management

### 1.1 Admin Authentication (`POST /api/v1/auth/login`)
Authenticate to receive the JWT Bearer Access Token.

* **Endpoint**: `POST http://localhost:8080/api/v1/auth/login`
* **Request Body**:
```json
{
  "identifier": "admin",
  "password": "ChangeMe@CoopBank2026!"
}
```
* **Expected Response (`200 OK`)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "48c2b740-f655-46a4-8ec5-18147d3d758f",
  "tokenType": "Bearer",
  "expiresInMs": 1800000,
  "isEmailVerified": true,
  "mustChangePassword": false,
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "username": "admin",
    "email": "admin@coopbank.com.et",
    "fullName": "System DxValley Admin",
    "roles": ["ROLE_ADMIN"]
  }
}
```

---

### 1.2 Register New Bank Staff Member (`POST /api/v1/auth/register`)
* **Headers**: `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`
* **Endpoint**: `POST http://localhost:8080/api/v1/auth/register`
* **Request Body**:
```json
{
  "username": "chala_tadesse",
  "email": "chala.tadesse@coopbank.com.et",
  "firstName": "Chala",
  "middleName": "Gudeta",
  "lastName": "Tadesse",
  "department": "Corporate & Institutional Banking",
  "phoneNumber": "+251911445566",
  "roles": ["ROLE_RELATIONSHIP_MANAGER"]
}
```
* **Expected Result**: User created with temporary password. Branded onboarding email dispatched to MailHog (`http://localhost:8025`).

---

### 1.3 Verify Staff Email via Token (`GET /api/v1/auth/verify-email/{token}`)
* **Endpoint**: `GET http://localhost:8080/api/v1/auth/verify-email/{token}`
* *(Extract the token from MailHog or Redis key `email_verify:*`)*
* **Expected Response (`200 OK`)**:
```json
{
  "message": "Email address verified successfully. You may now sign in using your credentials."
}
```

---

### 1.4 Refresh JWT Access Token (`POST /api/v1/auth/refresh`)
* **Endpoint**: `POST http://localhost:8080/api/v1/auth/refresh`
* **Request Body**:
```json
{
  "refreshToken": "<REFRESH_TOKEN_UUID>"
}
```

---

### 1.5 Brute-Force 3-Attempt Lockout Verification
Attempt to login with wrong credentials 3 times:
```json
{
  "identifier": "chala_tadesse",
  "password": "IncorrectPassword123!"
}
```
* **Attempt 1 & 2**: `HTTP 400 Bad Request` (*"Invalid username/email or password."*)
* **Attempt 3 & 4**: `HTTP 429 Access Restricted`:
```json
{
  "path": "/api/v1/auth/login",
  "error": "Access Restricted",
  "message": "Account is temporarily locked due to 3 consecutive failed login attempts. Please try again after 15 minutes.",
  "status": 429
}
```

---

### 1.6 User Management Endpoints (Admin Access)
* **List Users**: `GET http://localhost:8080/api/v1/users?page=0&size=10`
* **Get User Profile**: `GET http://localhost:8080/api/v1/users/{userId}`
* **Update Roles**: `PATCH http://localhost:8080/api/v1/users/{userId}/roles`
```json
{
  "roles": ["ROLE_RELATIONSHIP_MANAGER", "ROLE_APPROVER"]
}
```
* **Update Account Status (Lock/Unlock)**: `PATCH http://localhost:8080/api/v1/users/{userId}/status`
```json
{
  "enabled": true,
  "accountNonLocked": true
}
```

---

# Module 2: Visits Lifecycle Management

### 2.1 Create Formal Executive Visit Request (`POST /api/v1/visits`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `POST http://localhost:8080/api/v1/visits`
* **Request Body**:
```json
{
  "title": "FinTech Core Banking API Integration Review",
  "requestingDepartment": "Digital Banking & Payments",
  "visitType": "EXTERNAL",
  "visitObjective": "Strategic evaluation of Open Banking API endpoints and merchant settlement channels.",
  "expectedOutcome": "Finalize MoU and API sandbox credentials",
  "priorityLevel": "HIGH",
  "opportunityValue": 3500000.00,
  "currency": "USD",
  "presentationTheme": "CoopBank Open Banking 2.0 Architecture",
  "sensitiveTopics": "Core banking middleware credentials and SLA penalties",
  "locationRoom": "DxValley Boardroom A",
  "visitorCount": 3,
  "guestCategory": "ORGANIZATION",
  "guestOrganizationId": "<ORGANIZATION_UUID>",
  "individualGuestFirstName": "Samuel",
  "individualGuestLastName": "Kassaye",
  "individualGuestEmail": "samuel.k@fintechsolutions.com",
  "individualGuestPhone": "+251911998877",
  "individualGuestTitle": "Chief Technology Officer",
  "scheduledStartTime": "2026-10-05T09:00:00Z",
  "scheduledEndTime": "2026-10-05T11:30:00Z",
  "isDraft": false
}
```
* **Expected Response (`201 Created`)**: Returns `VIS-2026-XXXX` with status `SUBMITTED`.

---

### 2.2 Room Double-Booking Conflict Prevention Check
Submit another visit booking for the exact same room (`DxValley Boardroom A`) overlapping `2026-10-05T09:00:00Z` to `2026-10-05T11:30:00Z`.
* **Expected Response (`400 Bad Request`)**:
```json
{
  "error": "Room Conflict: 'DxValley Boardroom A' is already booked for visit 'VIS-2026-XXXX' between 2026-10-05T09:00:00Z and 2026-10-05T11:30:00Z."
}
```

---

### 2.3 Approve / Reject Visit (`PUT /api/v1/visits/{id}/status`)
* **Headers**: `Authorization: Bearer <APPROVER_OR_ADMIN_TOKEN>`
* **Endpoint**: `PUT http://localhost:8080/api/v1/visits/{visitId}/status`
* **Request Body (Approve)**:
```json
{
  "status": "APPROVED",
  "decisionNotes": "Approved by Executive Committee. VIP catering and presentation equipment arranged."
}
```

---

### 2.4 Front Desk Security Check-In (`POST /api/v1/visits/{id}/check-in`)
* **Headers**: `Authorization: Bearer <SECURITY_DESK_TOKEN>`
* **Endpoint**: `POST http://localhost:8080/api/v1/visits/{visitId}/check-in`
* **Request Body**:
```json
{
  "customBadgeNumber": "COOPV2026080001",
  "verifiedIdNumber": "ETH-PASS-908234"
}
```
* **Expected Outcome**: Visit status transitions to `IN_PROGRESS`. Badge assigned. Alert notification sent to host sponsor.

---

### 2.5 Front Desk Security Check-Out (`POST /api/v1/visits/{id}/check-out`)
* **Endpoint**: `POST http://localhost:8080/api/v1/visits/{visitId}/check-out`
* **Request Body**:
```json
{}
```
* **Expected Outcome**: Visit status transitions to `COMPLETED`. Automated post-visit satisfaction survey email dispatched to visitor via MailHog.

---

# Module 3: Guest Organizations Intelligence

### 3.1 Register Guest Organization (`POST /api/v1/organizations`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `POST http://localhost:8080/api/v1/organizations`
* **Request Body**:
```json
{
  "name": "Ethiopian Airlines Technology Group",
  "category": "Enterprise Airlines & Aviation",
  "marketCountry": "Ethiopia",
  "relationshipScore": 95,
  "contactPersonName": "Mesfin Tasew",
  "contactEmail": "mesfin.t@ethiopianairlines.com",
  "contactPhone": "+251911001122",
  "notes": "Primary partner for corporate payment gateways and loyalty card integrations."
}
```

---

### 3.2 Fetch Organization Profile & Deal History (`GET /api/v1/organizations/{id}`)
* **Endpoint**: `GET http://localhost:8080/api/v1/organizations/{orgId}`
* **Expected Response**:
```json
{
  "id": "...",
  "name": "Ethiopian Airlines Technology Group",
  "relationshipScore": 95,
  "totalVisitsAttended": 3,
  "totalOpportunityPipelineValue": 12500000.00,
  "currency": "USD",
  "recentVisits": [...]
}
```

---

### 3.3 Organizations Portfolio Analytics (`GET /api/v1/organizations/stats`)
* **Endpoint**: `GET http://localhost:8080/api/v1/organizations/stats`

---

# Module 3.1: VIP Individual Guests Intelligence

### 3.1.1 Register VIP Individual Guest (`POST /api/v1/guests`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `POST http://localhost:8080/api/v1/guests`
* **Request Body**:
```json
{
  "firstName": "Dawit",
  "middleName": "Tadesse",
  "lastName": "Alemu",
  "email": "dawit.alemu@advisory.et",
  "phoneNumber": "+251911223344",
  "idNumber": "EP2948194",
  "idType": "PASSPORT",
  "guestTitle": "Principal Financial Sector Advisor",
  "organizationAffiliation": "East Africa FinTech Council",
  "countryOfResidence": "Ethiopia",
  "vipTier": "VIP_TIER_1",
  "relationshipScore": 90,
  "notes": "Key advisor on digital banking regulations and remittance frameworks."
}
```

---

### 3.1.2 Guest Portfolio Analytics (`GET /api/v1/guests/stats`)
* **Endpoint**: `GET http://localhost:8080/api/v1/guests/stats`
* **Expected Response**:
```json
{
  "totalIndividualGuests": 1,
  "averageRelationshipScore": 90.0,
  "guestsByVipTier": {
    "VIP_TIER_1": 1
  },
  "guestsByIdType": {
    "PASSPORT": 1
  }
}
```

---

# Module 4: Customer Feedback & Public Booking

### 4.1 Public Customer Visit Booking (`POST /api/v1/visits/public-booking`)
* **Public Endpoint** (No Authorization Header required).
* **Endpoint**: `POST http://localhost:8080/api/v1/visits/public-booking`
* **Request Body**:
```json
{
  "title": "Corporate Payroll & Foreign Currency Peering Consultation",
  "requestedDepartment": "Corporate Banking",
  "guestCategory": "ORGANIZATION",
  "organizationName": "Safaricom Telecommunications Ethiopia",
  "contactPersonFirstName": "Anwar",
  "contactPersonLastName": "Soussa",
  "contactEmail": "anwar.soussa@safaricom.et",
  "contactPhone": "+251970000000",
  "guestTitle": "Managing Director",
  "visitorCount": 5,
  "preferredStartTime": "2026-10-12T10:00:00Z",
  "preferredEndTime": "2026-10-12T12:30:00Z",
  "visitObjective": "Discuss bulk salary disbursement and M-PESA merchant settlement tie-up.",
  "additionalNotes": "Requires projector and executive boardroom setup."
}
```

---

### 4.2 Verify Feedback Token (`GET /api/v1/feedback/verify/{token}`)
* **Endpoint**: `GET http://localhost:8080/api/v1/feedback/verify/{surveyToken}`
* **Expected Response (`200 OK`)**:
```json
{
  "valid": true,
  "visitCode": "VIS-2026-0003",
  "visitTitle": "Safaricom Partnership Review",
  "guestDisplayName": "Safaricom Telecommunications Ethiopia",
  "alreadySubmitted": false,
  "expired": false,
  "message": "Token verified successfully. Welcome to CoopBank DxValley Guest Feedback!"
}
```

---

### 4.3 Submit Customer Feedback Survey (`POST /api/v1/feedback/submit`)
* **Endpoint**: `POST http://localhost:8080/api/v1/feedback/submit`
* **Request Body**:
```json
{
  "token": "fb-58291f09-b68a-446a-9f5b-d40232490ab8",
  "hospitalityRating": 5,
  "facilityRating": 5,
  "objectiveRating": 5,
  "npsScore": 10,
  "comments": "Outstanding executive reception and state-of-the-art boardroom at DxValley."
}
```

---

### 4.4 Aggregate Feedback Analytics (`GET /api/v1/feedback/analytics`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `GET http://localhost:8080/api/v1/feedback/analytics`
* **Expected Response**:
```json
{
  "totalSurveysSent": 1,
  "totalSurveysCompleted": 1,
  "responseRatePercentage": 100.0,
  "averageHospitalityRating": 5.0,
  "averageFacilityRating": 5.0,
  "averageObjectiveRating": 5.0,
  "averageOverallRating": 5.0,
  "csatPercentage": 100.0,
  "netPromoterScore": 100,
  "npsBreakdown": {
    "Promoters (9-10)": 1,
    "Passives (7-8)": 0,
    "Detractors (0-6)": 0
  }
}
```

---

# Module 5: Executive Analytics Dashboard

### 5.1 Executive Cockpit Overview (`GET /api/v1/analytics/dashboard`)
* **Headers**: `Authorization: Bearer <ADMIN_OR_EXECUTIVE_TOKEN>`
* **Endpoint**: `GET http://localhost:8080/api/v1/analytics/dashboard`
* **Expected Response**:
```json
{
  "totalPipelineValue": 6800000.00,
  "realizedCompletedValue": 2500000.00,
  "activePipelineValue": 4300000.00,
  "pendingReviewValue": 0.00,
  "averageDealSize": 1700000.00,
  "currency": "USD",
  "totalVisitsCount": 4,
  "completedVisitsCount": 1,
  "approvedVisitsCount": 1,
  "inProgressVisitsCount": 0,
  "awaitingApprovalCount": 2,
  "conversionRatePercentage": 100.0,
  "approvalRatePercentage": 100.0,
  "averageVisitDurationMinutes": 45.0,
  "csatScorePercentage": 100.0,
  "netPromoterScore": 100,
  "surveyResponseRatePercentage": 100.0,
  "totalPartnerOrganizations": 2,
  "totalIndividualGuests": 1,
  "averageOrganizationRelationshipScore": 92.5,
  "averageIndividualGuestRelationshipScore": 90.0,
  "visitsByStatus": {
    "SUBMITTED": 2,
    "APPROVED": 1,
    "COMPLETED": 1
  },
  "visitsByPriority": {
    "HIGH": 2,
    "CRITICAL": 1,
    "MEDIUM": 1
  },
  "topPartnerOrganizations": [...],
  "topVipGuests": [...],
  "upcomingScheduledVisits": [...],
  "recentAuditActivities": [...]
}
```

---

# Module 6: Staff Notifications & Alerts

### 6.1 Unread Notification Counter (`GET /api/v1/notifications/unread-count`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `GET http://localhost:8080/api/v1/notifications/unread-count`
* **Expected Response**:
```json
{
  "unreadCount": 3
}
```

---

### 6.2 List Staff Notifications (`GET /api/v1/notifications`)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Endpoint**: `GET http://localhost:8080/api/v1/notifications?unreadOnly=false&page=0&size=10`
* **Expected Response**:
```json
{
  "content": [
    {
      "id": "e8964205-0916-466d-ad69-13840e4fbc87",
      "title": "New Visit Booking Request: VIS-2026-0005",
      "message": "A new visit request 'Cloud Infrastructure Review' for 'Ethio Telecom' has been submitted for executive review.",
      "notificationType": "VISIT_REQUESTED",
      "referenceCode": "VIS-2026-0005",
      "read": false,
      "createdAt": "2026-08-24T06:49:40Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

---

### 6.3 Mark Notification Read (`PATCH /api/v1/notifications/{id}/read`)
* **Endpoint**: `PATCH http://localhost:8080/api/v1/notifications/{notifId}/read`

---

### 6.4 Mark All Notifications Read (`PATCH /api/v1/notifications/mark-all-read`)
* **Endpoint**: `PATCH http://localhost:8080/api/v1/notifications/mark-all-read`

---

### 6.5 Dismiss Notification (`DELETE /api/v1/notifications/{id}`)
* **Endpoint**: `DELETE http://localhost:8080/api/v1/notifications/{notifId}`
