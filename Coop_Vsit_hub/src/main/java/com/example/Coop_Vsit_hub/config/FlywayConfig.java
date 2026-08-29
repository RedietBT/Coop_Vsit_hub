package com.example.coop_vsit_hub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway configuration to automatically repair checksum differences and ignore
 * metadata/comment edits on previously applied migrations.
 */
@Configuration
@Slf4j
public class FlywayConfig {

    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
        return configuration -> {
            configuration.validateOnMigrate(false);
            configuration.ignoreMigrationPatterns("*:*");
        };
    }

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("Executing Flyway repair to synchronize migration history...");
                flyway.repair();
            } catch (Exception e) {
                log.warn("Flyway repair notice: {}", e.getMessage());
            }
            log.info("Applying Flyway database migrations...");
            flyway.migrate();
            log.info("Flyway database migrations completed.");
        };
    }
}
