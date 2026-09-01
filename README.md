# 🏦 CoopBank Visit Hub (Coop_Vsit_hub)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![MailHog](https://img.shields.io/badge/MailHog-SMTP%20Testing-red.svg)](https://github.com/mailhog/MailHog)

An enterprise-grade **Executive Visit Management, Guest Organization Intelligence, & Customer Feedback Platform** built for **Cooperative Bank of Oromia (Coopbank Dx Valley)**. Designed to handle high-concurrency bank operations, secure role-based staff access, strategic relationship tracking, and automated post-visit feedback workflows.

---

## 📸 Platform Overview & UI Screenshots

The platform digitizes and orchestrates high-value executive visits, guest organization portfolios, approval lifecycles, and customer feedback intelligence:

| View | Description | Key Features |
| :--- | :--- | :--- |
| **Requester Dashboard** | Executive dashboard for Relationship Managers & Sponsors | Active Pipeline ($M value), Awaiting Action badges, Upcoming Visits summary, Lifecycle progress status. |
| **Visits Management** | Complete tabular register of all bank visits | Filter by status/priority, search by guest/department, financial value tracking, quick actions. |
| **New Visit Request** | Multi-section submission wizard with conflict checks | Overview, Priority & Value ($ USD opportunity), Presentation themes, Sensitive topic tagging, Sponsor selection. |
| **Guest Organizations** | Strategic relationship intelligence hub | Organization classification, country/market origin, relationship health score, visit history metrics. |
| **Analytics & Intelligence** | Executive reporting suite | Opportunity pipeline conversion %, weighted portfolio value, lifecycle bottleneck distribution. |
| **Customer Feedback Portal** | Public/Tokenized guest feedback portal | Post-visit rating (Hospitality, Facility, Value, CSAT/NPS), qualitative reviews, executive feedback analytics. |

---

## 🏗️ Architecture & Technology Stack

### **Backend Architecture**
* **Framework:** Java 21 (LTS) & Spring Boot 3.x
* **Security & Auth:** Spring Security with JWT (JSON Web Tokens) & Role-Based Access Control (RBAC). Optional OAuth2/OIDC integration ready.
* **ORM & Database Access:** Spring Data JPA with Hibernate, Spring Data Repositories, Liquidbase/Flyway migration support.
* **Documentation & Validation:** Spring Boot Starter Validation (Jakarta Validation), OpenAPI 3.0 (Swagger UI).

### **Database & Caching**
* **Primary Database:** PostgreSQL 16+ (Relational engine with JSONB support, index optimization, and connection pooling via HikariCP).
* **Environment Caching (Optional/Scalable):** Redis for session management and dashboard metrics caching.

### **Email Authentication & Notification System**
* **SMTP Development Server:** **MailHog** (captures all outgoing email notifications, password resets, verification magic links, and post-visit survey invitations without spamming real inboxes).
* **Production SMTP:** Modular JavaMailSender abstraction compatible with enterprise SMTP gateways / SendGrid / AWS SES.

### **Containerization & Deployment**
* **Container Runtime:** Docker & Docker Compose.
* **Containerized Services:**
  1. `coop-visit-app`: Spring Boot Application service.
  2. `coop-postgres-db`: PostgreSQL relational database service with persistent volume storage.
  3. `coop-mailhog`: MailHog SMTP server (`1025`) and Web UI (`8025`).

---

## 🌟 Detailed Feature Breakdown

### 1. 📋 Visit Lifecycle Management
Visits progress through a strictly controlled state machine with automated notifications:
* **States:** `DRAFT` ➡️ `SUBMITTED` ➡️ `UNDER_REVIEW` ➡️ `APPROVED` ➡️ `SCHEDULED` ➡️ `IN_PROGRESS` ➡️ `COMPLETED` ➡️ `REJECTED` / `CANCELLED`.
* **Conflict Checking:** Automatically checks room availability, executive calendar overlaps, and security clearances prior to approval.
* **Priority Tiering:**
  * **Critical / Tier 1 VIP:** Require Executive Committee & C-Level notification.
  * **High:** Departmental Heads & Senior Relationship Managers.
  * **Medium / Low:** Standard business meetings and technical tours.
