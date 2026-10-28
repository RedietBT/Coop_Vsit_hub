package com.example.coop_vsit_hub.user_and_auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@coopbank.com.et}")
    private String fromEmail;

    @Value("${coopbank.app.frontend-url:https://coop-vsit-hub.vercel.app}")
    private String frontendUrl;

    private static final DateTimeFormatter EMAIL_DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMM dd, yyyy 'at' hh:mm a")
            .withZone(ZoneId.of("Africa/Addis_Ababa"));

    private String formatEmailDate(Instant instant) {
        if (instant == null) return "N/A";
        try {
            return EMAIL_DATE_FORMATTER.format(instant) + " (EAT)";
        } catch (Exception e) {
            return instant.toString();
        }
    }

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("🔒 CoopBank Visit Hub - Password Reset Request");

            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; overflow: hidden;'>"
                    + "<div style='background-color: #0088cc; padding: 22px 18px; text-align: center; color: #ffffff;'>"
                    + "<h2 style='color: #ffffff !important; margin: 0; font-size: 21px; font-weight: bold;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe !important; margin: 6px 0 0 0; font-size: 13px;'>Executive Visit Hub</p>"
                    + "</div>"
                    + "<div style='padding: 24px; color: #333333; line-height: 1.6;'>"
                    + "<h3 style='margin-top: 0;'>Dear " + recipientName + ",</h3>"
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

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden;'>"
                    + "<div style='background-color: #00adef; background: linear-gradient(135deg, #00adef, #0072bc); padding: 22px 18px; text-align: center; color: #ffffff;'>"
                    + "<h2 style='color: #ffffff !important; margin: 0; font-size: 21px; font-weight: bold;'>Cooperative Bank of Oromia</h2>"
                    + "<p style='color: #e0f2fe !important; margin: 6px 0 0 0; font-size: 13px;'>Executive Visit Hub — Staff Onboarding</p>"
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
                    + "<a href='" + loginUrl + "' style='background-color: #00adef; background: linear-gradient(135deg, #00adef, #0072bc); color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;'>Sign In to Visit Hub</a>"
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

        private static class EmailField {
        final String label;
        final String value;
        EmailField(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    private String buildRoomBookingTableEmailHtml(
            String bannerIcon,
            String bannerTitle,
            boolean isCancellation,
            String introText,
            java.util.List<EmailField> fields,
            String calloutText,
            String ctaUrl,
            String ctaText
    ) {
        String bannerBg = isCancellation ? "#dc2626" : "#00adef";
        String calloutBg = isCancellation ? "#fff1f2" : "#fffbeb";
        String calloutBorder = isCancellation ? "#fecdd3" : "#fef3c7";
        String calloutLeftBorder = isCancellation ? "#ef4444" : "#f59e0b";
        String calloutTextColor = isCancellation ? "#991b1b" : "#b45309";

        StringBuilder sb = new StringBuilder();
        sb.append("<div style='background-color: #f3f4f6; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>");
        sb.append("<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>");

        // Header Banner
        sb.append("<div style='background-color: ").append(bannerBg).append("; padding: 14px 20px;'>");
        sb.append("<table cellpadding='0' cellspacing='0' border='0' width='100%'><tr>");
        sb.append("<td style='width: 28px; vertical-align: middle;'><span style='font-size: 20px; line-height: 1;'>").append(bannerIcon).append("</span></td>");
        sb.append("<td style='vertical-align: middle; padding-left: 10px;'><span style='color: #ffffff; font-size: 16px; font-weight: 700; line-height: 1.2;'>").append(bannerTitle).append("</span></td>");
        sb.append("</tr></table>");
        sb.append("</div>");

        // Body Content
        sb.append("<div style='padding: 24px 22px; color: #374151; font-size: 14px; line-height: 1.5;'>");
        if (introText != null && !introText.isBlank()) {
            sb.append("<p style='margin: 0 0 16px 0; font-size: 14px; color: #374151;'>").append(introText).append("</p>");
        }

        // 2-Column Table
        sb.append("<table cellpadding='0' cellspacing='0' border='0' style='width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 13.5px; margin-bottom: 20px;'><tbody>");
        for (EmailField field : fields) {
            if (field != null && field.value != null && !field.value.isBlank()) {
                sb.append("<tr>");
                sb.append("<td style='width: 32%; padding: 10px 14px; font-weight: 700; color: #1f2937; background-color: #f9fafb; border: 1px solid #e5e7eb; vertical-align: top;'>")
                  .append(field.label).append(":</td>");
                sb.append("<td style='padding: 10px 14px; color: #374151; background-color: #ffffff; border: 1px solid #e5e7eb; vertical-align: top;'>")
                  .append(field.value).append("</td>");
                sb.append("</tr>");
            }
        }
        sb.append("</tbody></table>");

        // Callout box
        if (calloutText != null && !calloutText.isBlank()) {
            sb.append("<div style='background-color: ").append(calloutBg)
              .append("; border: 1px solid ").append(calloutBorder)
              .append("; border-left: 4px solid ").append(calloutLeftBorder)
              .append("; border-radius: 4px; padding: 12px 16px; margin-top: 18px; color: ")
              .append(calloutTextColor).append("; font-size: 13px; line-height: 1.5;'>")
              .append(calloutText)
              .append("</div>");
        }

        sb.append("</div>"); // end body content
        sb.append("</div>"); // end white card

        // Sub-footer & CTA Button
        sb.append("<div style='max-width: 600px; margin: 0 auto; text-align: center; margin-top: 24px; font-size: 12px; color: #6b7280; line-height: 1.6;'>");
        sb.append("<p style='margin: 0 0 4px 0;'>Please do not reply to this email as it is system generated.</p>");
        sb.append("<p style='margin: 0 0 16px 0;'>For more information, please visit Visit Hub</p>");
        sb.append("<div style='margin-bottom: 24px;'>");
        sb.append("<a href='").append(ctaUrl != null ? ctaUrl : frontendUrl).append("' style='background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'>")
          .append(ctaText != null ? ctaText : "Go to Visit Hub").append("</a>");
        sb.append("</div>");
        sb.append("</div>"); // end sub-footer

        sb.append("</div>"); // end wrapper
        return sb.toString();
    }

    @Override
    public void sendRoomBookingAdminNotification(
            String adminEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String bookedByPhone,
            String visitCode,
            String visitTitle,
            String guestName,
            String organizationName,
            Instant startTime,
            Instant endTime,
            String purpose,
            int visitorCount,
            String requestedItems
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(adminEmail);
            helper.setSubject("🏢 [Room Booking Alert] " + (roomName != null ? roomName : "Meeting Facility") + " Reserved (" + (visitCode != null ? visitCode : "Direct") + ")");

            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", visitCode != null ? visitCode : "Direct Reservation"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Facility Room"));
            fields.add(new EmailField("Title / Subject", visitTitle != null ? visitTitle : "Room Reservation"));
            fields.add(new EmailField("Booked By / Host", (bookedByName != null ? bookedByName : "Staff Member") + (bookedByDept != null && !bookedByDept.isBlank() ? " (" + bookedByDept + ")" : "")));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Reserver Phone", "<a href='tel:" + bookedByPhone + "' style='color: #00adef; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }
            String guestInfo = (guestName != null && !guestName.isBlank() ? guestName + (organizationName != null && !organizationName.isBlank() ? " (" + organizationName + ")" : "") + " — " : "") + visitorCount + " Attendee(s)";
            fields.add(new EmailField("Attendees", guestInfo));
            fields.add(new EmailField("Start Time", formattedStart));
            fields.add(new EmailField("End Time", formattedEnd));
            if (requestedItems != null && !requestedItems.isBlank()) {
                fields.add(new EmailField("Requested Items", requestedItems));
            }
            if (purpose != null && !purpose.isBlank()) {
                fields.add(new EmailField("Purpose / Agenda", purpose));
            }

            String htmlContent = buildRoomBookingTableEmailHtml(
                    "🏢",
                    "New Room Reservation Alert",
                    false,
                    "A room reservation has been registered in the Visit Hub system for your facility:",
                    fields,
                    "This room reservation has been registered. Please ensure the facility is prepared and any requested refreshments or equipment are arranged before the session starts.",
                    frontendUrl + "/bookings",
                    "Go to Visit Hub"
            );

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
            String bookedByPhone,
            String visitCode,
            String visitTitle,
            String guestName,
            String organizationName,
            Instant startTime,
            Instant endTime,
            String purpose,
            int visitorCount,
            String requestedItems
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(secretaryEmail);
            helper.setSubject("📋 [Department Room Alert] " + (roomName != null ? roomName : "Meeting Room") + " Reserved — " + (departmentName != null ? departmentName : "Department"));

            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", visitCode != null ? visitCode : "Direct Reservation"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Department Room"));
            fields.add(new EmailField("Department", departmentName != null ? departmentName : "Department"));
            fields.add(new EmailField("Title / Subject", visitTitle != null ? visitTitle : "Room Reservation"));
            fields.add(new EmailField("Booked By / Host", (bookedByName != null ? bookedByName : "Staff Member") + (bookedByDept != null && !bookedByDept.isBlank() ? " (" + bookedByDept + ")" : "")));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Reserver Phone", "<a href='tel:" + bookedByPhone + "' style='color: #00adef; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }
            String guestInfo = (guestName != null && !guestName.isBlank() ? guestName + (organizationName != null && !organizationName.isBlank() ? " (" + organizationName + ")" : "") + " — " : "") + visitorCount + " Attendee(s)";
            fields.add(new EmailField("Attendees", guestInfo));
            fields.add(new EmailField("Start Time", formattedStart));
            fields.add(new EmailField("End Time", formattedEnd));
            if (requestedItems != null && !requestedItems.isBlank()) {
                fields.add(new EmailField("Requested Items", requestedItems));
            }
            if (purpose != null && !purpose.isBlank()) {
                fields.add(new EmailField("Purpose / Agenda", purpose));
            }

            String htmlContent = buildRoomBookingTableEmailHtml(
                    "🏢",
                    "Department Room Reservation Notice",
                    false,
                    "A room reservation belonging to your department has been scheduled:",
                    fields,
                    "This department room reservation has been registered. Please ensure necessary preparations and requested items are arranged.",
                    frontendUrl + "/bookings",
                    "Go to Visit Hub"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking notification email dispatched to department secretary '{}' ({}) for room '{}'", secretaryEmail, departmentName, roomName);
        } catch (Exception e) {
            log.error("Failed to dispatch room booking notification email to secretary {}: {}", secretaryEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingCancellationNotification(
            String recipientEmail,
            String recipientName,
            String roomName,
            String bookedByName,
            String bookedByPhone,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String cancelledBy,
            String cancellationReason,
            String requestedItems
    ) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(recipientEmail);
            helper.setSubject("❌ [Booking Cancelled] " + (roomName != null ? roomName : "Meeting Room") + " - " + (bookingCode != null ? bookingCode : "Reservation"));

            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", bookingCode != null ? bookingCode : "N/A"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Meeting Room"));
            fields.add(new EmailField("Title / Subject", meetingTitle != null ? meetingTitle : "Room Reservation"));
            fields.add(new EmailField("Originally Booked By", bookedByName != null ? bookedByName : "Staff Member"));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Reserver Phone", "<a href='tel:" + bookedByPhone + "' style='color: #dc2626; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }
            fields.add(new EmailField("Scheduled Start", formattedStart));
            fields.add(new EmailField("Scheduled End", formattedEnd));
            if (requestedItems != null && !requestedItems.isBlank()) {
                fields.add(new EmailField("Requested Items", requestedItems));
            }
            fields.add(new EmailField("Cancelled By", cancelledBy != null ? cancelledBy : "Administrator"));
            fields.add(new EmailField("Reason / Comment", cancellationReason != null && !cancellationReason.isBlank() ? cancellationReason : "No reason provided."));

            String htmlContent = buildRoomBookingTableEmailHtml(
                    "❌",
                    "Room Reservation Cancelled",
                    true,
                    "The following room reservation has been cancelled in the Visit Hub system:",
                    fields,
                    "This room reservation has been cancelled. The time slot has been released and is now available for other staff.",
                    frontendUrl + "/bookings",
                    "Go to Visit Hub"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking cancellation email sent to '{}' for room '{}', booking '{}'", recipientEmail, roomName, bookingCode);
        } catch (Exception e) {
            log.error("Failed to send booking cancellation email to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingContactNotification(
            String contactEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String bookedByPhone,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String purpose,
            int attendees,
            boolean isCancellation,
            String cancelledBy,
            String cancellationReason,
            String requestedItems
    ) {
        if (contactEmail == null || contactEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(contactEmail);

            String statusPrefix = isCancellation ? "❌ [Room Notice - Cancelled] " : "🏢 [Room Notice - New Booking] ";
            helper.setSubject(statusPrefix + (roomName != null ? roomName : "Meeting Room") + " - " + (bookingCode != null ? bookingCode : "Reservation"));

            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", bookingCode != null ? bookingCode : "N/A"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Meeting Room"));
            fields.add(new EmailField("Title / Subject", meetingTitle != null ? meetingTitle : "Executive Meeting"));
            fields.add(new EmailField("Booked By / Host", (bookedByName != null ? bookedByName : "Staff Member") + (bookedByDept != null && !bookedByDept.isBlank() ? " (" + bookedByDept + ")" : "")));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Reserver Phone", "<a href='tel:" + bookedByPhone + "' style='color: #00adef; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }

            if (isCancellation) {
                fields.add(new EmailField("Scheduled Start", formattedStart));
                fields.add(new EmailField("Scheduled End", formattedEnd));
                if (requestedItems != null && !requestedItems.isBlank()) {
                    fields.add(new EmailField("Requested Items", requestedItems));
                }
                fields.add(new EmailField("Cancelled By", cancelledBy != null ? cancelledBy : "System User"));
                fields.add(new EmailField("Reason / Comment", cancellationReason != null && !cancellationReason.isBlank() ? cancellationReason : "No reason provided."));
            } else {
                fields.add(new EmailField("Attendees", attendees + " person(s)"));
                fields.add(new EmailField("Start Time", formattedStart));
                fields.add(new EmailField("End Time", formattedEnd));
                if (requestedItems != null && !requestedItems.isBlank()) {
                    fields.add(new EmailField("Requested Items", requestedItems));
                }
                if (purpose != null && !purpose.isBlank()) {
                    fields.add(new EmailField("Purpose / Agenda", purpose));
                }
            }

            String bannerIcon = isCancellation ? "❌" : "👤";
            String bannerTitle = isCancellation ? "Room Reservation Cancelled" : "New Room Reservation Assignment";
            String introText = isCancellation
                    ? "A reservation for your room <strong>" + roomName + "</strong> has been cancelled:"
                    : "A room reservation has been assigned to you or updated in your department:";
            String calloutText = isCancellation
                    ? "This room reservation has been cancelled. The time slot has been released and is now available for other staff."
                    : "This case has been assigned. The room representative should review the reservation details and ensure appropriate preparations are completed before the session.";

            String htmlContent = buildRoomBookingTableEmailHtml(
                    bannerIcon,
                    bannerTitle,
                    isCancellation,
                    introText,
                    fields,
                    calloutText,
                    frontendUrl + "/bookings",
                    "Go to Visit Hub"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking designated contact notification email sent to '{}' for room '{}', booking '{}', isCancellation={}",
                    contactEmail, roomName, bookingCode, isCancellation);
        } catch (Exception e) {
            log.error("Failed to send room contact notification email to {}: {}", contactEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingBookerConfirmation(
            String recipientEmail,
            String recipientName,
            String roomName,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String purpose,
            int attendees,
            String hostDept,
            String bookedByPhone,
            String requestedItems
    ) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(recipientEmail);
            helper.setSubject("🎉 [Reservation Confirmed] " + (roomName != null ? roomName : "Meeting Space") + " (Ref: " + (bookingCode != null ? bookingCode : "Booking") + ")");

            String formattedStart = formatEmailDate(startTime);
            String formattedEnd = formatEmailDate(endTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", bookingCode != null ? bookingCode : "N/A"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Meeting Room"));
            fields.add(new EmailField("Title / Subject", meetingTitle != null ? meetingTitle : "Meeting"));
            fields.add(new EmailField("Department", hostDept != null ? hostDept : "Staff Hub"));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Contact Phone", "<a href='tel:" + bookedByPhone + "' style='color: #00adef; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }
            fields.add(new EmailField("Attendees", attendees + " person(s)"));
            fields.add(new EmailField("Start Time", formattedStart));
            fields.add(new EmailField("End Time", formattedEnd));
            if (requestedItems != null && !requestedItems.isBlank()) {
                fields.add(new EmailField("Requested Items", requestedItems));
            }
            if (purpose != null && !purpose.isBlank()) {
                fields.add(new EmailField("Purpose / Agenda", purpose));
            }

            String htmlContent = buildRoomBookingTableEmailHtml(
                    "🎉",
                    "Room Reservation Confirmed",
                    false,
                    "Your room reservation has been successfully confirmed. The meeting room has been locked for your scheduled session:",
                    fields,
                    "Your reservation has been confirmed. If you need to make changes or cancel, please do so via the Visit Hub portal as early as possible.",
                    frontendUrl + "/my-tracking",
                    "Go to Visit Hub"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking confirmation email sent to booker '{}' for room '{}', booking '{}'", recipientEmail, roomName, bookingCode);
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    @Override
    public void sendRoomBookingUpdatedContactNotification(
            String contactEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String bookedByPhone,
            String bookingCode,
            String meetingTitle,
            Instant oldStartTime,
            Instant oldEndTime,
            Instant newStartTime,
            Instant newEndTime,
            String purpose,
            int attendees,
            String updatedBy,
            String requestedItems
    ) {
        if (contactEmail == null || contactEmail.isBlank()) {
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromEmail, "Cooperative Bank of Oromia");
            } catch (Exception ignored) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(contactEmail.trim());

            String subject = "✏️ [Room Notice - Reservation Updated] " + (roomName != null ? roomName : "Meeting Room") + " - " + (bookingCode != null ? bookingCode : "Reservation");
            helper.setSubject(subject);

            String formattedOldStart = formatEmailDate(oldStartTime);
            String formattedOldEnd = formatEmailDate(oldEndTime);
            String formattedNewStart = formatEmailDate(newStartTime);
            String formattedNewEnd = formatEmailDate(newEndTime);

            java.util.List<EmailField> fields = new java.util.ArrayList<>();
            fields.add(new EmailField("Case / Booking ID", bookingCode != null ? bookingCode : "N/A"));
            fields.add(new EmailField("Meeting Room", roomName != null ? roomName : "Meeting Room"));
            fields.add(new EmailField("Title / Subject", meetingTitle != null ? meetingTitle : "Meeting"));
            fields.add(new EmailField("Booked By / Host", (bookedByName != null ? bookedByName : "Staff Member") + (bookedByDept != null && !bookedByDept.isBlank() ? " (" + bookedByDept + ")" : "")));
            if (bookedByPhone != null && !bookedByPhone.isBlank()) {
                fields.add(new EmailField("Reserver Phone", "<a href='tel:" + bookedByPhone + "' style='color: #00adef; text-decoration: none; font-weight: 600;'>" + bookedByPhone + "</a>"));
            }
            fields.add(new EmailField("Attendees", attendees + " person(s)"));
            fields.add(new EmailField("Previous Schedule", "<span style='text-decoration: line-through; color: #991b1b;'>" + formattedOldStart + " &nbsp;to&nbsp; " + formattedOldEnd + "</span>"));
            fields.add(new EmailField("New Schedule", "<strong style='color: #047857;'>" + formattedNewStart + " &nbsp;to&nbsp; " + formattedNewEnd + "</strong>"));
            if (requestedItems != null && !requestedItems.isBlank()) {
                fields.add(new EmailField("Requested Items", requestedItems));
            }
            fields.add(new EmailField("Rescheduled By", updatedBy != null ? updatedBy : "System User"));
            if (purpose != null && !purpose.isBlank()) {
                fields.add(new EmailField("Purpose / Agenda", purpose));
            }

            String htmlContent = buildRoomBookingTableEmailHtml(
                    "✏️",
                    "Room Reservation Rescheduled",
                    false,
                    "A reservation for your room <strong>" + (roomName != null ? roomName : "Meeting Room") + "</strong> has been rescheduled by <strong>" + (updatedBy != null ? updatedBy : "User") + "</strong>:",
                    fields,
                    "This room reservation schedule has been modified. Please review the updated start and end times above and adjust preparations accordingly.",
                    frontendUrl + "/bookings",
                    "Go to Visit Hub"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Room booking updated contact notification email sent to '{}' for room '{}', booking '{}'",
                    contactEmail, roomName, bookingCode);
        } catch (Exception e) {
            log.error("Failed to send room booking updated contact notification to {}: {}", contactEmail, e.getMessage(), e);
        }
    }
}
