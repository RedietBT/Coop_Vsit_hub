package com.example.coop_vsit_hub.user_and_auth.service;

import java.time.Instant;

public interface EmailService {

    void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken);

    void sendStaffOnboardingEmail(String recipientEmail, String recipientName, String username, String password, String roleSummary, String roleDetails);

    default void sendRoomBookingAdminNotification(
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
    ) {
        sendRoomBookingAdminNotification(adminEmail, roomName, bookedByName, bookedByDept, null, visitCode, visitTitle, guestName, organizationName, startTime, endTime, purpose, visitorCount);
    }

    default void sendRoomBookingAdminNotification(
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
            int visitorCount
    ) {
        sendRoomBookingAdminNotification(adminEmail, roomName, bookedByName, bookedByDept, bookedByPhone, visitCode, visitTitle, guestName, organizationName, startTime, endTime, purpose, visitorCount, null);
    }

    void sendRoomBookingAdminNotification(
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
    );

    default void sendRoomBookingSecretaryNotification(
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
    ) {
        sendRoomBookingSecretaryNotification(secretaryEmail, secretaryName, departmentName, roomName, bookedByName, bookedByDept, null, visitCode, visitTitle, guestName, organizationName, startTime, endTime, purpose, visitorCount, null);
    }

    default void sendRoomBookingSecretaryNotification(
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
            int visitorCount
    ) {
        sendRoomBookingSecretaryNotification(secretaryEmail, secretaryName, departmentName, roomName, bookedByName, bookedByDept, bookedByPhone, visitCode, visitTitle, guestName, organizationName, startTime, endTime, purpose, visitorCount, null);
    }

    void sendRoomBookingSecretaryNotification(
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
    );

    default void sendRoomBookingCancellationNotification(
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
    ) {
        sendRoomBookingCancellationNotification(recipientEmail, recipientName, roomName, bookedByName, null, bookingCode, meetingTitle, startTime, endTime, cancelledBy, cancellationReason, null);
    }

    default void sendRoomBookingCancellationNotification(
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
            String cancellationReason
    ) {
        sendRoomBookingCancellationNotification(recipientEmail, recipientName, roomName, bookedByName, bookedByPhone, bookingCode, meetingTitle, startTime, endTime, cancelledBy, cancellationReason, null);
    }

    void sendRoomBookingCancellationNotification(
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
    );

    default void sendRoomBookingContactNotification(
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
    ) {
        sendRoomBookingContactNotification(contactEmail, roomName, bookedByName, bookedByDept, null, bookingCode, meetingTitle, startTime, endTime, purpose, attendees, isCancellation, cancelledBy, null, null);
    }

    default void sendRoomBookingContactNotification(
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
            String cancelledBy,
            String cancellationReason
    ) {
        sendRoomBookingContactNotification(contactEmail, roomName, bookedByName, bookedByDept, null, bookingCode, meetingTitle, startTime, endTime, purpose, attendees, isCancellation, cancelledBy, cancellationReason, null);
    }

    default void sendRoomBookingContactNotification(
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
            String cancellationReason
    ) {
        sendRoomBookingContactNotification(contactEmail, roomName, bookedByName, bookedByDept, bookedByPhone, bookingCode, meetingTitle, startTime, endTime, purpose, attendees, isCancellation, cancelledBy, cancellationReason, null);
    }

    void sendRoomBookingContactNotification(
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
    );

    default void sendRoomBookingBookerConfirmation(
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
    ) {
        sendRoomBookingBookerConfirmation(recipientEmail, recipientName, roomName, bookingCode, meetingTitle, startTime, endTime, purpose, attendees, hostDept, null, null);
    }

    default void sendRoomBookingBookerConfirmation(
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
            String bookedByPhone
    ) {
        sendRoomBookingBookerConfirmation(recipientEmail, recipientName, roomName, bookingCode, meetingTitle, startTime, endTime, purpose, attendees, hostDept, bookedByPhone, null);
    }

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
            String hostDept,
            String bookedByPhone,
            String requestedItems
    );

    default void sendRoomBookingUpdatedContactNotification(
            String contactEmail,
            String roomName,
            String bookedByName,
            String bookedByDept,
            String bookingCode,
            String meetingTitle,
            Instant oldStartTime,
            Instant oldEndTime,
            Instant newStartTime,
            Instant newEndTime,
            String purpose,
            int attendees,
            String updatedBy
    ) {
        sendRoomBookingUpdatedContactNotification(contactEmail, roomName, bookedByName, bookedByDept, null, bookingCode, meetingTitle, oldStartTime, oldEndTime, newStartTime, newEndTime, purpose, attendees, updatedBy, null);
    }

    default void sendRoomBookingUpdatedContactNotification(
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
            String updatedBy
    ) {
        sendRoomBookingUpdatedContactNotification(contactEmail, roomName, bookedByName, bookedByDept, bookedByPhone, bookingCode, meetingTitle, oldStartTime, oldEndTime, newStartTime, newEndTime, purpose, attendees, updatedBy, null);
    }

    void sendRoomBookingUpdatedContactNotification(
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
    );
}