* **Sensitivity Management:** Flags confidential topics, NDA requirements, and compliance checks.

### 2. 🏛️ Guest Organizations Intelligence
Tracks visiting corporate clients, regulators, strategic partners, and fintech entities:
* **Organization Profiling:** Category (e.g., Strategic Partners, Regulators, Enterprise Customers, Fintech & Startups), Country of Origin, Market Segment.
* **Relationship Scoring:** Dynamic scoring algorithm based on past visit outcomes, transaction volume, and engagement frequency.
* **Key Entities Tracked:** Ethio Telecom, National Bank of Ethiopia (NBE), Visa Inc., Safaricom Ethiopia, Chapa Financial Technologies, WFP, Bloomberg Media, etc.

### 3. 🔐 Bank Staff Access & Security (RBAC) Architecture

The platform enforces a granular, five-role Role-Based Access Control model backed by Spring Security `@PreAuthorize` method-level SpEL checks and frontend route guarding:

| Role Name | Authority String | Target Users & Persona | Accessible Views & Features | Key Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `ROLE_ADMIN` | IT Security, DevOps, System Administrators | • System Dashboard & Full Pipeline Analytics<br>• User Management & Onboarding (`/users`)<br>• System Security Audit Trail (`/audit-logs`)<br>• Meeting Room Master Configuration (`/meeting-rooms`)<br>• Visits Register (`/visits`) & Bookings (`/bookings`)<br>• Partner Organizations (`/organizations`) & Individual Guests (`/guests`)<br>• Reports & PDF/Excel Exports (`/reports`) | Restricted from personal employee tracking view (`/my-tracking`) |
| **Relationship Manager** | `ROLE_RELATIONSHIP_MANAGER` | Relationship Managers, Corporate Officers | • RM Dashboard & Portfolio Pipelines<br>• Partner Organization Portfolio (`/organizations`)<br>• Individual Guests Intelligence (`/guests`)<br>• Schedule New Executive Visits & Delegations (`/visits/new`)<br>• Visits Register (`/visits`) & Bookings (`/bookings`)<br>• Reports & PDF/Excel Exports (`/reports`) | Cannot manage system users, access raw security audit logs, or edit room inventory |
| **Visit Approver** | `ROLE_APPROVER` | Executive Committee, Department Directors, Branch Heads | • Approver Dashboard & Decision Pipeline<br>• Incoming Visit Review & Approval/Rejection Workflow<br>• Visits Register (`/visits`) & Bookings (`/bookings`)<br>• Guest Feedback CSAT & NPS Analytics<br>• Reports & Portfolio Analytics (`/reports`) | Cannot create/edit guest organizations or configure meeting rooms |
| **Security & Front Desk** | `ROLE_SECURITY_DESK` | Headquarters Reception, Lobby Security Officers | • Front Desk Operations Dashboard<br>• Fast Visitor Check-In & Physical Badge Issuance (`/visits`)<br>• Visitor Check-Out & Time Tracking<br>• Real-Time Expected Visitors List & Demographics Verification | Strictly limited to reception check-in/out workflows; cannot approve visits, see opportunity financials, or export executive reports |
| **Active Directory Staff** | `ROLE_EMPLOYEE` | All Bank Employees (Synced via LDAP / AD) | • Internal Meeting Room Calendar & Booking Reservation<br>• **My Meetings & Guests** (`/my-tracking`) — track status of personal visitors & linked boardroom meetings | **Strictly partitioned**: No access to executive dashboards, system users, global visit registers, partner organizations, or administrative reports |

