# =============================================================================
# Dockerfile for CoopBank Visit Hub Backend (Spring Boot 3.3 / Java 21)
# Cooperative Bank of Oromia (CoopBank DxValley)
# Fast, lightweight production container image
# =============================================================================

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root system group and user for security compliance
RUN addgroup -S coopgroup && adduser -S coopuser -G coopgroup

# Copy built artifact directly from target directory
COPY target/*.jar app.jar

# Set ownership
RUN chown -R coopuser:coopgroup /app

# Switch to non-root user
USER coopuser

# Expose Spring Boot application port
EXPOSE 8080

# Configure JVM memory options for containerized bank environment
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
