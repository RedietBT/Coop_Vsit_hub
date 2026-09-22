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

    @Value("${coopbank.app.frontend-url:https://coop-vsit-hub.vercel.app}")
    private String frontendUrl;

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("🔒 CoopBank Visit Hub - Password Reset Request");

            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>"
                    + "<div style='background-color: #0088cc; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;'>"
                    + "<h2 style='color: #ffffff; margin: 0;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe; margin: 5px 0 0 0;'>Executive Visit Hub</p>"
                    + "</div>"
                    + "<div style='padding: 20px; color: #333333;'>"
                    + "<h3>Dear " + recipientName + ",</h3>"
                    + "<p>A password reset request was initiated for your CoopBank account.</p>"
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

            log.info("Password reset email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendStaffOnboardingEmail(String recipientEmail, String recipientName, String username, String password, String roleSummary, String roleDetails) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(recipientEmail);
            helper.setSubject("🏦 Welcome to CoopBank Visit Hub - Account Credentials & Access Information");

            String loginUrl = frontendUrl + "/login";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>"
                    + "<div style='background: linear-gradient(135deg, #00adef, #0072bc); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>"
                    + "<h2 style='color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe; margin: 6px 0 0 0; font-size: 14px;'>Executive Visit Hub — Staff Onboarding</p>"
                    + "</div>"
                    + "<div style='padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;'>"
                    + "<h3 style='color: #0f172a; margin-top: 0;'>Dear " + (recipientName != null ? recipientName : "Staff Member") + ",</h3>"
                    + "<p>Welcome to <strong>Cooperative Bank of Oromia - Visit Hub</strong>. Your user account has been successfully created and configured by the System Administrator.</p>"
                    + "<div style='background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #00adef; border-radius: 6px; padding: 16px; margin: 20px 0;'>"
                    + "<p style='margin: 4px 0;'><strong>Username:</strong> <span style='color: #0369a1; font-weight: bold;'>" + username + "</span></p>"
                    + "<p style='margin: 4px 0;'><strong>Registered Email:</strong> " + recipientEmail + "</p>"
                    + "<p style='margin: 4px 0;'><strong>Password:</strong> <span style='font-family: monospace; font-size: 15px; color: #0369a1; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; font-weight: bold;'>" + password + "</span></p>"
                    + "<p style='margin: 4px 0;'><strong>Assigned Role:</strong> <span style='color: #0f172a; font-weight: 600;'>" + (roleSummary != null ? roleSummary : "Authorized Staff") + "</span></p>"
                    + "</div>"
                    + (roleDetails != null && !roleDetails.isBlank()
                        ? "<div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px; margin: 16px 0;'>"
                          + "<strong style='color: #166534;'>Your Role & System Responsibilities:</strong>"
                          + "<p style='margin: 6px 0 0 0; color: #15803d; font-size: 13px;'>" + roleDetails + "</p>"
                          + "</div>"
                        : "")
                    + "<div style='text-align: center; margin: 28px 0;'>"
                    + "<a href='" + loginUrl + "' style='background: linear-gradient(135deg, #00adef, #0072bc); color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;'>Sign In to Visit Hub</a>"
                    + "</div>"
                    + "<div style='background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 12px; margin: 18px 0;'>"
                    + "<p style='margin: 0; color: #92400e; font-size: 13px;'>🔒 <strong>Security Recommendation:</strong> For your security, we encourage you to update your password after signing in by navigating to your profile settings.</p>"
                    + "</div>"
                    + "<p style='font-size: 12px; color: #64748b; margin-top: 24px;'>Direct Login Link: <a href='" + loginUrl + "' style='color: #00adef;'>" + loginUrl + "</a></p>"
                    + "<p style='margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;'>This is an official automated notification from Cooperative Bank of Oromia Visit Hub Security & Governance.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Onboarding credentials email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send onboarding email to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingAdminNotification(
            String adminEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String visitCode,
            String visitTitle,
            String guestName,
            String organizationName,
            java.time.Instant startTime,
            java.time.Instant endTime,
            String purpose,
            int visitorCount
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("🏢 [Room Booking Alert] " + (roomName != null ? roomName : "Meeting Facility") + " Reserved (" + (visitCode != null ? visitCode : "Direct") + ")");

            String formattedStart = startTime != null ? startTime.toString() : "Scheduled Time";
            String formattedEnd = endTime != null ? endTime.toString() : "Scheduled Time";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>"
                    + "<div style='background: linear-gradient(135deg, #00adef, #0072bc); padding: 18px; text-align: center; border-radius: 8px 8px 0 0;'>"
                    + "<h2 style='color: #ffffff; margin: 0; font-size: 20px;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe; margin: 4px 0 0 0; font-size: 13px;'>Facility Management & Room Reservation Alert</p>"
                    + "</div>"
                    + "<div style='padding: 20px; color: #1e293b; font-size: 13px; line-height: 1.6;'>"
                    + "<p style='margin-top: 0;'>Hello <strong>System Administrator</strong>,</p>"
                    + "<p>A new meeting room booking has been registered in the Visit Hub system. Here are the reservation details:</p>"
                    + "<div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #00adef; border-radius: 6px; padding: 14px; margin: 18px 0;'>"
                    + "<p style='margin: 4px 0;'><strong>📍 Meeting Room:</strong> <span style='color: #0284c7; font-weight: bold;'>" + (roomName != null ? roomName : "Executive Boardroom") + "</span></p>"
                    + "<p style='margin: 4px 0;'><strong>👤 Booked By:</strong> " + (bookedByName != null ? bookedByName : "Staff Member") + " (" + (bookedByDept != null ? bookedByDept : "General Division") + ")</p>"
                    + "<p style='margin: 4px 0;'><strong>🔖 Visit / Reference:</strong> " + (visitCode != null ? visitCode : "Direct Reservation") + " — " + (visitTitle != null ? visitTitle : "Executive Briefing") + "</p>"
                    + "<p style='margin: 4px 0;'><strong>👥 Guest / Delegation:</strong> " + (guestName != null ? guestName : "Visitor") + (organizationName != null ? " (" + organizationName + ")" : "") + " — " + visitorCount + " Guest(s)</p>"
                    + "<p style='margin: 4px 0;'><strong>⏰ Start Time:</strong> " + formattedStart + "</p>"
                    + "<p style='margin: 4px 0;'><strong>⌛ End Time:</strong> " + formattedEnd + "</p>"
                    + "<p style='margin: 4px 0;'><strong>📝 Purpose:</strong> " + (purpose != null ? purpose : "Meeting") + "</p>"
                    + "</div>"
                    + "<p style='font-size: 12px; color: #64748b;'>You can review or manage active room allocations in the <a href='" + frontendUrl + "/bookings' style='color: #00adef; text-decoration: none; font-weight: bold;'>Booking Management Portal</a>.</p>"
                    + "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'/>"
                    + "<p style='font-size: 11px; color: #94a3b8; text-align: center; margin: 0;'>Cooperative Bank of Oromia | Automated System Notification</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking notification email dispatched to admin '{}' for room '{}'", adminEmail, roomName);
        } catch (Exception e) {
            log.error("Failed to dispatch room booking notification email to {}: {}", adminEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingSecretaryNotification(
            String secretaryEmail,
            String secretaryName,
            String departmentName,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String visitCode,
            String visitTitle,
            String guestName,
            String organizationName,
            java.time.Instant startTime,
            java.time.Instant endTime,
            String purpose,
            int visitorCount
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(secretaryEmail);
            helper.setSubject("📋 [Department Room Alert] " + (roomName != null ? roomName : "Meeting Room") + " Reserved — " + (departmentName != null ? departmentName : "Department"));

            String formattedStart = startTime != null ? startTime.toString() : "Scheduled Time";
            String formattedEnd = endTime != null ? endTime.toString() : "Scheduled Time";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>"
                    + "<div style='background: linear-gradient(135deg, #0284c7, #0369a1); padding: 18px; text-align: center; border-radius: 8px 8px 0 0;'>"
                    + "<h2 style='color: #ffffff; margin: 0; font-size: 20px;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe; margin: 4px 0 0 0; font-size: 13px;'>Department Meeting Facility Reservation Notice</p>"
                    + "</div>"
                    + "<div style='padding: 20px; color: #1e293b; font-size: 13px; line-height: 1.6;'>"
                    + "<p style='margin-top: 0;'>Dear <strong>" + (secretaryName != null ? secretaryName : "Secretary") + "</strong> (" + (departmentName != null ? departmentName : "Department") + "),</p>"
                    + "<p>This is to inform you that a meeting room belonging to your department has just been reserved in the Visit Hub system. Here are the booking details:</p>"
                    + "<div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 6px; padding: 14px; margin: 18px 0;'>"
                    + "<p style='margin: 4px 0;'><strong>📍 Meeting Room:</strong> <span style='color: #047857; font-weight: bold;'>" + (roomName != null ? roomName : "Department Room") + "</span></p>"
                    + "<p style='margin: 4px 0;'><strong>🏛️ Department:</strong> " + (departmentName != null ? departmentName : "Department") + "</p>"
                    + "<p style='margin: 4px 0;'><strong>👤 Booked By / Host:</strong> " + (bookedByName != null ? bookedByName : "Staff Member") + " (" + (bookedByDept != null ? bookedByDept : "Division") + ")</p>"
                    + "<p style='margin: 4px 0;'><strong>🔖 Visit / Reference:</strong> " + (visitCode != null ? visitCode : "Direct Reservation") + " — " + (visitTitle != null ? visitTitle : "Executive Briefing") + "</p>"
                    + "<p style='margin: 4px 0;'><strong>👥 Guest / Delegation:</strong> " + (guestName != null ? guestName : "Visitor") + (organizationName != null ? " (" + organizationName + ")" : "") + " — " + visitorCount + " Guest(s)</p>"
                    + "<p style='margin: 4px 0;'><strong>⏰ Start Time:</strong> " + formattedStart + "</p>"
                    + "<p style='margin: 4px 0;'><strong>⌛ End Time:</strong> " + formattedEnd + "</p>"
                    + "<p style='margin: 4px 0;'><strong>📝 Purpose:</strong> " + (purpose != null ? purpose : "Meeting") + "</p>"
                    + "</div>"
                    + "<p style='font-size: 12px; color: #64748b;'>You can oversee and prepare departmental room facilities in the <a href='" + frontendUrl + "/bookings' style='color: #0284c7; text-decoration: none; font-weight: bold;'>Visit Hub Portal</a>.</p>"
                    + "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'/>"
                    + "<p style='font-size: 11px; color: #94a3b8; text-align: center; margin: 0;'>Cooperative Bank of Oromia | Automated Secretary Notification</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking notification email dispatched to department secretary '{}' ({}) for room '{}'", secretaryEmail, departmentName, roomName);
        } catch (Exception e) {
            log.error("Failed to dispatch room booking notification email to secretary {}: {}", secretaryEmail, e.getMessage(), e);
        }
    }
}