#### 🔑 Active Directory (LDAP / LDAPS) Integration & Auto-Sync
* Bank staff authenticate using standard corporate Windows/AD credentials (`username@coopbank.local`).
* On initial login, accounts are provisioned just-in-time with `ROLE_EMPLOYEE`.
* Staff only see their booked boardrooms and guests linked by their name, phone, or corporate email on the visit date.

### 4. 💬 Customer & Visitor Feedback Section (New Feature)
To ensure continuous improvement in host hospitality and partnership outcomes, a full feedback loop is included:
* **Automated Survey Dispatch:** Upon setting a visit status to `COMPLETED`, the system triggers an email via MailHog containing a secure, single-use tokenized feedback link.
* **Feedback Submission Form:**
  * Overall Experience (1-5 Star Rating).
  * Hospitality & Reception Satisfaction.
  * Facilities & Dx Valley Infrastructure Quality.
  * Meeting Objectives Fulfillment & Partnership Value.
  * Open Feedback / Qualitative Comments.
  * Net Promoter Score (NPS) Likelihood to Recommend.
* **Feedback Analytics Dashboard:** Bank staff with approver/sponsor access can analyze CSAT trends, hospitality performance, and guest comments.

### 5. 📊 Executive Analytics & Metrics
* **Opportunity Pipeline:** Sum of opportunity values ($ USD / ETB) tied to active visits.
* **Approval Conversion Rate:** Ratio of submitted requests converted to approved/completed status.
* **Weighted Portfolio Value:** Risk-adjusted financial representation of strategic partnerships.

---

## 🗄️ Database Schema Overview

```
+-------------------+       +-------------------+       +-----------------------+
|      users        |       |    user_roles     |       |         roles         |
+-------------------+       +-------------------+       +-----------------------+
| id (PK)           |<----->| user_id (FK)      |<----->| id (PK)               |
| username          |       | role_id (FK)      |       | name (ROLE_*)         |
| email             |       +-------------------+       +-----------------------+
| password_hash     |
| full_name         |
| department        |
+-------------------+
          |
          | 1:N
          v
+-----------------------------------+       +-----------------------------------+
|              visits               |       |           organizations           |
+-----------------------------------+       +-----------------------------------+
| id (PK)                           |  N:1  | id (PK)                           |
| visit_code (UUID/REF)             |------>| name                              |
| title                             |       | category                          |
| visit_type (INTERNAL/EXTERNAL)    |       | market_country                    |
| priority (CRITICAL/HIGH/MEDIUM)   |       | relationship_score                |
| status (DRAFT/SUBMITTED/etc.)     |       +-----------------------------------+
| opportunity_value (NUMERIC)       |
| requesting_department             |
| requester_id (FK -> users)        |
| sponsor_id (FK -> users)          |
| scheduled_start_time              |
| scheduled_end_time                |
| sensitive_topics                  |
+-----------------------------------+
          |
          | 1:1
          v
+-----------------------------------+
|          visit_feedbacks          |
+-----------------------------------+
| id (PK)                           |
| visit_id (FK -> visits, UNIQUE)   |
| token (UUID)                      |
| hospitality_score (1-5)           |
| facility_score (1-5)              |
| objective_score (1-5)             |
| nps_score (0-10)                  |
| comments (TEXT)                   |
| submitted_at (TIMESTAMP)          |
+-----------------------------------+
```

---

## 🛠️ API Endpoint Specifications

### **1. Authentication & User Management**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and return JWT bearer token. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset token via MailHog email. |
| `GET` | `/api/v1/users/me` | Authenticated | Fetch current signed-in bank staff profile. |

### **2. Visit Management**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/visits` | Authenticated | List all visits (with filtering, search, and pagination). |
| `POST` | `/api/v1/visits` | RM / Admin | Create a new visit request or save draft. |
| `GET` | `/api/v1/visits/{id}` | Authenticated | Fetch detailed visit record by ID. |
| `PUT` | `/api/v1/visits/{id}/status` | Approver / Admin | Transition visit status (`APPROVED`, `REJECTED`, etc.). |
| `POST` | `/api/v1/visits/{id}/check-in` | Security | Security desk visitor check-in. |

