# =============================================================================
# Multi-Stage Dockerfile for CoopBank Visit Hub Backend (Spring Boot 3.3 / Java 21)
# Cooperative Bank of Oromia (CoopBank DxValley)
# =============================================================================

# --- Stage 1: Build JAR from source ---
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and ensure application.properties exists
COPY src ./src
RUN if [ ! -f src/main/resources/application.properties ]; then cp src/main/resources/application.properties.example src/main/resources/application.properties; fi
RUN mvn clean package -DskipTests

# --- Stage 2: Fast, lightweight production container image ---
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root system group and user for security compliance
RUN addgroup -S coopgroup && adduser -S coopuser -G coopgroup

# Install MailHog standalone binary for in-container email testing
ADD https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64 /usr/local/bin/mailhog
RUN chmod +x /usr/local/bin/mailhog

# Copy built artifact from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown -R coopuser:coopgroup /app

# Switch to non-root user
USER coopuser

# Expose Spring Boot application port
EXPOSE 8080

# Configure JVM memory options for containerized bank environment
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Launch MailHog with -ui-web-path=mailhog in background, then start Spring Boot
ENTRYPOINT ["sh", "-c", "mailhog -ui-web-path=mailhog > /dev/null 2>&1 & java $JAVA_OPTS -jar app.jar"]

