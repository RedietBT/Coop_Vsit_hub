# 🏦 CoopBank Visit Hub Backend (Spring Boot Service)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

This sub-folder contains the **Spring Boot Core Backend Service** for the **CoopBank Executive Visit Management & Customer Feedback Hub**.

---

## 🚀 Quick Local Development Setup

### 1. Requirements
* Java 21 LTS
* Maven 3.9+ (or `./mvnw`)
* Docker & Docker Compose (for Postgres)

### 2. Start Supporting Services (Postgres)
From the root project directory:
```bash
docker-compose up db -d
```

### 3. Run Application Locally
```bash
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`.

