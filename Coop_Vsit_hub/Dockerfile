# =============================================================================
# Multi-Stage Dockerfile for CoopBank Visit Hub Backend (Spring Boot 3.3 / Java 21)
# Cooperative Bank of Oromia (CoopBank DxValley)
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Build Stage
# -----------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy Maven POM and wrapper
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production JAR
COPY src src
RUN ./mvnw clean package -DskipTests

# -----------------------------------------------------------------------------
# STAGE 2: Runtime Stage
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root system group and user for security compliance
RUN addgroup -S coopgroup && adduser -S coopuser -G coopgroup

# Copy built artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Set ownership
RUN chown -R coopuser:coopgroup /app

# Switch to non-root user
USER coopuser

# Expose Spring Boot application port
EXPOSE 8080

# Configure JVM memory options for containerized bank environment
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