### **3. Organizations Intelligence**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/organizations` | Authenticated | List guest organizations and portfolio stats. |
| `POST` | `/api/v1/organizations` | RM / Admin | Register new guest organization. |

### **4. Customer Feedback API**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/feedback/verify/{token}` | Public | Verify feedback token validity for customer survey. |
| `POST` | `/api/v1/feedback/submit` | Public | Submit customer feedback survey. |
| `GET` | `/api/v1/feedback/analytics` | Executive / Admin | Retrieve aggregated CSAT & feedback metrics. |

### **5. Executive Analytics**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard` | Executive / RM | Summary KPIs (Pipeline $, conversion %, lifecycle breakdown). |

---

## 🐳 Docker & Local Setup Guide

### **Prerequisites**
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose v2+)
* [JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) (for local CLI build)
* [Maven 3.9+](https://maven.apache.org/) (or use included `./mvnw`)

### **1. Container Architecture (`docker-compose.yml`)**

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./Coop_Vsit_hub
      dockerfile: Dockerfile
    container_name: coop-visit-app
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/coop_visit_db
      - SPRING_DATASOURCE_USERNAME=coop_user
      - SPRING_DATASOURCE_PASSWORD=coop_secure_pass
      - SPRING_MAIL_HOST=mailhog
      - SPRING_MAIL_PORT=1025
    depends_on:
      - db
      - mailhog
    restart: always

  db:
    image: postgres:16-alpine
    container_name: coop-postgres-db
    environment:
      - POSTGRES_DB=coop_visit_db
      - POSTGRES_USER=coop_user
      - POSTGRES_PASSWORD=coop_secure_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  mailhog:
    image: mailhog/mailhog:latest
    container_name: coop-mailhog
    ports:
      - "1025:1025" # SMTP server port
      - "8025:8025" # Web UI port
    restart: always

volumes:
  postgres_data:
```

### **2. Quick Start Commands**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RedietBT/Coop_Vsit_hub.git
   cd Coop_Vsit_hub
   ```

2. **Build Maven Application:**
   ```bash
   cd Coop_Vsit_hub
   ./mvnw clean package -DskipTests
   cd ..
   ```

3. **Launch Docker Environment:**
   ```bash
   docker-compose up -d --build
   ```

4. **Verify Running Containers:**
   ```bash
   docker-compose ps
   ```

---

## 🧪 Testing Email Notifications & MailHog

When an event occurs (e.g. Visit Approved, Password Reset, Feedback Request sent to customer):
1. Open your browser and navigate to **MailHog Web Dashboard**: [`http://localhost:8025`](http://localhost:8025)
2. View trapped outgoing email messages in real time.
3. Inspect HTML email rendering, authentication links, and survey token URLs.

---

## 📈 Scalability & Production Readiness

For deployment into Cooperative Bank of Oromia's data center or private cloud infrastructure:
1. **High Concurrency Connection Pooling:** Configured HikariCP pool with dynamic auto-scaling tailored for multi-branch bank traffic.
2. **Spring Boot Actuator & Health Checks:** Integrates with Prometheus and Grafana for server metrics monitoring.
3. **Database Indexing Strategy:** Indexing on `visit_code`, `status`, `requesting_department`, and `guest_organization_id` ensures sub-10ms query performance on large datasets.
4. **Audit Compliance:** Automatic timestamping (`created_at`, `updated_at`, `created_by`) on all transactional records.

---

## 🤝 Contributing & Maintenance

Developed for **Coopbank Dx Valley**. All modifications must comply with bank security standards and software engineering best practices.

* **Repository Maintainer:** RedietBT
* **Organization:** Cooperative Bank of Oromia
