# =============================================================================
# Multi-Stage Dockerfile for CoopBank Visit Hub Backend (Spring Boot 3.3 / Java 21)
# Cooperative Bank of Oromia
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build the JAR artifact
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Copy Maven wrapper, POM and source code
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src ./src

# Build JAR skipping unit tests
RUN chmod +x mvnw && ./mvnw clean package -DskipTests -B

# -----------------------------------------------------------------------------
# Stage 2: Minimal Production JRE Runtime
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root system group and user for security compliance
RUN addgroup -S coopgroup && adduser -S coopuser -G coopgroup

# Copy compiled JAR artifact from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown -R coopuser:coopgroup /app

# Switch to non-root user
USER coopuser

# Expose Spring Boot application port
EXPOSE 8080

# Configure JVM memory options for containerized bank environment
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

