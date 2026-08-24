package com.example.coop_vsit_hub.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 / Swagger UI Configuration with Global JWT Bearer Lock Icon & Grouping.
 * Cooperative Bank of Oromia (CoopBank DxValley)
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI coopBankOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("🏦 CoopBank Visit Hub API")
                        .description("Executive Visit Lifecycle Management, Guest Organization Intelligence, & Visitor Feedback Platform.\n" +
                                "Built for Cooperative Bank of Oromia (DxValley). Handles high-concurrency bank operations and strict security compliance.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("CoopBank DxValley Security Team")
                                .email("dxvalley@coopbank.com.et")
                                .url("https://coopbankoromia.com.et"))
                        .license(new License()
                                .name("Proprietary - Cooperative Bank of Oromia")
                                .url("https://coopbankoromia.com.et")))
                // Global Bearer Token Security Requirement (Lock Icon on Top)
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT Access Token obtained from `/api/v1/auth/login`")))
                // Structured Category Folder Tags
                .tags(List.of(
                        new Tag().name("1. Authentication & User Management").description("Bank staff authentication, registration, JWT refresh, and security profiles"),
                        new Tag().name("2. Visits Lifecycle Management").description("Executive visit requests, approvals, conflict checks, and state transitions"),
                        new Tag().name("3. Organizations Intelligence").description("Guest corporate partner profiling, relationship health scoring, and portfolio analytics"),
                        new Tag().name("4. Customer Feedback").description("Post-visit guest surveys, CSAT scores, and Net Promoter Score (NPS) reviews"),
                        new Tag().name("5. Executive Analytics").description("Pipeline financial valuation ($M), conversion ratios, and executive reporting")
                ));
    }
}
