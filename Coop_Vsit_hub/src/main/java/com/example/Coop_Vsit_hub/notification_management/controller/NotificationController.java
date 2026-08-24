package com.example.coop_vsit_hub.notification_management.controller;

import com.example.coop_vsit_hub.notification_management.dto.NotificationResponse;
import com.example.coop_vsit_hub.notification_management.dto.UnreadCountResponse;
import com.example.coop_vsit_hub.notification_management.service.NotificationService;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * REST API Controller for Staff Notifications and System Alerts.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "6. Notifications & Alerts", description = "In-app and email alert notifications for visit bookings, approvals, and front-desk security check-ins")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List User Notifications", description = "Retrieve paginated notifications and alerts for the currently authenticated staff member.")
    public ResponseEntity<PageResponse<NotificationResponse>> getUserNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            Principal principal
    ) {
        String username = principal.getName();
        return ResponseEntity.ok(notificationService.getUserNotifications(username, unreadOnly, page, size));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Unread Notifications Counter", description = "Returns total count of unread notifications for top navigation bell icon badge.")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Principal principal) {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal.getName()));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark Notification as Read", description = "Updates a single notification status to read.")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getName()));
    }

    @PatchMapping("/mark-all-read")
    @Operation(summary = "Mark All Notifications as Read", description = "Bulk marks all unread notifications as read for current user.")
    public ResponseEntity<Map<String, String>> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok(Map.of("message", "All notifications successfully marked as read."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Dismiss / Delete Notification", description = "Permanently deletes a notification item.")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable UUID id, Principal principal) {
        notificationService.deleteNotification(id, principal.getName());
        return ResponseEntity.ok(Map.of(
                "message", "Notification dismissed.",
                "deletedNotificationId", id.toString()
        ));
    }
}
