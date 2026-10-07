package com.example.coop_vsit_hub.user_and_auth.service;

import java.time.Instant;

public interface EmailService {

    void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken);

    void sendStaffOnboardingEmail(String recipientEmail, String recipientName, String username, String password, String roleSummary, String roleDetails);

    void sendRoomBookingAdminNotification(
            String adminEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String visitCode,
            String visitTitle,
            String guestName,
            String organizationName,
            Instant startTime,
            Instant endTime,
            String purpose,
            int visitorCount
    );

    void sendRoomBookingSecretaryNotification(
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
            Instant startTime,
            Instant endTime,
            String purpose,
            int visitorCount
    );

    void sendRoomBookingCancellationNotification(
            String recipientEmail,
            String recipientName,
            String roomName,
            String bookedByName,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String cancelledBy,
            String cancellationReason
    );

    void sendRoomBookingContactNotification(
            String contactEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String purpose,
            int attendees,
            boolean isCancellation,
            String cancelledBy
    );

    void sendRoomBookingBookerConfirmation(
            String recipientEmail,
            String recipientName,
            String roomName,
            String bookingCode,
            String meetingTitle,
            Instant startTime,
            Instant endTime,
            String purpose,
            int attendees,
            String hostDept
    );
}
