package com.example.coop_vsit_hub.user_and_auth.service;

public interface EmailService {

    void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken);

    void sendStaffOnboardingEmail(String recipientEmail, String recipientName, String username, String tempPassword, String verificationToken);
}
