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
import com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingSpecification;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
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
        if (!StringUtils.hasText(request.getRoomName())) {
            throw new IllegalArgumentException("A valid meeting room name must be provided.");
        }
        String requestedRoomName = request.getRoomName().trim();
        // Store the registered spelling so availability and the database constraint
        // treat different casing of the same room as one resource.
        String roomName = meetingRoomRepository.findByNameIgnoreCase(requestedRoomName)
                .map(room -> room.getName().trim())
                .orElse(requestedRoomName);
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
                    throw new AccessDeniedException(
                            String.format("Access Denied: Secretaries can only book rooms assigned to their department ('%s'). Target room belongs to '%s'.",
                                    secretaryDept, room.getDepartment()));
                }
            });
            department = secretaryDept.trim();
        }

        Instant startTime = request.getScheduledStartTime() != null ? request.getScheduledStartTime() : Instant.now();
        Instant endTime = request.getScheduledEndTime() != null ? request.getScheduledEndTime() : startTime.plusSeconds(3600);

        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new IllegalArgumentException("Scheduled end time must be after start time.");
        }

        // Overlap validation: Ensure room is not already booked during this time window
        List<RoomBooking> overlapping = roomBookingRepository.findOverlappingBookings(roomName, startTime, endTime);
        if (!overlapping.isEmpty()) {
            RoomBooking conflict = overlapping.get(0);
            String conflictStart = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(ZoneOffset.UTC).format(conflict.getScheduledStartTime());
            String conflictEnd = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(ZoneOffset.UTC).format(conflict.getScheduledEndTime());
            throw new IllegalStateException(String.format(
                    "Meeting room '%s' is already booked from %s to %s UTC for '%s' (Ref: %s). Please select a different time window or room.",
                    roomName, conflictStart, conflictEnd, conflict.getMeetingTitle(), conflict.getBookingCode()
            ));
        }

        String bookingCode = generateBookingCode();

        // Populate staff data directly from Active Directory / Authenticated User
        UUID bookedById = currentUser != null ? currentUser.getId() : null;
        String bookedByName = currentUser != null ? currentUser.getFullName() : "Coop Staff Member";
        String bookedByUsername = currentUser != null ? currentUser.getUsername() : "staff";
        String bookedByEmail = currentUser != null ? currentUser.getEmail() : null;

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

        final RoomBooking saved;
        try {
            saved = roomBookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException ex) {
            // V20 backs up the pre-check with a database-level exclusion
            // constraint, protecting against simultaneous booking requests.
            throw new IllegalStateException(String.format(
                    "Meeting room '%s' is already booked for the selected time window. Please choose another slot.",
                    roomName), ex);
        }

        // Notify System Admins via Email / In-App Notification
        if (notificationService != null || emailService != null) {
            try {
                String dateStr = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneOffset.UTC).format(startTime);
                String timeStr = String.format("%s - %s UTC",
                        DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(startTime),
                        DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(endTime));

                String adminMessage = String.format(
                        "Staff member %s (%s, Dept: %s) has booked meeting room '%s' for '%s' on %s (%s). Reference: %s.",
                        bookedByName, (bookedByEmail != null ? bookedByEmail : "No email"), department, roomName, title, dateStr, timeStr, bookingCode
                );

                if (notificationService != null) {
                    try {
                        notificationService.notifyRoles(
                                List.of(RoleName.ROLE_ADMIN),
                                "Room Reservation Confirmed: " + roomName,
                                adminMessage,
                                NotificationType.VISIT_APPROVED,
                                saved.getId(),
                                bookingCode,
                                true
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send admin in-app room booking alert for {}: {}", bookingCode, e.getMessage());
                    }
                }

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
                        try {
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
                        } catch (Exception e) {
                            log.warn("Failed to send admin room booking email to {} for {}: {}", aEmail, bookingCode, e.getMessage());
                        }
                    }

                    // 1. Dispatch booking confirmation to the booker
                    if (StringUtils.hasText(saved.getBookedByEmail())) {
                        try {
                            emailService.sendRoomBookingBookerConfirmation(
                                    saved.getBookedByEmail().trim(),
                                    saved.getBookedByName(),
                                    saved.getRoomName(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                    saved.getHostDepartment()
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send booker confirmation for {}: {}", bookingCode, e.getMessage());
                        }
                    }

                    // 2. Dispatch notifications to all concerned department staff / secretaries / directors
                    String roomDept = saved.getHostDepartment();
                    var roomOpt = meetingRoomRepository.findByNameIgnoreCase(saved.getRoomName());
                    if (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getDepartment())) {
                        roomDept = roomOpt.get().getDepartment().trim();
                    }

                    final String finalRoomName = saved.getRoomName() != null ? saved.getRoomName().toLowerCase() : "";
                    final String finalDept = StringUtils.hasText(roomDept) ? roomDept.trim() : "";

                    List<User> concernedUsers = userRepository.findAll().stream()
                            .filter(u -> u.isEnabled() && u.isAccountNonLocked())
                            .filter(u -> {
                                if (StringUtils.hasText(u.getDepartment())) {
                                    String uDept = u.getDepartment().trim().toLowerCase();
                                    if (!finalDept.isEmpty() && (uDept.equalsIgnoreCase(finalDept)
                                            || uDept.contains(finalDept.toLowerCase())
                                            || finalDept.toLowerCase().contains(uDept))) {
                                        return true;
                                    }
                                    if (!finalRoomName.isEmpty() && (finalRoomName.contains(uDept) || uDept.contains(finalRoomName))) {
                                        return true;
                                    }
                                }
                                return false;
                            })
                            .toList();

                    log.info("Dispatching room booking notification for room '{}' to {} concerned department staff member(s) in '{}'",
                            saved.getRoomName(), concernedUsers.size(), finalDept);

                    for (User deptUser : concernedUsers) {
                        // Skip booker if they booked their own room to avoid duplicate emails
                        if (StringUtils.hasText(saved.getBookedByEmail()) && StringUtils.hasText(deptUser.getEmail())
                                && deptUser.getEmail().equalsIgnoreCase(saved.getBookedByEmail().trim())) {
                            continue;
                        }

                        if (emailService != null && StringUtils.hasText(deptUser.getEmail())) {
                            try {
                                emailService.sendRoomBookingSecretaryNotification(
                                        deptUser.getEmail(),
                                        deptUser.getFullName(),
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
                                        saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1
                                );
                            } catch (Exception e) {
                                log.warn("Failed to send department room booking email to {} for {}: {}",
                                        deptUser.getEmail(), bookingCode, e.getMessage());
                            }
                        }

                        if (notificationService != null) {
                            String deptMessage = String.format(
                                    "Meeting space '%s' under your department (%s) has been booked for '%s' by %s. Ref: %s.",
                                    saved.getRoomName(), finalDept, saved.getMeetingTitle(), saved.getBookedByName(), saved.getBookingCode()
                            );
                            try {
                                notificationService.notifyUser(
                                        deptUser,
                                        "Department Space Booked: " + saved.getRoomName(),
                                        deptMessage,
                                        NotificationType.VISIT_APPROVED,
                                        saved.getId(),
                                        saved.getBookingCode(),
                                        false
                                );
                            } catch (Exception e) {
                                log.warn("Failed to send department in-app room booking alert to {} for {}: {}",
                                        deptUser.getUsername(), bookingCode, e.getMessage());
                            }
                        }
                    }

                    // 3. Dispatch notification to designated room Contact Email (e.g. DxValley contact or incubation lead)
                    if (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getContactEmail())) {
                        String contactEmail = roomOpt.get().getContactEmail().trim();
                        log.info("Dispatching room booking notification to designated contact email '{}' for room '{}'",
                                contactEmail, saved.getRoomName());

                        if (emailService != null) {
                            try {
                                emailService.sendRoomBookingContactNotification(
                                        contactEmail,
                                        saved.getRoomName(),
                                        saved.getBookedByName(),
                                        saved.getHostDepartment(),
                                        saved.getBookingCode(),
                                        saved.getMeetingTitle(),
                                        saved.getScheduledStartTime(),
                                        saved.getScheduledEndTime(),
                                        saved.getMeetingAgenda(),
                                        saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                        false,
                                        null
                                );
                            } catch (Exception e) {
                                log.warn("Failed to send room contact booking email to {} for {}: {}",
                                        contactEmail, bookingCode, e.getMessage());
                            }
                        }

                        // If designated contact email belongs to a registered user, send in-app notification too
                        userRepository.findByEmailIgnoreCase(contactEmail).ifPresent(contactUser -> {
                            if (notificationService != null) {
                                String contactMsg = String.format(
                                        "A new reservation has been scheduled for your room '%s' by %s (%s) for '%s'. Ref: %s.",
                                        saved.getRoomName(), saved.getBookedByName(), saved.getHostDepartment(),
                                        saved.getMeetingTitle(), saved.getBookingCode()
                                );
                                try {
                                    notificationService.notifyUser(
                                            contactUser,
                                            "Room Reserved: " + saved.getRoomName(),
                                            contactMsg,
                                            NotificationType.VISIT_APPROVED,
                                            saved.getId(),
                                            saved.getBookingCode(),
                                            false
                                    );
                                } catch (Exception e) {
                                    log.warn("Failed to send room contact in-app alert to {} for {}: {}",
                                            contactEmail, bookingCode, e.getMessage());
                                }
                            }
                        });
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
                RoomBookingSpecification.filterBookings(cleanRoom, cleanSearch, status),
                pageable
        ).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomBookingResponse> getMyBookings(String roomName, String search, RoomBookingStatus status, Pageable pageable, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required to view your personal bookings.");
        }

        String cleanRoom = StringUtils.hasText(roomName) ? roomName.trim() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;

        return roomBookingRepository.findMyBookingsWithFilters(
                currentUser.getId(),
                currentUser.getEmail(),
                currentUser.getUsername(),
                cleanRoom,
                cleanSearch,
                status,
                pageable
        ).map(this::mapToResponse);
    }

    private boolean isSecretary(User user) {
        return user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_SECRETARY);
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN || r.getName().name().contains("ADMIN"));
    }

    private boolean isRelationshipManager(User user) {
        return user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_RELATIONSHIP_MANAGER);
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

        if (booking.getStatus() == RoomBookingStatus.CANCELLED) {
            return mapToResponse(booking);
        }

        // Authorization check: Who is allowed to cancel this booking?
        // 1. Admins
        // 2. Relationship Managers
        // 3. The original booker (by user ID, email, or username)
        // 4. Department Secretary for this room's department
        // 5. Designated room Contact Person
        var roomOpt = meetingRoomRepository.findByNameIgnoreCase(booking.getRoomName());
        boolean isOwner = currentUser != null && (
                (booking.getBookedByUserId() != null && booking.getBookedByUserId().equals(currentUser.getId()))
                || (StringUtils.hasText(booking.getBookedByEmail()) && booking.getBookedByEmail().equalsIgnoreCase(currentUser.getEmail()))
                || (StringUtils.hasText(booking.getBookedByUsername()) && booking.getBookedByUsername().equalsIgnoreCase(currentUser.getUsername()))
        );
        boolean isRoomContact = currentUser != null && roomOpt.isPresent()
                && StringUtils.hasText(roomOpt.get().getContactEmail())
                && roomOpt.get().getContactEmail().trim().equalsIgnoreCase(currentUser.getEmail());
        boolean isDeptSecretary = currentUser != null && isSecretary(currentUser) && (
                (StringUtils.hasText(currentUser.getDepartment()) && currentUser.getDepartment().equalsIgnoreCase(booking.getHostDepartment()))
                || (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getDepartment()) && roomOpt.get().getDepartment().equalsIgnoreCase(currentUser.getDepartment()))
        );

        if (!isAdmin(currentUser) && !isRelationshipManager(currentUser) && !isOwner && !isRoomContact && !isDeptSecretary) {
            throw new AccessDeniedException("Access Denied: You do not have permission to cancel this meeting room booking.");
        }

        booking.setStatus(RoomBookingStatus.CANCELLED);
        RoomBooking updated = roomBookingRepository.save(booking);

        String cancelledByName = currentUser != null ? currentUser.getFullName() : "Administrator";

        // Dispatch notifications on cancellation
        try {
            String dateStr = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneOffset.UTC).format(booking.getScheduledStartTime());
            String timeStr = String.format("%s - %s UTC",
                    DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(booking.getScheduledStartTime()),
                    DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(booking.getScheduledEndTime()));

            // Resolve booker's email and user object
            String bookerEmail = booking.getBookedByEmail();
            String bookerName = booking.getBookedByName();

            User bookerUser = null;
            if (booking.getBookedByUserId() != null) {
                bookerUser = userRepository.findById(booking.getBookedByUserId()).orElse(null);
            }
            if (bookerUser == null && StringUtils.hasText(bookerEmail)) {
                bookerUser = userRepository.findByEmailIgnoreCase(bookerEmail).orElse(null);
            }
            if (bookerUser == null && StringUtils.hasText(booking.getBookedByUsername())) {
                bookerUser = userRepository.findByUsername(booking.getBookedByUsername()).orElse(null);
            }

            if (bookerUser != null) {
                if (!StringUtils.hasText(bookerEmail)) {
                    bookerEmail = bookerUser.getEmail();
                }
                if (!StringUtils.hasText(bookerName)) {
                    bookerName = bookerUser.getFullName();
                }
            }

            // 1. Send Cancellation Email to Booker
            if (StringUtils.hasText(bookerEmail) && emailService != null) {
                log.info("Sending cancellation email to booker '{}' for room '{}', booking '{}'",
                        bookerEmail, booking.getRoomName(), booking.getBookingCode());
                try {
                    emailService.sendRoomBookingCancellationNotification(
                            bookerEmail,
                            bookerName,
                            booking.getRoomName(),
                            bookerName,
                            booking.getBookingCode(),
                            booking.getMeetingTitle(),
                            booking.getScheduledStartTime(),
                            booking.getScheduledEndTime(),
                            cancelledByName,
                            "Room reservation was cancelled in Visit Hub."
                    );
                } catch (Exception e) {
                    log.warn("Failed to send cancellation email to booker {} for {}: {}",
                            bookerEmail, booking.getBookingCode(), e.getMessage());
                }
            }

            // 2. Send In-App Notification to Booker
            if (notificationService != null && bookerUser != null) {
                String cancelMsg = String.format(
                        "Your reservation for room '%s' (%s) scheduled for %s (%s) has been cancelled by %s. Ref: %s.",
                        booking.getRoomName(), booking.getMeetingTitle(), dateStr, timeStr, cancelledByName, booking.getBookingCode()
                );
                try {
                    notificationService.notifyUser(
                            bookerUser,
                            "Room Booking Cancelled: " + booking.getRoomName(),
                            cancelMsg,
                            NotificationType.SYSTEM_ALERT,
                            booking.getId(),
                            booking.getBookingCode(),
                            false
                    );
                } catch (Exception e) {
                    log.warn("Failed to send cancellation alert to booker for {}: {}",
                            booking.getBookingCode(), e.getMessage());
                }
            }

            // 3. Notify the designated room Contact Email (if present)
            if (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getContactEmail())) {
                String contactEmail = roomOpt.get().getContactEmail().trim();
                log.info("Sending cancellation email to room contact '{}' for room '{}', booking '{}'",
                        contactEmail, booking.getRoomName(), booking.getBookingCode());

                if (emailService != null) {
                    try {
                        emailService.sendRoomBookingContactNotification(
                                contactEmail,
                                booking.getRoomName(),
                                booking.getBookedByName(),
                                booking.getHostDepartment(),
                                booking.getBookingCode(),
                                booking.getMeetingTitle(),
                                booking.getScheduledStartTime(),
                                booking.getScheduledEndTime(),
                                booking.getMeetingAgenda(),
                                booking.getExpectedAttendees(),
                                true,
                                cancelledByName
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send cancellation email to room contact {} for {}: {}",
                                contactEmail, booking.getBookingCode(), e.getMessage());
                    }
                }

                userRepository.findByEmailIgnoreCase(contactEmail).ifPresent(contactUser -> {
                    if (notificationService != null && (currentUser == null || !contactUser.getId().equals(currentUser.getId()))) {
                        String contactMsg = String.format(
                                "The booking for room '%s' (%s) on %s (%s) was cancelled by %s. Ref: %s.",
                                booking.getRoomName(), booking.getMeetingTitle(), dateStr, timeStr, cancelledByName, booking.getBookingCode()
                        );
                        try {
                            notificationService.notifyUser(
                                    contactUser,
                                    "Room Reservation Cancelled: " + booking.getRoomName(),
                                    contactMsg,
                                    NotificationType.SYSTEM_ALERT,
                                    booking.getId(),
                                    booking.getBookingCode(),
                                    false
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send room contact cancellation alert to {} for {}: {}",
                                    contactEmail, booking.getBookingCode(), e.getMessage());
                        }
                    }
                });
            }

            // 4. Notify concerned department staff / secretaries / directors on cancellation
            String cancelRoomDept = booking.getHostDepartment();
            if (roomOpt.isPresent() && StringUtils.hasText(roomOpt.get().getDepartment())) {
                cancelRoomDept = roomOpt.get().getDepartment().trim();
            }
            final String finalCancelRoom = booking.getRoomName() != null ? booking.getRoomName().toLowerCase() : "";
            final String finalCancelDept = StringUtils.hasText(cancelRoomDept) ? cancelRoomDept.trim() : "";

            List<User> concernedDeptStaff = userRepository.findAll().stream()
                    .filter(u -> u.isEnabled() && u.isAccountNonLocked())
                    .filter(u -> {
                        if (StringUtils.hasText(u.getDepartment())) {
                            String uDept = u.getDepartment().trim().toLowerCase();
                            if (!finalCancelDept.isEmpty() && (uDept.equalsIgnoreCase(finalCancelDept)
                                    || uDept.contains(finalCancelDept.toLowerCase())
                                    || finalCancelDept.toLowerCase().contains(uDept))) {
                                return true;
                            }
                            if (!finalCancelRoom.isEmpty() && (finalCancelRoom.contains(uDept) || uDept.contains(finalCancelRoom))) {
                                return true;
                            }
                        }
                        return false;
                    })
                    .toList();

            for (User deptUser : concernedDeptStaff) {
                if (StringUtils.hasText(bookerEmail) && StringUtils.hasText(deptUser.getEmail())
                        && deptUser.getEmail().equalsIgnoreCase(bookerEmail.trim())) {
                    continue;
                }
                if (emailService != null && StringUtils.hasText(deptUser.getEmail())) {
                    try {
                        emailService.sendRoomBookingCancellationNotification(
                                deptUser.getEmail(),
                                deptUser.getFullName(),
                                booking.getRoomName(),
                                booking.getBookedByName(),
                                booking.getBookingCode(),
                                booking.getMeetingTitle(),
                                booking.getScheduledStartTime(),
                                booking.getScheduledEndTime(),
                                cancelledByName,
                                "Reservation for room in your department was cancelled."
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send department cancellation email to {} for {}: {}",
                                deptUser.getEmail(), booking.getBookingCode(), e.getMessage());
                    }
                }
                if (notificationService != null) {
                    String departmentCancelMessage = String.format(
                            "The booking for room '%s' (%s) was cancelled by %s. Ref: %s.",
                            booking.getRoomName(), booking.getMeetingTitle(), cancelledByName, booking.getBookingCode());
                    try {
                        notificationService.notifyUser(
                                deptUser,
                                "Room Reservation Cancelled: " + booking.getRoomName(),
                                departmentCancelMessage,
                                NotificationType.SYSTEM_ALERT,
                                booking.getId(),
                                booking.getBookingCode(),
                                false
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send department cancellation alert to {} for {}: {}",
                                deptUser.getUsername(), booking.getBookingCode(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to dispatch cancellation notifications for booking {}: {}", bookingId, e.getMessage(), e);
        }

        // Security Audit Log
        auditLoggerService.logEvent(
                currentUser,
                currentUser != null ? currentUser.getUsername() : "system",
                AuditEventType.ROOM_BOOKING_CANCELLED,
                AuditStatus.SUCCESS,
                null,
                null,
                String.format("Room booking '%s' for room '%s' was CANCELLED by %s",
                        updated.getBookingCode(), updated.getRoomName(), cancelledByName)
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
