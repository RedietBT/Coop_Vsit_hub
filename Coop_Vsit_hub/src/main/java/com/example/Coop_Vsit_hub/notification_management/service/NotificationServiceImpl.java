package com.example.coop_vsit_hub.notification_management.service;

import com.example.coop_vsit_hub.notification_management.dto.NotificationResponse;
import com.example.coop_vsit_hub.notification_management.dto.UnreadCountResponse;
import com.example.coop_vsit_hub.notification_management.enums.NotificationType;
import com.example.coop_vsit_hub.notification_management.model.Notification;
import com.example.coop_vsit_hub.notification_management.repository.NotificationRepository;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:notifications@coopbank.com.et}")
    private String senderEmail;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getUserNotifications(String username, Boolean unreadOnly, int page, int size) {
        log.info("Fetching notifications for user '{}' (unreadOnly: {})", username, unreadOnly);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Notification> notificationPage;
        if (Boolean.TRUE.equals(unreadOnly)) {
            notificationPage = notificationRepository.findByRecipientIdAndIsRead(user.getId(), false, pageable);
        } else {
            notificationPage = notificationRepository.findByRecipientId(user.getId(), pageable);
        }

        Page<NotificationResponse> dtoPage = notificationPage.map(NotificationResponse::from);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID id, String username) {
        log.info("Marking notification ID: {} as read by user '{}'", id, username);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        if (!notification.getRecipient().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("Access denied: You cannot modify notifications belonging to other staff.");
        }

        notification.setRead(true);
        notification.setReadAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.from(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(String username) {
        log.info("Marking all notifications as read for user '{}'", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        notificationRepository.markAllAsReadForUser(user.getId());
    }

    @Override
    @Transactional
    public void deleteNotification(UUID id, String username) {
        log.info("Deleting notification ID: {} by user '{}'", id, username);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + id));

        if (!notification.getRecipient().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("Access denied: You cannot delete notifications belonging to other staff.");
        }

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyUser(User recipient, String title, String message, NotificationType type, UUID refId, String refCode, boolean sendEmail) {
        if (recipient == null) return;
        try {
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .title(title)
                    .message(message)
                    .notificationType(type)
                    .referenceId(refId)
                    .referenceCode(refCode)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);

            if (sendEmail && StringUtils.hasText(recipient.getEmail())) {
                sendEmailNotification(recipient.getEmail(), title, message, refCode);
            }
        } catch (Exception e) {
            log.warn("Failed to notify user '{}': {}", recipient.getUsername(), e.getMessage());
        }
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notifyRoles(List<RoleName> roles, String title, String message, NotificationType type, UUID refId, String refCode, boolean sendEmail) {
        try {
            Set<User> recipients = new HashSet<>();
            for (RoleName roleName : roles) {
                recipients.addAll(userRepository.findByRoleName(roleName));
            }

            for (User user : recipients) {
                notifyUser(user, title, message, type, refId, refCode, sendEmail);
            }
        } catch (Exception e) {
            log.warn("Failed to dispatch role notifications for '{}': {}", refCode, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void notifyVisitRequested(Visit visit) {
        log.info("Dispatching visit booking notifications for '{}'", visit.getVisitCode());

        String title = "New Visit Booking Request: " + visit.getVisitCode();
        String message = String.format("A new visit request '%s' for '%s' (Department: %s, Guests: %d) has been submitted for executive review.",
                visit.getTitle(), visit.getGuestDisplayName(), visit.getRequestingDepartment(), visit.getVisitorCount());

        notifyRoles(
                List.of(RoleName.ROLE_APPROVER, RoleName.ROLE_ADMIN),
                title, message, NotificationType.VISIT_REQUESTED, visit.getId(), visit.getVisitCode(), true
        );
    }

    @Override
    @Transactional
    public void notifyVisitStatusTransition(Visit visit, VisitStatus oldStatus, VisitStatus newStatus, String notes) {
        log.info("Dispatching status transition notification for '{}' ({} -> {})", visit.getVisitCode(), oldStatus, newStatus);

        String title = String.format("Visit %s - Status Changed to %s", visit.getVisitCode(), newStatus);
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Visit '%s' (%s) status has been updated to '%s'.", visit.getVisitCode(), visit.getTitle(), newStatus));
        if (StringUtils.hasText(notes)) {
            sb.append(" Decision Notes: \"").append(notes).append("\"");
        }

        String msg = sb.toString();

        if (visit.getRequester() != null) {
            notifyUser(visit.getRequester(), title, msg,
                    newStatus == VisitStatus.APPROVED ? NotificationType.VISIT_APPROVED : NotificationType.VISIT_REJECTED,
                    visit.getId(), visit.getVisitCode(), true);
        }

        if (visit.getSponsor() != null && (visit.getRequester() == null || !visit.getSponsor().getId().equals(visit.getRequester().getId()))) {
            notifyUser(visit.getSponsor(), title, msg,
                    newStatus == VisitStatus.APPROVED ? NotificationType.VISIT_APPROVED : NotificationType.VISIT_REJECTED,
                    visit.getId(), visit.getVisitCode(), true);
        }
    }

    @Override
    @Transactional
    public void notifyVisitorCheckedIn(Visit visit) {
        log.info("Dispatching security desk arrival alert for '{}'", visit.getVisitCode());

        String title = "Visitor Arrived at Security Desk: " + visit.getVisitCode();
        String message = String.format("Visitor '%s' has arrived for '%s' and checked in at the Front Desk Security. Badge: %s, Room: %s.",
                visit.getGuestDisplayName(), visit.getTitle(),
                visit.getVisitorBadgeNumber() != null ? visit.getVisitorBadgeNumber() : "Assigned",
                visit.getLocationRoom() != null ? visit.getLocationRoom() : "Main Reception");

        if (visit.getRequester() != null) {
            notifyUser(visit.getRequester(), title, message, NotificationType.VISITOR_CHECKED_IN, visit.getId(), visit.getVisitCode(), true);
        }

        if (visit.getSponsor() != null && (visit.getRequester() == null || !visit.getSponsor().getId().equals(visit.getRequester().getId()))) {
            notifyUser(visit.getSponsor(), title, message, NotificationType.VISITOR_CHECKED_IN, visit.getId(), visit.getVisitCode(), true);
        }
    }

    @Override
    @Transactional
    public void notifyFeedbackSubmitted(Visit visit, int npsScore, double avgRating) {
        log.info("Dispatching feedback submission alert for '{}'", visit.getVisitCode());

        String title = "Guest Survey Submitted: " + visit.getVisitCode();
        String message = String.format("Guest '%s' has submitted satisfaction feedback for '%s'. NPS Score: %d/10, Overall CSAT: %.1f/5.0.",
                visit.getGuestDisplayName(), visit.getTitle(), npsScore, avgRating);

        if (visit.getRequester() != null) {
            notifyUser(visit.getRequester(), title, message, NotificationType.FEEDBACK_SUBMITTED, visit.getId(), visit.getVisitCode(), false);
        }

        notifyRoles(
                List.of(RoleName.ROLE_RELATIONSHIP_MANAGER, RoleName.ROLE_ADMIN),
                title, message, NotificationType.FEEDBACK_SUBMITTED, visit.getId(), visit.getVisitCode(), false
        );
    }

    private void sendEmailNotification(String recipientEmail, String subject, String messageText, String refCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("CoopBank Visit Hub - " + subject);

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #0072bc; padding: 12px; border-radius: 6px; text-align: center; color: white;">
                        <h3 style="margin: 0;">🏦 Cooperative Bank of Oromia</h3>
                        <p style="margin: 3px 0 0; font-size: 13px;">Executive Visit Hub Notification</p>
                    </div>
                    <div style="padding: 20px 0;">
                        <h4 style="color: #333; margin-top: 0;">%s</h4>
                        <p style="color: #555; line-height: 1.6;">%s</p>
                        <div style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #f7941d; margin: 20px 0; border-radius: 4px;">
                            <strong>Reference Code:</strong> <code>%s</code>
                        </div>
                        <p style="font-size: 13px; color: #777;">Log in to the CoopBank Visit Hub to view the complete details and take necessary action.</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee;"/>
                    <p style="font-size: 11px; color: #999; text-align: center;">Cooperative Bank of Oromia | Automated System Alert</p>
                </div>
                """,
                subject, messageText, refCode != null ? refCode : "N/A"
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Staff notification email sent to '{}' for subject '{}'", recipientEmail, subject);
        } catch (Exception e) {
            log.warn("Failed to dispatch staff alert email to '{}': {}", recipientEmail, e.getMessage());
        }
    }
}
