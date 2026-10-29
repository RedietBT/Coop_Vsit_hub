package com.example.coop_vsit_hub.room_booking_management.service;

import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.notification_management.enums.NotificationType;
import com.example.coop_vsit_hub.notification_management.service.NotificationService;
import com.example.coop_vsit_hub.room_booking_management.dto.CreateRoomBookingRequest;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.RoomBookingSlotResponse;
import com.example.coop_vsit_hub.room_booking_management.dto.UpdateRoomBookingRequest;
import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingRepository;
import com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingSpecification;
import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomBookingServiceImpl implements RoomBookingService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Africa/Addis_Ababa");

    private final RoomBookingRepository roomBookingRepository;
    private final com.example.coop_vsit_hub.master_data.repository.MeetingRoomRepository meetingRoomRepository;
    private final NotificationService notificationService;
    private final com.example.coop_vsit_hub.user_and_auth.service.EmailService emailService;
    private final com.example.coop_vsit_hub.user_and_auth.repository.UserRepository userRepository;
    private final AuditLoggerService auditLoggerService;
    private final com.example.coop_vsit_hub.visit_management.repository.VisitRepository visitRepository;

    @org.springframework.beans.factory.annotation.Value("${coopbank.app.admin-email:}")
    private String configuredAdminEmail;

    @Scheduled(fixedDelayString = "${coopbank.room-bookings.completion-interval-ms:60000}")
    @Transactional
    public void markExpiredBookingsCompleted() {
        int updated = roomBookingRepository.markExpiredConfirmedBookingsCompleted(Instant.now());
        if (updated > 0) {
            log.info("Automatically marked {} expired room booking(s) as COMPLETED.", updated);
        }
    }
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
            String conflictStart = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(DEFAULT_ZONE).format(conflict.getScheduledStartTime());
            String conflictEnd = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(DEFAULT_ZONE).format(conflict.getScheduledEndTime());
            throw new IllegalStateException(String.format(
                    "Meeting room '%s' is already booked from %s to %s for '%s' (Ref: %s). Please select a different time window or room.",
                    roomName, conflictStart, conflictEnd, conflict.getMeetingTitle(), conflict.getBookingCode()
            ));
        }

        String bookingCode = generateBookingCode();

        // Populate staff data directly from Active Directory / Authenticated User with request fallbacks
        if (currentUser == null) {
            if (StringUtils.hasText(request.getBookedByEmail())) {
                currentUser = userRepository.findByEmailIgnoreCase(request.getBookedByEmail().trim()).orElse(null);
            }
            if (currentUser == null && StringUtils.hasText(request.getBookedByUsername())) {
                currentUser = userRepository.findByUsername(request.getBookedByUsername().trim()).orElse(null);
            }
        }
        UUID bookedById = currentUser != null ? currentUser.getId() : null;
        String bookedByName = currentUser != null && StringUtils.hasText(currentUser.getFullName())
                ? currentUser.getFullName()
                : (StringUtils.hasText(request.getBookedByName()) ? request.getBookedByName().trim() : "Coop Staff Member");
        String bookedByUsername = currentUser != null && StringUtils.hasText(currentUser.getUsername())
                ? currentUser.getUsername()
                : (StringUtils.hasText(request.getBookedByUsername()) ? request.getBookedByUsername().trim() : "staff");
        String bookedByEmail = currentUser != null && StringUtils.hasText(currentUser.getEmail())
                ? currentUser.getEmail()
                : (StringUtils.hasText(request.getBookedByEmail()) ? request.getBookedByEmail().trim() : null);
        String bookedByPhone = currentUser != null && StringUtils.hasText(currentUser.getPhoneNumber())
                ? currentUser.getPhoneNumber()
                : (StringUtils.hasText(request.getBookedByPhone()) ? request.getBookedByPhone().trim() : null);

        com.example.coop_vsit_hub.visit_management.enums.VisitType engagementType = com.example.coop_vsit_hub.visit_management.enums.VisitType.INTERNAL;
        if (StringUtils.hasText(request.getEngagementType())) {
            try {
                engagementType = com.example.coop_vsit_hub.visit_management.enums.VisitType.valueOf(request.getEngagementType().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                engagementType = com.example.coop_vsit_hub.visit_management.enums.VisitType.INTERNAL;
            }
        }

        RoomBooking booking = RoomBooking.builder()
                .bookingCode(bookingCode)
                .roomName(roomName)
                .meetingTitle(title)
                .hostDepartment(department)
                .bookedByUserId(bookedById)
                .bookedByName(bookedByName)
                .bookedByUsername(bookedByUsername)
                .bookedByEmail(bookedByEmail)
                .bookedByPhone(bookedByPhone)
                .guestOrganizationName(StringUtils.hasText(request.getGuestOrganizationName()) ? request.getGuestOrganizationName().trim() : null)
                .guestName(StringUtils.hasText(request.getGuestName()) ? request.getGuestName().trim() : null)
                .expectedAttendees(request.getExpectedAttendees() != null && request.getExpectedAttendees() > 0 ? request.getExpectedAttendees() : 1)
                .meetingAgenda(StringUtils.hasText(request.getMeetingAgenda()) ? request.getMeetingAgenda().trim() : null)
                .requestedItems(StringUtils.hasText(request.getRequestedItems()) ? request.getRequestedItems().trim() : null)
                .scheduledStartTime(startTime)
                .scheduledEndTime(endTime)
                .engagementType(engagementType)
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

        // Auto-register corresponding Visit so it immediately displays in Visits Lifecycle Management & Front Desk
        try {
            User requester = currentUser;
            if (requester == null && StringUtils.hasText(saved.getBookedByEmail())) {
                requester = userRepository.findByEmailIgnoreCase(saved.getBookedByEmail().trim()).orElse(null);
            }
            if (requester == null && StringUtils.hasText(saved.getBookedByUsername())) {
                requester = userRepository.findByUsername(saved.getBookedByUsername().trim()).orElse(null);
            }
            if (requester == null) {
                requester = userRepository.findByUsername("admin").orElse(null);
            }
            if (requester == null) {
                requester = userRepository.findAll().stream().findFirst().orElse(null);
            }

            if (requester != null && visitRepository != null) {
                String guestDisplay = StringUtils.hasText(saved.getGuestName())
                        ? saved.getGuestName().trim()
                        : (StringUtils.hasText(saved.getGuestOrganizationName()) ? saved.getGuestOrganizationName().trim() : saved.getBookedByName());

                com.example.coop_vsit_hub.visit_management.enums.VisitType visitEngagementType = saved.getEngagementType() != null
                        ? saved.getEngagementType()
                        : com.example.coop_vsit_hub.visit_management.enums.VisitType.INTERNAL;

                com.example.coop_vsit_hub.visit_management.model.Visit visit = com.example.coop_vsit_hub.visit_management.model.Visit.builder()
                        .visitCode(generateVisitCode())
                        .title(saved.getMeetingTitle())
                        .requestingDepartment(saved.getHostDepartment())
                        .visitType(visitEngagementType)
                        .visitObjective(StringUtils.hasText(saved.getMeetingAgenda()) ? saved.getMeetingAgenda().trim() : ("Boardroom meeting in " + saved.getRoomName()))
                        .priorityLevel(com.example.coop_vsit_hub.visit_management.enums.VisitPriority.MEDIUM)
                        .status(com.example.coop_vsit_hub.visit_management.enums.VisitStatus.SCHEDULED)
                        .locationRoom(saved.getRoomName())
                        .visitorCount(saved.getExpectedAttendees() != null && saved.getExpectedAttendees() > 0 ? saved.getExpectedAttendees() : 1)
                        .guestCategory(StringUtils.hasText(saved.getGuestOrganizationName())
                                ? com.example.coop_vsit_hub.visit_management.enums.GuestCategory.ORGANIZATION
                                : com.example.coop_vsit_hub.visit_management.enums.GuestCategory.INDIVIDUAL)
                        .visitorFirstName(guestDisplay)
                        .requester(requester)
                        .scheduledStartTime(saved.getScheduledStartTime())
                        .scheduledEndTime(saved.getScheduledEndTime())
                        .linkedBookingId(saved.getId())
                        .build();

                com.example.coop_vsit_hub.visit_management.model.Visit savedVisit = visitRepository.saveAndFlush(visit);
                saved.setLinkedVisitId(savedVisit.getId());
                roomBookingRepository.saveAndFlush(saved);
                log.info("Auto-registered linked visit '{}' for room booking '{}'", savedVisit.getVisitCode(), saved.getBookingCode());
            }
        } catch (Exception ex) {
            log.warn("Failed to auto-register linked visit for room booking {}: {}", saved.getBookingCode(), ex.getMessage(), ex);
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

                    // Deduplicate email recipients: each individual receives exactly ONE email per booking
                    java.util.Set<String> alreadyEmailed = new java.util.HashSet<>();

                    // 1. Dispatch booking confirmation to the reserving staff member FIRST
                    if (StringUtils.hasText(saved.getBookedByEmail())) {
                        String bookerEmail = saved.getBookedByEmail().trim().toLowerCase();
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
                                    saved.getHostDepartment(),
                                    saved.getBookedByPhone(),
                                    saved.getRequestedItems()
                            );
                            alreadyEmailed.add(bookerEmail);
                        } catch (Exception e) {
                            log.warn("Failed to send booker confirmation for {}: {}", bookingCode, e.getMessage());
                        }
                    }

                    // 2. Dispatch alert to System Admins (skipping booker if booker is an admin to prevent duplicate emails)
                    List<String> distinctAdminEmails = adminEmails.stream()
                            .filter(StringUtils::hasText)
                            .map(String::trim)
                            .filter(email -> !alreadyEmailed.contains(email.toLowerCase()))
                            .distinct()
                            .toList();

                    log.info("Sending room booking email notification for room '{}' to {} admin(s): {}",
                            saved.getRoomName(), distinctAdminEmails.size(), distinctAdminEmails);

                    for (String aEmail : distinctAdminEmails) {
                        try {
                            emailService.sendRoomBookingAdminNotification(
                                    aEmail,
                                    saved.getRoomName(),
                                    saved.getBookedByName(),
                                    saved.getHostDepartment(),
                                    saved.getBookedByPhone(),
                                    saved.getBookingCode(),
                                    saved.getMeetingTitle(),
                                    saved.getGuestName(),
                                    saved.getGuestOrganizationName(),
                                    saved.getScheduledStartTime(),
                                    saved.getScheduledEndTime(),
                                    saved.getMeetingAgenda(),
                                    saved.getExpectedAttendees(),
                                    saved.getRequestedItems()
                            );
                            alreadyEmailed.add(aEmail.toLowerCase());
                        } catch (Exception e) {
                            log.warn("Failed to send admin room booking email to {} for {}: {}", aEmail, bookingCode, e.getMessage());
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
                        // Skip recipient if they already received an email (booker or admin)
                        if (StringUtils.hasText(deptUser.getEmail()) && alreadyEmailed.contains(deptUser.getEmail().trim().toLowerCase())) {
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
                                        saved.getBookedByPhone(),
                                        saved.getBookingCode(),
                                        saved.getMeetingTitle(),
                                        saved.getGuestName(),
                                        saved.getGuestOrganizationName(),
                                        saved.getScheduledStartTime(),
                                        saved.getScheduledEndTime(),
                                        saved.getMeetingAgenda(),
                                        saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                        saved.getRequestedItems()
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
                                        bookingCode,
                                        false
                                );
                            } catch (Exception e) {
                                log.warn("Failed to send department in-app room booking alert to {} for {}: {}",
                                        deptUser.getUsername(), bookingCode, e.getMessage());
                            }
                        }
                    }

                    // 3. Dispatch notification to designated room Contact / Custodian (e.g. DxValley contact or incubation lead)
                    java.util.Set<String> roomCustodianEmails = new java.util.LinkedHashSet<>();
                    if (roomOpt.isPresent()) {
                        if (StringUtils.hasText(roomOpt.get().getContactEmail())) {
                            roomCustodianEmails.add(roomOpt.get().getContactEmail().trim());
                        }
                        if (roomOpt.get().getAssignedUserId() != null) {
                            userRepository.findById(roomOpt.get().getAssignedUserId())
                                    .map(User::getEmail)
                                    .filter(StringUtils::hasText)
                                    .map(String::trim)
                                    .ifPresent(roomCustodianEmails::add);
                        }
                    }

                    for (String contactEmail : roomCustodianEmails) {
                        log.info("Dispatching room booking notification to designated contact email '{}' for room '{}'",
                                contactEmail, saved.getRoomName());

                        if (emailService != null) {
                            try {
                                emailService.sendRoomBookingContactNotification(
                                        contactEmail,
                                        saved.getRoomName(),
                                        saved.getBookedByName(),
                                        saved.getHostDepartment(),
                                        saved.getBookedByPhone(),
                                        saved.getBookingCode(),
                                        saved.getMeetingTitle(),
                                        saved.getScheduledStartTime(),
                                        saved.getScheduledEndTime(),
                                        saved.getMeetingAgenda(),
                                        saved.getExpectedAttendees() != null ? saved.getExpectedAttendees() : 1,
                                        false,
                                        null,
                                        null,
                                        saved.getRequestedItems()
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

        return roomBookingRepository.findAll(
                RoomBookingSpecification.filterMyBookings(currentUser, cleanRoom, cleanSearch, status),
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

    private boolean isDirector(User user) {
        return user != null && user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_DIRECTOR);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomBookingSlotResponse> getRoomSlots(String roomName, Instant fromDate, Instant toDate) {
        String cleanRoom = (roomName != null && !roomName.isBlank()) ? roomName.trim() : "";
        List<RoomBooking> bookings = roomBookingRepository.findActiveRoomSlots(cleanRoom, fromDate, toDate);
        Set<UUID> linkedVisitIds = bookings.stream()
                .map(RoomBooking::getLinkedVisitId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<RoomBookingSlotResponse> result = new ArrayList<>(bookings.stream()
                .map(b -> RoomBookingSlotResponse.builder()
                        .id(b.getId())
                        .bookingCode(b.getBookingCode())
                        .roomName(b.getRoomName())
                        .meetingTitle(b.getMeetingTitle())
                        .scheduledStartTime(b.getScheduledStartTime())
                        .scheduledEndTime(b.getScheduledEndTime())
                        .bookedByUserId(b.getBookedByUserId())
                        .bookedByName(resolveBookedByName(b))
                        .bookedByEmail(resolveBookedByEmail(b))
                        .bookedByPhone(resolveBookedByPhone(b))
                        .hostDepartment(resolveHostDepartment(b))
                        .expectedAttendees(b.getExpectedAttendees())
                        .meetingAgenda(b.getMeetingAgenda())
                        .requestedItems(b.getRequestedItems())
                        .guestOrganizationName(b.getGuestOrganizationName())
                        .guestName(b.getGuestName())
                        .engagementType(b.getEngagementType() != null ? b.getEngagementType().name() : "INTERNAL")
                        .status(b.getStatus())
                        .build())
                .toList());

        // Also incorporate any visits scheduled for this room that do not have a linked RoomBooking
        if (visitRepository != null) {
            List<com.example.coop_vsit_hub.visit_management.model.Visit> unlinkedVisits = visitRepository
                    .findAllRoomBookingsForAdmin(cleanRoom, fromDate, toDate).stream()
                    .filter(v -> !linkedVisitIds.contains(v.getId()) && v.getLinkedBookingId() == null)
                    .toList();

            for (var v : unlinkedVisits) {
                User host = v.getRequester() != null ? v.getRequester() : v.getSponsor();
                String hostName = host != null && StringUtils.hasText(host.getFullName()) ? host.getFullName().trim() : "Coop Staff Member";
                String hostEmail = host != null ? host.getEmail() : null;
                String hostPhone = host != null ? host.getPhoneNumber() : null;
                String hostDept = host != null && StringUtils.hasText(host.getDepartment()) ? host.getDepartment() : v.getRequestingDepartment();
                String guestDisplay = v.getGuestDisplayName();

                result.add(RoomBookingSlotResponse.builder()
                        .id(v.getId())
                        .bookingCode(v.getVisitCode())
                        .roomName(v.getLocationRoom())
                        .meetingTitle(v.getTitle())
                        .scheduledStartTime(v.getScheduledStartTime())
                        .scheduledEndTime(v.getScheduledEndTime())
                        .bookedByUserId(host != null ? host.getId() : null)
                        .bookedByName(hostName)
                        .bookedByEmail(hostEmail)
                        .bookedByPhone(hostPhone)
                        .hostDepartment(hostDept)
                        .expectedAttendees(v.getVisitorCount())
                        .meetingAgenda(v.getVisitObjective())
                        .guestName(guestDisplay)
                        .guestOrganizationName(v.getGuestCategory() == com.example.coop_vsit_hub.visit_management.enums.GuestCategory.ORGANIZATION ? guestDisplay : null)
                        .engagementType(v.getVisitType() != null ? v.getVisitType().name() : "EXTERNAL")
                        .status(v.getStatus() == com.example.coop_vsit_hub.visit_management.enums.VisitStatus.COMPLETED ? RoomBookingStatus.COMPLETED : RoomBookingStatus.CONFIRMED)
                        .build());
            }
        }

        result.sort(Comparator.comparing(RoomBookingSlotResponse::getScheduledStartTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
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
    public RoomBookingResponse cancelBooking(UUID bookingId, String cancellationReason, User currentUser) {
        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found with ID: " + bookingId));

        if (booking.getStatus() == RoomBookingStatus.CANCELLED) {
            return mapToResponse(booking);
        }

        // Authorization check: Cancellation and editing can ONLY be performed by:
        // 1. The person who booked it
        // 2. The person who is in charge of that space (designated custodian / contact)
        // 3. Super Administrator
        if (!checkCanModifyBooking(booking, currentUser)) {
            throw new AccessDeniedException("Access Denied: Room cancellation and editing can only be performed by the reserving staff member, the person in charge of this room, or a Super Administrator.");
        }

        String reason = StringUtils.hasText(cancellationReason) ? cancellationReason.trim() : "Room reservation cancelled by user.";
        String cancelledByName = currentUser != null && StringUtils.hasText(currentUser.getFullName())
                ? currentUser.getFullName()
                : "Administrator";

        booking.setStatus(RoomBookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledByName(cancelledByName);
        booking.setCancelledAt(Instant.now());
        RoomBooking updated = roomBookingRepository.save(booking);

        if (booking.getLinkedVisitId() != null && visitRepository != null) {
            try {
                visitRepository.findById(booking.getLinkedVisitId()).ifPresent(v -> {
                    v.setStatus(com.example.coop_vsit_hub.visit_management.enums.VisitStatus.CANCELLED);
                    v.setDecisionNotes("Room booking cancelled: " + reason);
                    visitRepository.save(v);
                    log.info("Cancelled linked visit '{}' for room booking '{}'", v.getVisitCode(), booking.getBookingCode());
                });
            } catch (Exception ex) {
                log.warn("Failed to cancel linked visit for room booking {}: {}", booking.getBookingCode(), ex.getMessage());
            }
        }

        // Dispatch notifications on cancellation
        try {
            var roomOpt = StringUtils.hasText(booking.getRoomName())
                    ? meetingRoomRepository.findByNameIgnoreCase(booking.getRoomName().trim())
                    : java.util.Optional.<com.example.coop_vsit_hub.master_data.entity.MeetingRoom>empty();

            boolean isOwner = currentUser != null && (
                    (booking.getBookedByUserId() != null && booking.getBookedByUserId().equals(currentUser.getId())) ||
                    (booking.getBookedByEmail() != null && StringUtils.hasText(currentUser.getEmail()) && booking.getBookedByEmail().equalsIgnoreCase(currentUser.getEmail())) ||
                    (booking.getBookedByUsername() != null && StringUtils.hasText(currentUser.getUsername()) && booking.getBookedByUsername().equalsIgnoreCase(currentUser.getUsername()))
            );

            String dateStr = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneOffset.UTC).format(booking.getScheduledStartTime());
            String timeStr = String.format("%s - %s UTC",
                    DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(booking.getScheduledStartTime()),
                    DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(booking.getScheduledEndTime()));

            // Resolve booker's email and user object comprehensively
            String bookerEmail = booking.getBookedByEmail();
            String bookerName = booking.getBookedByName();

            User bookerUser = null;
            if (booking.getBookedByUserId() != null) {
                bookerUser = userRepository.findById(booking.getBookedByUserId()).orElse(null);
            }
            if (bookerUser == null && StringUtils.hasText(bookerEmail)) {
                bookerUser = userRepository.findByEmailIgnoreCase(bookerEmail.trim()).orElse(null);
            }
            if (bookerUser == null && StringUtils.hasText(booking.getBookedByUsername())) {
                bookerUser = userRepository.findByUsername(booking.getBookedByUsername().trim()).orElse(null);
            }
            if (bookerUser == null && StringUtils.hasText(booking.getBookedByName())) {
                bookerUser = userRepository.findAll().stream()
                        .filter(u -> u.getFullName() != null && u.getFullName().trim().equalsIgnoreCase(booking.getBookedByName().trim()))
                        .findFirst().orElse(null);
            }

            if (bookerUser != null) {
                if (!StringUtils.hasText(bookerEmail)) {
                    bookerEmail = bookerUser.getEmail();
                }
                if (!StringUtils.hasText(bookerName)) {
                    bookerName = bookerUser.getFullName();
                }
            }

            // Fallback: If currentUser is cancelling and booking didn't have email, or currentUser is the owner
            if (!StringUtils.hasText(bookerEmail) && currentUser != null && isOwner) {
                bookerEmail = currentUser.getEmail();
                if (!StringUtils.hasText(bookerName)) {
                    bookerName = currentUser.getFullName();
                }
            }

            // 1. Send Cancellation Email to Booker
            if (StringUtils.hasText(bookerEmail) && emailService != null) {
                log.info("Sending cancellation email to booker '{}' for room '{}', booking '{}', reason: '{}'",
                        bookerEmail, booking.getRoomName(), booking.getBookingCode(), reason);
                try {
                    emailService.sendRoomBookingCancellationNotification(
                            bookerEmail.trim(),
                            StringUtils.hasText(bookerName) ? bookerName.trim() : "Colleague",
                            booking.getRoomName(),
                            StringUtils.hasText(booking.getBookedByName()) ? booking.getBookedByName() : (bookerName != null ? bookerName : "Staff Member"),
                            booking.getBookedByPhone(),
                            booking.getBookingCode(),
                            booking.getMeetingTitle(),
                            booking.getScheduledStartTime(),
                            booking.getScheduledEndTime(),
                            cancelledByName,
                            reason,
                            booking.getRequestedItems()
                    );
                } catch (Exception e) {
                    log.warn("Failed to send cancellation email to booker {} for {}: {}",
                            bookerEmail, booking.getBookingCode(), e.getMessage());
                }
            }

            // 2. Send In-App Notification to Booker
            if (notificationService != null && bookerUser != null) {
                String cancelMsg = String.format(
                        "Your reservation for room '%s' (%s) scheduled for %s (%s) has been cancelled by %s. Reason: %s. Ref: %s.",
                        booking.getRoomName(), booking.getMeetingTitle(), dateStr, timeStr, cancelledByName, reason, booking.getBookingCode()
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

            // 3. Notify the designated room Contact / Custodian (if present)
            java.util.Set<String> cancelCustodianEmails = new java.util.LinkedHashSet<>();
            if (roomOpt.isPresent()) {
                if (StringUtils.hasText(roomOpt.get().getContactEmail())) {
                    cancelCustodianEmails.add(roomOpt.get().getContactEmail().trim());
                }
                if (roomOpt.get().getAssignedUserId() != null) {
                    userRepository.findById(roomOpt.get().getAssignedUserId())
                            .map(User::getEmail)
                            .filter(StringUtils::hasText)
                            .map(String::trim)
                            .ifPresent(cancelCustodianEmails::add);
                }
            }

            for (String contactEmail : cancelCustodianEmails) {
                log.info("Sending cancellation email to room contact '{}' for room '{}', booking '{}'",
                        contactEmail, booking.getRoomName(), booking.getBookingCode());

                if (emailService != null) {
                    try {
                        emailService.sendRoomBookingContactNotification(
                                contactEmail,
                                booking.getRoomName(),
                                booking.getBookedByName(),
                                booking.getHostDepartment(),
                                booking.getBookedByPhone(),
                                booking.getBookingCode(),
                                booking.getMeetingTitle(),
                                booking.getScheduledStartTime(),
                                booking.getScheduledEndTime(),
                                booking.getMeetingAgenda(),
                                booking.getExpectedAttendees(),
                                true,
                                cancelledByName,
                                reason,
                                booking.getRequestedItems()
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send cancellation email to room contact {} for {}: {}",
                                contactEmail, booking.getBookingCode(), e.getMessage());
                    }
                }

                userRepository.findByEmailIgnoreCase(contactEmail).ifPresent(contactUser -> {
                    if (notificationService != null && (currentUser == null || !contactUser.getId().equals(currentUser.getId()))) {
                        String contactMsg = String.format(
                                "The booking for room '%s' (%s) on %s (%s) was cancelled by %s. Reason: %s. Ref: %s.",
                                booking.getRoomName(), booking.getMeetingTitle(), dateStr, timeStr, cancelledByName, reason, booking.getBookingCode()
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
                                booking.getBookedByPhone(),
                                booking.getBookingCode(),
                                booking.getMeetingTitle(),
                                booking.getScheduledStartTime(),
                                booking.getScheduledEndTime(),
                                cancelledByName,
                                reason,
                                booking.getRequestedItems()
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
    @Transactional
    public RoomBookingResponse updateBooking(UUID bookingId, UpdateRoomBookingRequest request, User currentUser) {
        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found with ID: " + bookingId));

        if (booking.getStatus() == RoomBookingStatus.CANCELLED) {
            throw new IllegalStateException("Cannot edit a cancelled reservation.");
        }

        // Authorization: only the person who booked it, the person in charge of that space, or super admin
        if (!checkCanModifyBooking(booking, currentUser)) {
            throw new AccessDeniedException("Access Denied: Room cancellation and editing can only be performed by the reserving staff member, the person in charge of this room, or a Super Administrator.");
        }

        Instant oldStart = booking.getScheduledStartTime();
        Instant oldEnd = booking.getScheduledEndTime();
        Instant newStart = request.getScheduledStartTime() != null ? request.getScheduledStartTime() : booking.getScheduledStartTime();
        Instant newEnd = request.getScheduledEndTime() != null ? request.getScheduledEndTime() : booking.getScheduledEndTime();

        if (newEnd.isBefore(newStart) || newEnd.equals(newStart)) {
            throw new IllegalArgumentException("Scheduled end time must be after start time.");
        }

        // Conflict check: Ensure slot is not already reserved by another booking
        List<RoomBooking> overlapping = roomBookingRepository.findOverlappingBookings(booking.getRoomName(), newStart, newEnd);
        boolean hasConflict = overlapping.stream().anyMatch(b -> !b.getId().equals(booking.getId()));
        if (hasConflict) {
            RoomBooking conflict = overlapping.stream().filter(b -> !b.getId().equals(booking.getId())).findFirst().get();
            String conflictStart = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(DEFAULT_ZONE).format(conflict.getScheduledStartTime());
            String conflictEnd = DateTimeFormatter.ofPattern("hh:mm a (MMM dd)").withZone(DEFAULT_ZONE).format(conflict.getScheduledEndTime());
            throw new IllegalStateException(String.format(
                    "Meeting room '%s' is already booked from %s to %s for '%s' (Ref: %s). Please select an open time slot.",
                    booking.getRoomName(), conflictStart, conflictEnd, conflict.getMeetingTitle(), conflict.getBookingCode()
            ));
        }

        if (StringUtils.hasText(request.getMeetingTitle())) {
            booking.setMeetingTitle(request.getMeetingTitle().trim());
        }
        if (request.getScheduledStartTime() != null) {
            booking.setScheduledStartTime(newStart);
        }
        if (request.getScheduledEndTime() != null) {
            booking.setScheduledEndTime(newEnd);
        }
        if (request.getExpectedAttendees() != null && request.getExpectedAttendees() > 0) {
            booking.setExpectedAttendees(request.getExpectedAttendees());
        }
        if (request.getMeetingAgenda() != null) {
            booking.setMeetingAgenda(request.getMeetingAgenda().trim());
        }
        if (request.getRequestedItems() != null) {
            booking.setRequestedItems(request.getRequestedItems().trim());
        }
        if (request.getGuestName() != null) {
            booking.setGuestName(request.getGuestName().trim());
        }
        if (request.getGuestOrganizationName() != null) {
            booking.setGuestOrganizationName(request.getGuestOrganizationName().trim());
        }
        if (StringUtils.hasText(request.getEngagementType())) {
            try {
                com.example.coop_vsit_hub.visit_management.enums.VisitType et =
                        com.example.coop_vsit_hub.visit_management.enums.VisitType.valueOf(request.getEngagementType().trim().toUpperCase());
                booking.setEngagementType(et);
                if (booking.getLinkedVisitId() != null) {
                    visitRepository.findById(booking.getLinkedVisitId()).ifPresent(v -> {
                        v.setVisitType(et);
                        visitRepository.save(v);
                    });
                }
            } catch (IllegalArgumentException ignored) {}
        }

        RoomBooking updated = roomBookingRepository.save(booking);

        // Dispatch email and in-app notification to the designated room contact/custodian upon reservation update/reschedule
        try {
            var roomOpt = StringUtils.hasText(updated.getRoomName())
                    ? meetingRoomRepository.findByNameIgnoreCase(updated.getRoomName().trim())
                    : java.util.Optional.<MeetingRoom>empty();

            java.util.Set<String> roomCustodianEmails = new java.util.LinkedHashSet<>();
            if (roomOpt.isPresent()) {
                MeetingRoom room = roomOpt.get();
                if (StringUtils.hasText(room.getContactEmail())) {
                    roomCustodianEmails.add(room.getContactEmail().trim());
                }
                if (room.getAssignedUserId() != null) {
                    userRepository.findById(room.getAssignedUserId())
                            .map(User::getEmail)
                            .filter(StringUtils::hasText)
                            .map(String::trim)
                            .ifPresent(roomCustodianEmails::add);
                }
            }

            String updatedByName = currentUser != null && StringUtils.hasText(currentUser.getFullName())
                    ? currentUser.getFullName()
                    : (currentUser != null && StringUtils.hasText(currentUser.getUsername()) ? currentUser.getUsername() : "Staff Member");

            for (String contactEmail : roomCustodianEmails) {
                log.info("Sending reservation update email to designated person '{}' for room '{}', booking '{}'",
                        contactEmail, updated.getRoomName(), updated.getBookingCode());

                if (emailService != null) {
                    try {
                        emailService.sendRoomBookingUpdatedContactNotification(
                                contactEmail,
                                updated.getRoomName(),
                                updated.getBookedByName(),
                                updated.getHostDepartment(),
                                updated.getBookedByPhone(),
                                updated.getBookingCode(),
                                updated.getMeetingTitle(),
                                oldStart,
                                oldEnd,
                                updated.getScheduledStartTime(),
                                updated.getScheduledEndTime(),
                                updated.getMeetingAgenda(),
                                updated.getExpectedAttendees() != null ? updated.getExpectedAttendees() : 1,
                                updatedByName,
                                updated.getRequestedItems()
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send room update notification email to {} for {}: {}",
                                contactEmail, updated.getBookingCode(), e.getMessage());
                    }
                }

                // If designated contact is a registered user, send in-app notification too
                userRepository.findByEmailIgnoreCase(contactEmail).ifPresent(contactUser -> {
                    if (notificationService != null && (currentUser == null || !contactUser.getId().equals(currentUser.getId()))) {
                        String contactMsg = String.format(
                                "The reservation for room '%s' (%s) was updated/rescheduled by %s. Ref: %s.",
                                updated.getRoomName(), updated.getMeetingTitle(), updatedByName, updated.getBookingCode()
                        );
                        try {
                            notificationService.notifyUser(
                                    contactUser,
                                    "Reservation Updated: " + updated.getRoomName(),
                                    contactMsg,
                                    NotificationType.VISIT_APPROVED,
                                    updated.getId(),
                                    updated.getBookingCode(),
                                    false
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send in-app notification to {} for {}: {}",
                                    contactEmail, updated.getBookingCode(), e.getMessage());
                        }
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Failed to dispatch update notifications for booking {}: {}", bookingId, e.getMessage(), e);
        }

        auditLoggerService.logEvent(
                currentUser,
                currentUser != null ? currentUser.getUsername() : "system",
                AuditEventType.ROOM_BOOKING_UPDATED,
                AuditStatus.SUCCESS,
                null,
                null,
                String.format("Room booking '%s' for room '%s' was UPDATED/RESCHEDULED by %s",
                        updated.getBookingCode(), updated.getRoomName(), currentUser != null ? currentUser.getFullName() : "User")
        );

        return mapToResponse(updated);
    }

    private boolean checkCanModifyBooking(RoomBooking booking, User currentUser) {
        if (currentUser == null) {
            return false;
        }
        // 1. Super Admin
        if (isAdmin(currentUser)) {
            return true;
        }

        // 2. The Person who booked it
        boolean isOwner = (booking.getBookedByUserId() != null && currentUser.getId() != null && booking.getBookedByUserId().equals(currentUser.getId()))
                || (StringUtils.hasText(booking.getBookedByEmail()) && StringUtils.hasText(currentUser.getEmail()) && booking.getBookedByEmail().trim().equalsIgnoreCase(currentUser.getEmail().trim()))
                || (StringUtils.hasText(booking.getBookedByUsername()) && StringUtils.hasText(currentUser.getUsername()) && booking.getBookedByUsername().trim().equalsIgnoreCase(currentUser.getUsername().trim()))
                || (StringUtils.hasText(booking.getBookedByName()) && StringUtils.hasText(currentUser.getFullName()) && booking.getBookedByName().trim().equalsIgnoreCase(currentUser.getFullName().trim()));
        if (isOwner) {
            return true;
        }

        // 3. The Person who is in charge of that space
        var roomOpt = meetingRoomRepository.findByNameIgnoreCase(booking.getRoomName());
        if (roomOpt.isPresent()) {
            MeetingRoom room = roomOpt.get();
            boolean isRoomContact = (room.getAssignedUserId() != null && currentUser.getId() != null && room.getAssignedUserId().equals(currentUser.getId()))
                    || (StringUtils.hasText(room.getContactEmail()) && StringUtils.hasText(currentUser.getEmail()) && room.getContactEmail().trim().equalsIgnoreCase(currentUser.getEmail().trim()))
                    || (StringUtils.hasText(room.getAssignedUserName()) && StringUtils.hasText(currentUser.getUsername()) && room.getAssignedUserName().trim().equalsIgnoreCase(currentUser.getUsername().trim()))
                    || (StringUtils.hasText(room.getAssignedUserName()) && StringUtils.hasText(currentUser.getFullName()) && room.getAssignedUserName().trim().equalsIgnoreCase(currentUser.getFullName().trim()));
            if (isRoomContact) {
                return true;
            }
        }

        return false;
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

    private String resolveBookedByName(RoomBooking b) {
        String existing = b.getBookedByName();
        boolean isGenericOrGuest = !StringUtils.hasText(existing)
                || "Coop Staff Member".equalsIgnoreCase(existing.trim())
                || "Staff Member".equalsIgnoreCase(existing.trim())
                || "Bank Staff".equalsIgnoreCase(existing.trim())
                || "staff".equalsIgnoreCase(existing.trim())
                || (StringUtils.hasText(b.getGuestName()) && existing.trim().equalsIgnoreCase(b.getGuestName().trim()));

        if (!isGenericOrGuest) {
            return existing.trim();
        }

        // 1. Try bookedByUserId
        if (b.getBookedByUserId() != null) {
            User u = userRepository.findById(b.getBookedByUserId()).orElse(null);
            if (u != null && StringUtils.hasText(u.getFullName())) {
                return u.getFullName().trim();
            }
        }

        // 2. Try linkedVisitId requester or sponsor
        if (b.getLinkedVisitId() != null && visitRepository != null) {
            var v = visitRepository.findById(b.getLinkedVisitId()).orElse(null);
            if (v != null) {
                if (v.getRequester() != null && StringUtils.hasText(v.getRequester().getFullName())) {
                    return v.getRequester().getFullName().trim();
                }
                if (v.getSponsor() != null && StringUtils.hasText(v.getSponsor().getFullName())) {
                    return v.getSponsor().getFullName().trim();
                }
            }
        }

        // 3. Try bookedByEmail
        if (StringUtils.hasText(b.getBookedByEmail())) {
            User u = userRepository.findByEmailIgnoreCase(b.getBookedByEmail().trim()).orElse(null);
            if (u != null && StringUtils.hasText(u.getFullName())) {
                return u.getFullName().trim();
            }
        }

        // 4. Try bookedByUsername
        if (StringUtils.hasText(b.getBookedByUsername())) {
            User u = userRepository.findByUsername(b.getBookedByUsername().trim()).orElse(null);
            if (u != null && StringUtils.hasText(u.getFullName())) {
                return u.getFullName().trim();
            }
        }

        return StringUtils.hasText(existing) ? existing.trim() : "Coop Staff Member";
    }

    private String resolveBookedByEmail(RoomBooking b) {
        if (StringUtils.hasText(b.getBookedByEmail())) return b.getBookedByEmail().trim();
        if (b.getBookedByUserId() != null) {
            User u = userRepository.findById(b.getBookedByUserId()).orElse(null);
            if (u != null && StringUtils.hasText(u.getEmail())) return u.getEmail().trim();
        }
        if (b.getLinkedVisitId() != null && visitRepository != null) {
            var v = visitRepository.findById(b.getLinkedVisitId()).orElse(null);
            if (v != null && v.getRequester() != null && StringUtils.hasText(v.getRequester().getEmail())) {
                return v.getRequester().getEmail().trim();
            }
        }
        return null;
    }

    private String resolveBookedByPhone(RoomBooking b) {
        if (StringUtils.hasText(b.getBookedByPhone())) return b.getBookedByPhone().trim();
        if (b.getBookedByUserId() != null) {
            User u = userRepository.findById(b.getBookedByUserId()).orElse(null);
            if (u != null && StringUtils.hasText(u.getPhoneNumber())) return u.getPhoneNumber().trim();
        }
        if (b.getLinkedVisitId() != null && visitRepository != null) {
            var v = visitRepository.findById(b.getLinkedVisitId()).orElse(null);
            if (v != null && v.getRequester() != null && StringUtils.hasText(v.getRequester().getPhoneNumber())) {
                return v.getRequester().getPhoneNumber().trim();
            }
        }
        return null;
    }

    private String resolveHostDepartment(RoomBooking b) {
        if (StringUtils.hasText(b.getHostDepartment()) && !"General Facility".equalsIgnoreCase(b.getHostDepartment())) {
            return b.getHostDepartment().trim();
        }
        if (b.getBookedByUserId() != null) {
            User u = userRepository.findById(b.getBookedByUserId()).orElse(null);
            if (u != null && StringUtils.hasText(u.getDepartment())) return u.getDepartment().trim();
        }
        if (b.getLinkedVisitId() != null && visitRepository != null) {
            var v = visitRepository.findById(b.getLinkedVisitId()).orElse(null);
            if (v != null && StringUtils.hasText(v.getRequestingDepartment())) {
                return v.getRequestingDepartment().trim();
            }
        }
        return b.getHostDepartment();
    }

    private RoomBookingResponse mapToResponse(RoomBooking b) {
        var roomOpt = meetingRoomRepository.findByNameIgnoreCase(b.getRoomName());
        UUID roomAssignedUserId = roomOpt.map(MeetingRoom::getAssignedUserId).orElse(null);
        String roomAssignedUserName = roomOpt.map(MeetingRoom::getAssignedUserName).orElse(null);
        String roomContactEmail = roomOpt.map(MeetingRoom::getContactEmail).orElse(null);

        return RoomBookingResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .roomName(b.getRoomName())
                .meetingTitle(b.getMeetingTitle())
                .hostDepartment(resolveHostDepartment(b))
                .bookedByUserId(b.getBookedByUserId())
                .bookedByName(resolveBookedByName(b))
                .bookedByUsername(b.getBookedByUsername())
                .bookedByEmail(resolveBookedByEmail(b))
                .bookedByPhone(resolveBookedByPhone(b))
                .guestOrganizationName(b.getGuestOrganizationName())
                .guestName(b.getGuestName())
                .expectedAttendees(b.getExpectedAttendees())
                .meetingAgenda(b.getMeetingAgenda())
                .requestedItems(b.getRequestedItems())
                .scheduledStartTime(b.getScheduledStartTime())
                .scheduledEndTime(b.getScheduledEndTime())
                .status(b.getStatus())
                .cancellationReason(b.getCancellationReason())
                .cancelledByName(b.getCancelledByName())
                .cancelledAt(b.getCancelledAt())
                .linkedVisitId(b.getLinkedVisitId())
                .roomAssignedUserId(roomAssignedUserId)
                .roomAssignedUserName(roomAssignedUserName)
                .roomContactEmail(roomContactEmail)
                .engagementType(b.getEngagementType() != null ? b.getEngagementType().name() : "INTERNAL")
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private String generateVisitCode() {
        String yearMonth = DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC).format(Instant.now());
        String prefix = "VIS-" + yearMonth + "-";
        long nextNum = visitRepository.countByVisitCodeStartingWith(prefix) + 1;

        String code = String.format("%s%05d", prefix, nextNum);
        while (visitRepository.existsByVisitCode(code)) {
            nextNum++;
            code = String.format("%s%05d", prefix, nextNum);
        }
        return code;
    }
}
