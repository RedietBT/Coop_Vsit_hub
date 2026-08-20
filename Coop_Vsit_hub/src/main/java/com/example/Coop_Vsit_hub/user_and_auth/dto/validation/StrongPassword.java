package com.example.coop_vsit_hub.user_and_auth.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Enforces CoopBank Strong Password Policy (Security NFR #5):
 * - Minimum 8 characters, maximum 64 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?)
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    String message() default "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
