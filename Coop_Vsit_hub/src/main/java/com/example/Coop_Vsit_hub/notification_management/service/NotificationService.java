package com.example.coop_vsit_hub.notification_management.service;

import com.example.coop_vsit_hub.notification_management.dto.NotificationResponse;
import com.example.coop_vsit_hub.notification_management.dto.UnreadCountResponse;
import com.example.coop_vsit_hub.notification_management.enums.NotificationType;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.model.Visit;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for Staff In-App & Email Notifications.
 */
public interface NotificationService {

    /**
     * Get paginated notifications for the authenticated user.
     */
    PageResponse<NotificationResponse> getUserNotifications(String username, Boolean unreadOnly, int page, int size);

    /**
     * Get total unread notifications count for UI bell badge.
     */
    UnreadCountResponse getUnreadCount(String username);

    /**
     * Mark a specific notification as read.
     */
    NotificationResponse markAsRead(UUID id, String username);

    /**
     * Mark all notifications as read for the authenticated user.
     */
    void markAllAsRead(String username);

    /**
     * Delete / dismiss a notification.
     */
    void deleteNotification(UUID id, String username);

    /**
     * Dispatch notification to a single user (In-app + Optional MailHog Email).
     */
    void notifyUser(User recipient, String title, String message, NotificationType type, UUID refId, String refCode, boolean sendEmail);

    /**
     * Dispatch broadcast notification to all users holding specified roles.
     */
    void notifyRoles(List<RoleName> roles, String title, String message, NotificationType type, UUID refId, String refCode, boolean sendEmail);

    /**
     * Automated trigger: When a new visit is booked or submitted.
     */
    void notifyVisitRequested(Visit visit);

    /**
     * Automated trigger: When visit status transitions (Approved, Rejected, Cancelled).
     */
    void notifyVisitStatusTransition(Visit visit, VisitStatus oldStatus, VisitStatus newStatus, String notes);

    /**
     * Automated trigger: When visitor arrives and checks in at Security Desk.
     */
    void notifyVisitorCheckedIn(Visit visit);

    /**
     * Automated trigger: When guest submits post-visit satisfaction survey.
     */
    void notifyFeedbackSubmitted(Visit visit, int npsScore, double avgRating);
}
