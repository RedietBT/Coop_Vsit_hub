package com.example.coop_vsit_hub.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Jackson Configuration for CoopBank Visit Hub.
 * Provides lenient Instant deserialization for HTML datetime-local formats (e.g. 2026-08-29T11:25).
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            JavaTimeModule javaTimeModule = new JavaTimeModule();
            javaTimeModule.addDeserializer(Instant.class, new JsonDeserializer<Instant>() {
                @Override
                public Instant deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                    String text = p.getText();
                    if (text == null || text.isBlank()) {
                        return null;
                    }
                    text = text.trim();

                    // 1. Standard ISO Instant with Z or offset (e.g. 2026-08-29T11:25:00Z)
                    try {
                        return Instant.parse(text);
                    } catch (DateTimeParseException ignored) {}

                    // 2. HTML datetime-local format without timezone (e.g. 2026-08-29T11:25 or 2026-08-29T11:25:00)
                    try {
                        LocalDateTime ldt = LocalDateTime.parse(text);
                        return ldt.toInstant(ZoneOffset.UTC);
                    } catch (DateTimeParseException ignored) {}

                    // 3. Date only format (e.g. 2026-08-29)
                    try {
                        LocalDate ld = LocalDate.parse(text);
                        return ld.atStartOfDay().toInstant(ZoneOffset.UTC);
                    } catch (DateTimeParseException ignored) {}

                    // 4. ISO Date Time with lenient offset
                    try {
                        return DateTimeFormatter.ISO_DATE_TIME.parse(text, Instant::from);
                    } catch (Exception e) {
                        throw new IOException("Unable to parse Instant from value: " + text, e);
                    }
                }
            });
            builder.modules(javaTimeModule);
        };
    }
}
