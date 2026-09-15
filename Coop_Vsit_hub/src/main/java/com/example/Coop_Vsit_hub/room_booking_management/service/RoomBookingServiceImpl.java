package com.example.coop_vsit_hub.room_booking_management.service;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.notification_management.enums.NotificationType;
import com.example.coop_vsit_hub.notification_management.service.NotificationService;
import com.example.coop_vsit_hub.room_booking_management.dto.CreateRoomBookingRequest;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingSlotResponse;
import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingRepository;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository roomBookingRepository;
    private final com.example.coop_vsit_hub.master_data.repository.MeetingRoomRepository meetingRoomRepository;
    private final NotificationService notificationService;
    private final com.example.coop_vsit_hub.user_and_auth.service.EmailService emailService;
    private final com.example.coop_vsit_hub.user_and_auth.repository.UserRepository userRepository;
    private final AuditLoggerService auditLoggerService;

    @org.springframework.beans.factory.annotation.Value("${coopbank.app.admin-email:}")
    private String configuredAdminEmail;

    @Override
    @Transactional
    public RoomBookingResponse createBooking(CreateRoomBookingRequest request, User currentUser) {
        String bookingCode = generateBookingCode();

        String roomName = StringUtils.hasText(request.getRoomName()) ? request.getRoomName().trim() : "Executive Boardroom";
        String title = StringUtils.hasText(request.getMeetingTitle()) ? request.getMeetingTitle().trim() : "Internal Strategy Meeting";
        String department = StringUtils.hasText(request.getHostDepartment()) 
                ? request.getHostDepartment().trim() 
                : (currentUser != null && currentUser.getDepartment() != null ? currentUser.getDepartment() : "General Management");

        // Departmental Multi-Tenancy: Secretaries may only reserve rooms assigned to their department
        if (currentUser != null && isSecretary(currentUser)) {
            String secretaryDept = currentUser.getDepartment();
            if (secretaryDept == null || secretaryDept.isBlank()) {
                throw new IllegalArgumentException("Secretary user does not have an assigned department.");
            }
            meetingRoomRepository.findByNameIgnoreCase(roomName).ifPresent(room -> {
                if (room.getDepartment() != null && !room.getDepartment().isBlank()
                        && !room.getDepartment().equalsIgnoreCase(secretaryDept)) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            String.format("Access Denied: Secretaries can only book rooms assigned to their department ('%s'). Target room belongs to '%s'.",
                                    secretaryDept, room.getDepartment()));
                }
            });
            department = secretaryDept.trim();
        }

        Instant startTime = request.getScheduledStartTime() != null ? request.getScheduledStartTime() : Instant.now();
        Instant endTime = request.getScheduledEndTime() != null ? request.getScheduledEndTime() : startTime.plusSeconds(3600);

        // Populate staff data directly from Active Directory / Authenticated User
        UUID bookedById = currentUser != null ? currentUser.getId() : null;
        String bookedByName = currentUser != null ? currentUser.getFullName() : "Coop Staff Member";
        String bookedByUsername = currentUser != null ? currentUser.getUsername() : "staff";
        String bookedByEmail = currentUser != null ? currentUser.getEmail() : "staff@coopbankoromia.com.et";

        RoomBooking booking = RoomBooking.builder()
                .bookingCode(bookingCode)
                .roomName(roomName)
                .meetingTitle(title)
                .hostDepartment(department)
                .bookedByUserId(bookedById)
                .bookedByName(bookedByName)
                .bookedByUsername(bookedByUsername)
                .bookedByEmail(bookedByEmail)
                .guestOrganizationName(StringUtils.hasText(request.getGuestOrganizationName()) ? request.getGuestOrganizationName().trim() : null)
                .guestName(StringUtils.hasText(request.getGuestName()) ? request.getGuestName().trim() : null)
                .expectedAttendees(request.getExpectedAttendees() != null && request.getExpectedAttendees() > 0 ? request.getExpectedAttendees() : 1)
                .meetingAgenda(StringUtils.hasText(request.getMeetingAgenda()) ? request.getMeetingAgenda().trim() : null)
                .scheduledStartTime(startTime)
                .scheduledEndTime(endTime)
                .status(RoomBookingStatus.CONFIRMED)
                .build();

        RoomBooking saved = roomBookingRepository.save(booking);

        // Notify System Admins via SMTP / In-App Notification
        if (notificationService != null) {
            try {
                String dateStr = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneOffset.UTC).format(startTime);
                String timeStr = String.format("%s - %s UTC",
                        DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(startTime),
                        DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(endTime));

                String adminMessage = String.format(
                        "Staff member %s (%s, Dept: %s) has booked meeting room '%s' for '%s' on %s (%s). Reference: %s.",
                        bookedByName, bookedByEmail, department, roomName, title, dateStr, timeStr, bookingCode
                );

                notificationService.notifyRoles(
                        List.of(RoleName.ROLE_ADMIN),
                        "Room Reservation Confirmed: " + roomName,
                        adminMessage,
                        NotificationType.VISIT_APPROVED,
                        saved.getId(),
                        bookingCode,
                        true
                );

                if (emailService != null) {
                    List<String> adminEmails = new ArrayList<>(userRepository.findAll().stream()
                            .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN || r.getName().name().contains("ADMIN")))
                            .map(User::getEmail)
                            .filter(StringUtils::hasText)
                            .distinct()
                            .toList());

                    if (adminEmails.isEmpty() && StringUtils.hasText(configuredAdminEmail)) {
                        adminEmails.add(configuredAdminEmail.trim());
                    }

                    if (adminEmails.isEmpty()) {
                        userRepository.findByUsername("admin")
                                .filter(u -> StringUtils.hasText(u.getEmail()))
                                .ifPresent(u -> adminEmails.add(u.getEmail()));
                    }

                    log.info("Sending room booking email notification for room '{}' to {} admin(s): {}",
                            saved.getRoomName(), adminEmails.size(), adminEmails);

                    for (String aEmail : adminEmails) {
                        emailService.sendRoomBookingAdminNotification(
                                aEmail,
                                saved.getRoomName(),
                                saved.getBookedByName(),
                                saved.getHostDepartment(),
                                saved.getBookingCode(),
                                saved.getMeetingTitle(),
                                saved.getGuestName(),
                                saved.getGuestOrganizationName(),
                                saved.getScheduledStartTime(),
                                saved.getScheduledEndTime(),
                                saved.getMeetingAgenda(),
                                saved.getExpectedAttendees()
                        );
                    }

                    // Dispatch notifications to the registered secretaries of this specific department
                    String roomDept = saved.getHostDepartment();
                    var roomOpt = meetingRoomRepository.findByNameIgnoreCase(saved.getRoomName());
                    if (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getDepartment())) {
                        roomDept = roomOpt.get().getDepartment().trim();
                    }

                    if (StringUtils.hasText(roomDept)) {
                        final String finalDept = roomDept;
                        List<User> deptSecretaries = userRepository.findAll().stream()
                                .filter(u -> u.isEnabled() && u.isAccountNonLocked())
                                .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_SECRETARY))
                                .filter(u -> StringUtils.hasText(u.getDepartment()) && u.getDepartment().trim().equalsIgnoreCase(finalDept))
                                .filter(u -> StringUtils.hasText(u.getEmail()))
                                .toList();

                        log.info("Dispatching room booking notification for room '{}' to {} department secretary(ies) in '{}'",
                                saved.getRoomName(), deptSecretaries.size(), finalDept);

                        for (User secretary : deptSecretaries) {
                            emailService.sendRoomBookingSecretaryNotification(
                                    secretary.getEmail(),
                                    secretary.getFullName(),
                                    finalDept,
                                    saved.getRoomName(),
                                    saved.getBookedByName(),
                                    saved.getHostDepartment(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getGuestName(),
                                    saved.getGuestOrganizationName(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees()
                            );

                            if (notificationService != null) {
                                String secMessage = String.format(
                                        "Meeting room '%s' under your department (%s) has been reserved for '%s' by %s. Ref: %s.",
                                        saved.getRoomName(), finalDept, saved.getMeetingTitle(), saved.getBookedByName(), saved.getBookingCode()
                                );
                                notificationService.notifyUser(
                                        secretary,
                                        "Department Room Reserved: " + saved.getRoomName(),
                                        secMessage,
                                        NotificationType.VISIT_APPROVED,
                                        saved.getId(),
                                        saved.getBookingCode(),
                                        false
                                );
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to dispatch booking notification: {}", e.getMessage(), e);
            }
        }

        // Security Audit Log
        auditLoggerService.logEvent(
                currentUser,
                currentUser != null ? currentUser.getUsername() : bookedByUsername,
                AuditEventType.ROOM_BOOKING_CREATED,
                AuditStatus.SUCCESS,
                null,
                null,
                String.format("Meeting room '%s' booked with code '%s' for '%s' (Requester: %s, Time: %s to %s)",
                        saved.getRoomName(), saved.getBookingCode(), saved.getMeetingTitle(), saved.getBookedByName(),
                        saved.getScheduledStartTime(), saved.getScheduledEndTime())
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomBookingResponse> getBookings(String roomName, String search, RoomBookingStatus status, Pageable pageable) {
        return getBookings(roomName, search, status, pageable, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomBookingResponse> getBookings(String roomName, String search, RoomBookingStatus status, Pageable pageable, User currentUser) {
        String cleanRoom = StringUtils.hasText(roomName) ? roomName.trim() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;

        // Departmental Multi-Tenancy: Secretaries only view reservations for their department
        if (currentUser != null && isSecretary(currentUser) && StringUtils.hasText(currentUser.getDepartment())) {
            cleanSearch = currentUser.getDepartment().trim();
        }

        return roomBookingRepository.findAll(
                com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingSpecification.filterBookings(cleanRoom, cleanSearch, status),
                pageable
        ).map(this::mapToResponse);
    }

    private boolean isSecretary(User user) {
        return user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_SECRETARY);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomBookingSlotResponse> getRoomSlots(String roomName, Instant fromDate, Instant toDate) {
        return roomBookingRepository.findActiveRoomSlots(roomName, fromDate, toDate).stream()
                .map(b -> RoomBookingSlotResponse.builder()
                        .id(b.getId())
                        .bookingCode(b.getBookingCode())
                        .roomName(b.getRoomName())
                        .meetingTitle(b.getMeetingTitle())
                        .scheduledStartTime(b.getScheduledStartTime())
                        .scheduledEndTime(b.getScheduledEndTime())
                        .bookedByUserId(b.getBookedByUserId())
                        .bookedByName(b.getBookedByName())
                        .bookedByEmail(b.getBookedByEmail())
                        .hostDepartment(b.getHostDepartment())
                        .expectedAttendees(b.getExpectedAttendees())
                        .meetingAgenda(b.getMeetingAgenda())
                        .guestOrganizationName(b.getGuestOrganizationName())
                        .guestName(b.getGuestName())
                        .status(b.getStatus())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomBookingResponse> getActiveBookingsForDate(Instant fromDate, Instant toDate) {
        return roomBookingRepository.findAllActiveForDateRange(fromDate, toDate).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomBookingResponse cancelBooking(UUID bookingId, User currentUser) {
        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found with ID: " + bookingId));

        booking.setStatus(RoomBookingStatus.CANCELLED);
        RoomBooking updated = roomBookingRepository.save(booking);

        // Security Audit Log
        auditLoggerService.logEvent(
                currentUser,
                currentUser != null ? currentUser.getUsername() : "system",
                AuditEventType.ROOM_BOOKING_CANCELLED,
                AuditStatus.SUCCESS,
                null,
                null,
                String.format("Room booking '%s' for room '%s' was CANCELLED by %s",
                        updated.getBookingCode(), updated.getRoomName(),
                        currentUser != null ? currentUser.getFullName() : "Administrator")
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomBookingResponse getBookingById(UUID bookingId) {
        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found with ID: " + bookingId));
        return mapToResponse(booking);
    }

    private synchronized String generateBookingCode() {
        String yearMonth = DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC).format(Instant.now());
        String prefix = "BKG-" + yearMonth + "-";
        long nextNum = roomBookingRepository.count() + 1;

        String code = String.format("%s%05d", prefix, nextNum);
        while (roomBookingRepository.findByBookingCode(code).isPresent()) {
            nextNum++;
            code = String.format("%s%05d", prefix, nextNum);
        }
        return code;
    }

    private RoomBookingResponse mapToResponse(RoomBooking b) {
        return RoomBookingResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .roomName(b.getRoomName())
                .meetingTitle(b.getMeetingTitle())
                .hostDepartment(b.getHostDepartment())
                .bookedByUserId(b.getBookedByUserId())
                .bookedByName(b.getBookedByName())
                .bookedByUsername(b.getBookedByUsername())
                .bookedByEmail(b.getBookedByEmail())
                .guestOrganizationName(b.getGuestOrganizationName())
                .guestName(b.getGuestName())
                .expectedAttendees(b.getExpectedAttendees())
                .meetingAgenda(b.getMeetingAgenda())
                .scheduledStartTime(b.getScheduledStartTime())
                .scheduledEndTime(b.getScheduledEndTime())
                .status(b.getStatus())
                .linkedVisitId(b.getLinkedVisitId())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
