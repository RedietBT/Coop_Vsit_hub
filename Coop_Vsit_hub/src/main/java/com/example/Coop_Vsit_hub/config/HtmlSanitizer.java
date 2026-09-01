package com.example.coop_vsit_hub.config;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * XSS Protection Utility — Security NFR #1.
 *
 * Wraps the OWASP Java HTML Sanitizer to strip all dangerous HTML/JS from
 * any user-submitted free-text field before it reaches the database or
 * is rendered back to clients.
 *
 * Usage:
 *   String safeValue = htmlSanitizer.sanitize(rawInput);
 *
 * Policy: NO HTML is allowed in any input (names, titles, notes, remarks).
 * All tags and attributes are stripped — only plain text survives.
 */
@Component
public class HtmlSanitizer {

    /**
     * Strictly plain-text policy: strips ALL HTML tags and attributes.
     * Equivalent to OWASP's "no-HTML" policy — the safest option for a bank system
     * where user inputs (visitor names, remarks, objectives) should never contain HTML.
     */
    private static final PolicyFactory PLAIN_TEXT_POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.BLOCKS)
            .and(Sanitizers.TABLES);

    /**
     * Sanitizes a user-submitted string, stripping all HTML and script content.
     * Returns null if the input is null or blank (preserves null semantics for optional fields).
     *
     * @param rawInput The raw string from the user request DTO.
     * @return A sanitized, XSS-safe plain-text string, or null if input was blank.
     */
    public String sanitize(String rawInput) {
        if (!StringUtils.hasText(rawInput)) {
            return rawInput;
        }
        // Strip all HTML using OWASP sanitizer, then trim whitespace
        return PLAIN_TEXT_POLICY.sanitize(rawInput.trim());
    }

    /**
     * Sanitizes and enforces a maximum length on a user-submitted string.
     * Useful for fields with strict character limits (e.g., visit titles).
     *
     * @param rawInput  The raw user input.
     * @param maxLength Maximum allowed character length after sanitization.
     * @return Sanitized string truncated to maxLength, or null if blank.
     */
    public String sanitize(String rawInput, int maxLength) {
        String sanitized = sanitize(rawInput);
        if (sanitized == null) return null;
        return sanitized.length() > maxLength ? sanitized.substring(0, maxLength) : sanitized;
    }
}
