# 🏦 CoopBank Visit Hub (Coop_Vsit_hub)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)

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
* **SMTP:** Cooperative Bank of Oromia internal mail relay (STARTTLS, port 587).
