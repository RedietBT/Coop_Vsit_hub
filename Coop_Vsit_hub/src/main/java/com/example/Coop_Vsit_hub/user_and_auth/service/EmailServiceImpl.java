package com.example.coop_vsit_hub.user_and_auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@coopbank.com.et}")
    private String fromEmail;

    @Value("${coopbank.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("🔒 CoopBank Visit Hub - Password Reset Request");

            String resetLink = baseUrl + "/api/v1/auth/reset-password?token=" + resetToken;

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>"
                    + "<div style='background-color: #0088cc; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;'>"
                    + "<h2 style='color: #ffffff; margin: 0;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe; margin: 5px 0 0 0;'>Executive Visit Hub (DxValley)</p>"
                    + "</div>"
                    + "<div style='padding: 20px; color: #333333;'>"
                    + "<h3>Dear " + recipientName + ",</h3>"
                    + "<p>A password reset request was initiated for your CoopBank DxValley account.</p>"
                    + "<p>Please click the button below to set a new password. This link is valid for <strong>15 minutes</strong>:</p>"
                    + "<div style='text-align: center; margin: 30px 0;'>"
                    + "<a href='" + resetLink + "' style='background-color: #0088cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Reset My Password</a>"
                    + "</div>"
                    + "<p style='font-size: 12px; color: #666666;'>Or copy and paste this link into your browser:<br/><a href='" + resetLink + "'>" + resetLink + "</a></p>"
                    + "<p style='margin-top: 30px; font-size: 12px; color: #888888;'>If you did not request a password reset, please ignore this message or alert CoopBank IT Security immediately.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Password reset email sent via MailHog to: {}", recipientEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }
}
