package com.example.coop_vsit_hub.user_and_auth.security;

import java.security.SecureRandom;

/**
 * Utility to generate secure temporary passwords compliant with CoopBank @StrongPassword policy.
 */
public class TemporaryPasswordGenerator {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;

    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder("Coop#");
        
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        sb.append(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        for (int i = 0; i < 6; i++) {
            sb.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }

        return sb.toString();
    }
}
