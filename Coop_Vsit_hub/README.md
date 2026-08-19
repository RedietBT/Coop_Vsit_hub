# 🏦 CoopBank Visit Hub Backend (Spring Boot Service)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![MailHog](https://img.shields.io/badge/MailHog-SMTP-red.svg)](https://github.com/mailhog/MailHog)

This sub-folder contains the **Spring Boot Core Backend Service** for the **CoopBank Executive Visit Management & Customer Feedback Hub**.

---

## 🚀 Quick Local Development Setup

### 1. Requirements
* Java 21 LTS
* Maven 3.9+ (or `./mvnw`)
* Docker & Docker Compose (for Postgres & MailHog)

### 2. Start Supporting Services (Postgres & MailHog)
From the root project directory:
```bash
docker-compose up db mailhog -d
```

### 3. Run Application Locally
```bash
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`.

### 4. MailHog Web Interface
Access intercepted email authentication tokens and post-visit survey emails at:
`http://localhost:8025`

---

## 📌 Main Project Modules

* `com.example.coop_vsit_hub.controller`: REST APIs for Visits, Guest Organizations, Feedback, Analytics, and Auth.
* `com.example.coop_vsit_hub.service`: Business logic for Visit lifecycle state machine, feedback token generation, conflict checks, and MailHog SMTP notifications.
* `com.example.coop_vsit_hub.repository`: JPA repositories with custom queries and pagination support.
* `com.example.coop_vsit_hub.model`: JPA entities (`Visit`, `Organization`, `User`, `VisitFeedback`, `Role`).
* `com.example.coop_vsit_hub.security`: Spring Security configuration, JWT filter, and RBAC annotations.

---

For full architecture details, DB schema diagrams, and endpoint specs, see the main [Root README](../README.md).
