package com.example.coop_vsit_hub.visit_management.service;

import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.visit_management.dto.*;
import com.example.coop_vsit_hub.visit_management.enums.GuestCategory;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.enums.VisitType;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.OrganizationRepository;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
import com.example.coop_vsit_hub.visit_management.repository.VisitSpecification;
import com.example.coop_vsit_hub.feedback_management.service.FeedbackService;
import com.example.coop_vsit_hub.feedback_management.service.FeedbackServiceImpl;
import com.example.coop_vsit_hub.individual_guest_management.repository.IndividualGuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitServiceImpl implements VisitService {

    private final VisitRepository visitRepository;
    private final OrganizationRepository organizationRepository;
    private final IndividualGuestRepository individualGuestRepository;
    private final UserRepository userRepository;
    private final AuditLoggerService auditLoggerService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private FeedbackService feedbackService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.coop_vsit_hub.notification_management.service.NotificationService notificationService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.coop_vsit_hub.user_and_auth.service.EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${coopbank.app.admin-email:}")
    private String configuredAdminEmail;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VisitSummaryResponse> getAllVisits(
            String search,
            VisitStatus status,
            VisitPriority priority,
            VisitType visitType,
            GuestCategory guestCategory,
            String department,
            String locationRoom,
            UUID requesterId,
            UUID sponsorId,
            UUID approverId,
            Instant fromDate,
            Instant toDate,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        log.info("Searching visits with status={}, priority={}, dept={}, room={}, page={}, size={}",
                status, priority, department, locationRoom, page, size);

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortProperty = (sortBy != null && !sortBy.isBlank()) ? sortBy : "scheduledStartTime";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

        Specification<Visit> spec = VisitSpecification.filterVisits(
                search, status, priority, visitType, guestCategory, department, locationRoom,
                requesterId, sponsorId, approverId, fromDate, toDate
        );

        Page<Visit> visitPage = visitRepository.findAll(spec, pageable);
        Page<VisitSummaryResponse> dtoPage = visitPage.map(VisitSummaryResponse::from);

        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitDetailResponse getVisitById(UUID id) {
        log.info("Fetching visit details for ID: {}", id);
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse fbDto = null;
        if (feedbackService != null) {
            try {
                fbDto = feedbackService.getFeedbackByVisitId(id);
            } catch (Exception ignored) {}
        }
        return VisitDetailResponse.from(visit, fbDto);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitDetailResponse getVisitByCode(String visitCode) {
        log.info("Fetching visit details for code: {}", visitCode);
        Visit visit = visitRepository.findByVisitCode(visitCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with Code: " + visitCode));

        com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse fbDto = null;
        if (feedbackService != null) {
            try {
                fbDto = feedbackService.getFeedbackByVisitId(visit.getId());
            } catch (Exception ignored) {}
        }
        return VisitDetailResponse.from(visit, fbDto);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitStatsResponse getVisitStatistics() {
        log.info("Computing executive visit statistics and pipeline aggregates");

        long total = visitRepository.count();
        BigDecimal pipelineValue = visitRepository.sumActivePipelineValue();
        long inProgress = visitRepository.countByStatus(VisitStatus.IN_PROGRESS);
        long completed = visitRepository.countByStatus(VisitStatus.COMPLETED);
        long awaitingApproval = visitRepository.countByStatus(VisitStatus.SUBMITTED) + visitRepository.countByStatus(VisitStatus.UNDER_REVIEW);
        long upcoming = visitRepository.findUpcomingScheduledVisits(Instant.now()).size();

        Map<String, Long> statusMap = new LinkedHashMap<>();
        for (Object[] row : visitRepository.countVisitsByStatusGroup()) {
            VisitStatus s = (VisitStatus) row[0];
            Long count = (Long) row[1];
            statusMap.put(s.name(), count);
        }

        Map<String, Long> priorityMap = new LinkedHashMap<>();
        for (Object[] row : visitRepository.countVisitsByPriorityGroup()) {
            VisitPriority p = (VisitPriority) row[0];
            Long count = (Long) row[1];
            priorityMap.put(p.name(), count);
        }

        Map<String, Long> deptMap = new LinkedHashMap<>();
        for (Object[] row : visitRepository.countVisitsByDepartmentGroup()) {
            String dept = (String) row[0];
            Long count = (Long) row[1];
            deptMap.put(dept, count);
        }

        return VisitStatsResponse.builder()
                .totalVisits(total)
                .activePipelineValue(pipelineValue)
                .pipelineCurrency("USD")
                .upcomingScheduledVisitsCount(upcoming)
                .inProgressVisitsCount(inProgress)
                .completedVisitsCount(completed)
                .awaitingApprovalCount(awaitingApproval)
                .visitsByStatus(statusMap)
                .visitsByPriority(priorityMap)
                .visitsByDepartment(deptMap)
                .build();
    }

    @Override
    @Transactional
    public VisitDetailResponse createVisit(CreateVisitRequest request, String requesterUsername) {
        log.info("Creating new visit request by user '{}'", requesterUsername);

        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new IllegalArgumentException("Requester user not found: " + requesterUsername));

        validateSchedule(request.getScheduledStartTime(), request.getScheduledEndTime());

        if (StringUtils.hasText(request.getLocationRoom()) && request.getScheduledStartTime() != null && request.getScheduledEndTime() != null) {
            validateRoomConflict(request.getLocationRoom(), request.getScheduledStartTime(), request.getScheduledEndTime(), null);
        }

        com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest indGuest = null;
        if (request.getIndividualGuestId() != null) {
            indGuest = individualGuestRepository.findById(request.getIndividualGuestId()).orElse(null);
        }

        User sponsor = null;
        if (request.getSponsorId() != null) {
            sponsor = userRepository.findById(request.getSponsorId()).orElse(null);
        }

        String visitCode = generateVisitCode();
        // Direct scheduling without approval gate
        VisitStatus initialStatus = Boolean.TRUE.equals(request.getIsDraft()) 
                ? VisitStatus.DRAFT 
                : VisitStatus.SCHEDULED;

        String fName = StringUtils.hasText(request.getIndividualGuestFirstName()) ? request.getIndividualGuestFirstName().trim() : null;
        String mName = StringUtils.hasText(request.getIndividualGuestMiddleName()) ? request.getIndividualGuestMiddleName().trim() : null;
        String lName = StringUtils.hasText(request.getIndividualGuestLastName()) 
                ? request.getIndividualGuestLastName().trim() 
                : (StringUtils.hasText(request.getIndividualGuestSurname()) ? request.getIndividualGuestSurname().trim() : null);
        String email = StringUtils.hasText(request.getIndividualGuestEmail()) ? request.getIndividualGuestEmail().trim().toLowerCase() : null;
        String phone = StringUtils.hasText(request.getIndividualGuestPhone()) ? request.getIndividualGuestPhone().trim() : null;
        String title = StringUtils.hasText(request.getIndividualGuestTitle()) ? request.getIndividualGuestTitle().trim() : null;
        String idNum = StringUtils.hasText(request.getIndividualGuestIdNumber()) ? request.getIndividualGuestIdNumber().trim() : null;

        if (indGuest != null) {
            if (!StringUtils.hasText(fName)) fName = indGuest.getFirstName();
            if (!StringUtils.hasText(mName)) mName = indGuest.getMiddleName();
            if (!StringUtils.hasText(lName)) lName = indGuest.getLastName();
            if (!StringUtils.hasText(email)) email = indGuest.getEmail();
            if (!StringUtils.hasText(phone)) phone = indGuest.getPhoneNumber();
            if (!StringUtils.hasText(title)) title = indGuest.getGuestTitle();
            if (!StringUtils.hasText(idNum)) idNum = indGuest.getIdNumber();
        }

        Organization guestOrg = null;
        if (request.getGuestOrganizationId() != null) {
            guestOrg = organizationRepository.findById(request.getGuestOrganizationId()).orElse(null);
        } else if (StringUtils.hasText(request.getOrganizationName())) {
            String orgName = request.getOrganizationName().trim();
            final String visitorContact = (StringUtils.hasText(fName) ? fName : "") + (StringUtils.hasText(lName) ? " " + lName : "");
            final String visitorPhone = phone;
            final String visitorEmail = email;

            guestOrg = organizationRepository.findByNameIgnoreCase(orgName)
                    .orElseGet(() -> {
                        String orgContact = StringUtils.hasText(request.getOrganizationContactPerson())
                                ? request.getOrganizationContactPerson().trim()
                                : (StringUtils.hasText(visitorContact.trim()) ? visitorContact.trim() : null);

                        String orgPhone = StringUtils.hasText(request.getOrganizationPhone())
                                ? request.getOrganizationPhone().trim()
                                : (StringUtils.hasText(visitorPhone) ? visitorPhone.trim() : null);

                        String orgEmail = StringUtils.hasText(request.getOrganizationEmail())
                                ? request.getOrganizationEmail().trim().toLowerCase()
                                : (StringUtils.hasText(visitorEmail) ? visitorEmail.trim().toLowerCase() : null);

                        String orgSector = StringUtils.hasText(request.getOrganizationSector())
                                ? request.getOrganizationSector().trim()
                                : null;

                        return organizationRepository.save(Organization.builder()
                                .name(orgName)
                                .category("Partner Organization")
                                .marketCountry("Ethiopia")
                                .relationshipScore(85)
                                .contactPersonName(orgContact)
                                .contactPhone(orgPhone)
                                .contactEmail(orgEmail)
                                .industrySector(orgSector)
                                .build());
                    });
        } else if (StringUtils.hasText(fName)) {
            String searchLast = StringUtils.hasText(lName) ? lName : (StringUtils.hasText(mName) ? mName : fName);
            
            // 1. Check existing guest by Phone
            if (StringUtils.hasText(phone)) {
                indGuest = individualGuestRepository.findFirstByPhoneNumber(phone.trim()).orElse(null);
            }
            // 2. Check existing guest by Email
            if (indGuest == null && StringUtils.hasText(email)) {
                indGuest = individualGuestRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
            }
            // 3. Check existing guest by Name + Phone
            if (indGuest == null && StringUtils.hasText(phone)) {
                indGuest = individualGuestRepository
                        .findByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneNumber(fName, searchLast, phone)
                        .orElse(null);
            }

            // 4. If not found in individual guests register, auto-create new IndividualGuest
            if (indGuest == null) {
                String safeEmail = StringUtils.hasText(email) ? email.trim().toLowerCase() : null;
                if (safeEmail != null && individualGuestRepository.existsByEmailIgnoreCase(safeEmail)) {
                    safeEmail = null;
                }
                if (safeEmail == null) {
                    String cleanPhone = StringUtils.hasText(phone) ? phone.replaceAll("[^0-9]", "") : "";
                    String candidateEmail = (cleanPhone.length() >= 6 ? cleanPhone : UUID.randomUUID().toString().substring(0, 8)) + "@guest.coopbank.com.et";
                    if (individualGuestRepository.existsByEmailIgnoreCase(candidateEmail)) {
                        candidateEmail = UUID.randomUUID().toString().substring(0, 8) + "." + candidateEmail;
                    }
                    safeEmail = candidateEmail;
                }

                com.example.coop_vsit_hub.individual_guest_management.enums.VipTier tier = com.example.coop_vsit_hub.individual_guest_management.enums.VipTier.STANDARD;
                if (request.getGuestTier() != null) {
                    String gt = request.getGuestTier().toUpperCase();
                    if (gt.contains("VVIP")) tier = com.example.coop_vsit_hub.individual_guest_management.enums.VipTier.VIP_TIER_1;
                    else if (gt.contains("VIP")) tier = com.example.coop_vsit_hub.individual_guest_management.enums.VipTier.VIP_TIER_2;
                }

                com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType docType = com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType.NATIONAL_ID;
                if (request.getIdType() != null) {
                    String it = request.getIdType().toUpperCase();
                    if (it.contains("PASSPORT")) docType = com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType.PASSPORT;
                    else if (it.contains("DRIVER") || it.contains("LICENSE")) docType = com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType.DRIVER_LICENSE;
                    else if (it.contains("DIPLOMAT")) docType = com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType.DIPLOMATIC_ID;
                }

                indGuest = individualGuestRepository.save(com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest.builder()
                        .firstName(fName)
                        .middleName(mName)
                        .lastName(searchLast)
                        .phoneNumber(phone)
                        .email(safeEmail)
                        .idNumber(idNum)
                        .idType(docType)
                        .vipTier(tier)
                        .organizationAffiliation(guestOrg != null ? guestOrg.getName() : request.getOrganizationName())
                        .countryOfResidence(StringUtils.hasText(request.getCitizenship()) ? request.getCitizenship().trim() : "Ethiopia")
                        .relationshipScore(50)
                        .build());
                log.info("Auto-registered new individual guest into master directory: {} {} (ID: {})", fName, searchLast, indGuest.getId());
            }
        }

        String visitTitle = StringUtils.hasText(request.getTitle()) 
                ? request.getTitle().trim() 
                : (guestOrg != null ? "Executive Visit - " + guestOrg.getName() : "Guest Delegation Visit");

        String department = StringUtils.hasText(request.getRequestingDepartment()) 
                ? request.getRequestingDepartment().trim() 
                : (requester.getDepartment() != null ? requester.getDepartment() : "General Reception");

        String objective = StringUtils.hasText(request.getVisitObjective()) 
                ? request.getVisitObjective().trim() 
                : "Executive meeting and facilities tour";

        Instant startTime = request.getScheduledStartTime() != null ? request.getScheduledStartTime() : Instant.now();
        Instant endTime = request.getScheduledEndTime() != null ? request.getScheduledEndTime() : startTime.plus(java.time.Duration.ofHours(2));

        GuestCategory category = request.getGuestCategory() != null 
                ? request.getGuestCategory() 
                : (guestOrg != null ? GuestCategory.ORGANIZATION : GuestCategory.INDIVIDUAL);

        Visit visit = Visit.builder()
                .visitCode(visitCode)
                .title(visitTitle)
                .requestingDepartment(department)
                .visitType(request.getVisitType() != null ? request.getVisitType() : VisitType.EXTERNAL)
                .visitObjective(objective)
                .expectedOutcome(request.getExpectedOutcome() != null ? request.getExpectedOutcome().trim() : null)
                .priorityLevel(request.getPriorityLevel() != null ? request.getPriorityLevel() : VisitPriority.MEDIUM)
                .status(initialStatus)
                .opportunityValue(request.getOpportunityValue() != null ? request.getOpportunityValue() : BigDecimal.ZERO)
                .currency(StringUtils.hasText(request.getCurrency()) ? request.getCurrency().trim().toUpperCase() : "USD")
                .presentationTheme(request.getPresentationTheme() != null ? request.getPresentationTheme().trim() : null)
                .sensitiveTopics(request.getSensitiveTopics() != null ? request.getSensitiveTopics().trim() : null)
                .locationRoom(request.getLocationRoom() != null ? request.getLocationRoom().trim() : null)
                .visitorCount(request.getVisitorCount() != null && request.getVisitorCount() > 0 ? request.getVisitorCount() : 1)
                .guestCategory(category)
                .guestOrganization(guestOrg)
                .masterIndividualGuest(indGuest)
                .individualGuestFirstName(fName)
                .individualGuestMiddleName(mName)
                .individualGuestLastName(lName)
                .individualGuestEmail(email)
                .individualGuestPhone(phone)
                .individualGuestTitle(title)
                .individualGuestIdNumber(idNum)
                // Front Desk Visitor Demographics matching Reference Image
                .visitorFirstName(fName)
                .visitorMiddleName(mName)
                .visitorSurname(lName)
                .visitorIdNumber(idNum)
                .visitorPhone(phone)
                .visitorEmail(email)
                .visitorDateOfBirth(request.getDateOfBirth())
                .visitorIssuedDate(request.getIssuedDate())
                .visitorExpiredDate(request.getExpiredDate())
                .visitorGender(request.getGender() != null ? request.getGender().trim() : "Male")
                .visitorCitizenship(StringUtils.hasText(request.getCitizenship()) ? request.getCitizenship().trim() : "Ethiopian")
                .visitorRegion(request.getRegion())
                .visitorZone(request.getZone())
                .visitorWoreda(request.getWoreda())
                .visitorIdType(StringUtils.hasText(request.getIdType()) ? request.getIdType().trim() : "National ID")
                .requester(requester)
                .sponsor(sponsor)
                .scheduledStartTime(startTime)
                .scheduledEndTime(endTime)
                .linkedBookingId(request.getLinkedBookingId())
                .guestTier(StringUtils.hasText(request.getGuestTier()) ? request.getGuestTier().trim() : "NORMAL_GUEST")
                .build();

        Visit saved = visitRepository.save(visit);

        // If SUBMITTED, notify approvers
        if (notificationService != null && saved.getStatus() == VisitStatus.SUBMITTED) {
            try {
                notificationService.notifyVisitRequested(saved);
            } catch (Exception e) {
                log.warn("Failed to dispatch visit request notification for '{}': {}", saved.getVisitCode(), e.getMessage());
            }
        }

        // If a meeting room is reserved for this visit, instantly notify Super Admins via email & in-app
        if (StringUtils.hasText(saved.getLocationRoom())) {
            try {
                String dateStr = saved.getScheduledStartTime() != null 
                        ? DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneOffset.UTC).format(saved.getScheduledStartTime())
                        : "N/A";
                String timeStr = (saved.getScheduledStartTime() != null && saved.getScheduledEndTime() != null)
                        ? String.format("%s - %s UTC", 
                            DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(saved.getScheduledStartTime()),
                            DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC).format(saved.getScheduledEndTime()))
                        : "N/A";

                String adminMessage = String.format(
                        "Staff member %s (%s, Dept: %s) has reserved meeting room '%s' on %s (%s) for '%s' (Visit Code: %s).",
                        requester.getFullName(),
                        requester.getEmail(),
                        requester.getDepartment() != null ? requester.getDepartment() : "General",
                        saved.getLocationRoom(),
                        dateStr,
                        timeStr,
                        saved.getTitle(),
                        saved.getVisitCode()
                );

                if (notificationService != null) {
                    notificationService.notifyRoles(
                            List.of(com.example.coop_vsit_hub.user_and_auth.enums.RoleName.ROLE_ADMIN),
                            "Room Booking Confirmed: " + saved.getLocationRoom(),
                            adminMessage,
                            com.example.coop_vsit_hub.notification_management.enums.NotificationType.VISIT_APPROVED,
                            saved.getId(),
                            saved.getVisitCode(),
                            true // send email via SMTP/MailHog
                    );
                }

                if (emailService != null) {
                    List<String> adminEmails = new ArrayList<>(userRepository.findAll().stream()
                            .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == com.example.coop_vsit_hub.user_and_auth.enums.RoleName.ROLE_ADMIN || r.getName().name().contains("ADMIN")))
                            .map(com.example.coop_vsit_hub.user_and_auth.model.User::getEmail)
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
                            saved.getLocationRoom(), adminEmails.size(), adminEmails);

                    for (String aEmail : adminEmails) {
                        emailService.sendRoomBookingAdminNotification(
                                aEmail,
                                saved.getLocationRoom(),
                                requester.getFullName(),
                                requester.getDepartment(),
                                saved.getVisitCode(),
                                saved.getTitle(),
                                saved.getGuestDisplayName(),
                                saved.getGuestOrganization() != null ? saved.getGuestOrganization().getName() : null,
                                saved.getScheduledStartTime(),
                                saved.getScheduledEndTime(),
                                saved.getVisitObjective(),
                                saved.getVisitorCount()
                        );
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to dispatch admin notification for room reservation: {}", e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                requester,
                requester.getUsername(),
                AuditEventType.VISIT_CREATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "VISIT_MODULE",
                String.format("Visit created with code '%s' and status '%s'", saved.getVisitCode(), saved.getStatus())
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public VisitDetailResponse updateVisit(UUID id, UpdateVisitRequest request, String requesterUsername) {
        log.info("Updating visit ID: {} by user: {}", id, requesterUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        if (visit.getStatus() != VisitStatus.DRAFT && visit.getStatus() != VisitStatus.SUBMITTED) {
            throw new IllegalArgumentException("Visit cannot be modified once it is in status: " + visit.getStatus());
        }

        validateSchedule(request.getScheduledStartTime(), request.getScheduledEndTime());

        if (StringUtils.hasText(request.getLocationRoom()) && request.getScheduledStartTime() != null && request.getScheduledEndTime() != null) {
            validateRoomConflict(request.getLocationRoom(), request.getScheduledStartTime(), request.getScheduledEndTime(), id);
        }

        Organization guestOrg = null;
        if (request.getGuestCategory() == GuestCategory.ORGANIZATION) {
            if (request.getGuestOrganizationId() == null) {
                throw new IllegalArgumentException("Guest organization ID is required when guestCategory is ORGANIZATION.");
            }
            guestOrg = organizationRepository.findById(request.getGuestOrganizationId())
                    .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + request.getGuestOrganizationId()));
        }

        com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest indGuest = null;
        if (request.getIndividualGuestId() != null) {
            indGuest = individualGuestRepository.findById(request.getIndividualGuestId())
                    .orElseThrow(() -> new IllegalArgumentException("Individual guest not found with ID: " + request.getIndividualGuestId()));
        }

        User sponsor = null;
        if (request.getSponsorId() != null) {
            sponsor = userRepository.findById(request.getSponsorId())
                    .orElseThrow(() -> new IllegalArgumentException("Sponsor user not found with ID: " + request.getSponsorId()));
        }

        visit.setTitle(request.getTitle().trim());
        visit.setRequestingDepartment(request.getRequestingDepartment().trim());
        visit.setVisitType(request.getVisitType());
        visit.setVisitObjective(request.getVisitObjective().trim());
        visit.setExpectedOutcome(request.getExpectedOutcome() != null ? request.getExpectedOutcome().trim() : null);
        visit.setPriorityLevel(request.getPriorityLevel());
        visit.setOpportunityValue(request.getOpportunityValue() != null ? request.getOpportunityValue() : BigDecimal.ZERO);
        visit.setCurrency(StringUtils.hasText(request.getCurrency()) ? request.getCurrency().trim().toUpperCase() : "USD");
        visit.setPresentationTheme(request.getPresentationTheme() != null ? request.getPresentationTheme().trim() : null);
        visit.setSensitiveTopics(request.getSensitiveTopics() != null ? request.getSensitiveTopics().trim() : null);
        visit.setLocationRoom(request.getLocationRoom() != null ? request.getLocationRoom().trim() : null);
        visit.setVisitorCount(request.getVisitorCount() != null && request.getVisitorCount() > 0 ? request.getVisitorCount() : 1);
        visit.setGuestCategory(request.getGuestCategory());
        visit.setGuestOrganization(guestOrg);
        visit.setMasterIndividualGuest(indGuest);
        visit.setIndividualGuestFirstName(request.getIndividualGuestFirstName() != null ? request.getIndividualGuestFirstName().trim() : null);
        visit.setIndividualGuestMiddleName(request.getIndividualGuestMiddleName() != null ? request.getIndividualGuestMiddleName().trim() : null);
        visit.setIndividualGuestLastName(request.getIndividualGuestLastName() != null ? request.getIndividualGuestLastName().trim() : null);
        visit.setIndividualGuestEmail(request.getIndividualGuestEmail() != null ? request.getIndividualGuestEmail().trim().toLowerCase() : null);
        visit.setIndividualGuestPhone(request.getIndividualGuestPhone() != null ? request.getIndividualGuestPhone().trim() : null);
        visit.setIndividualGuestTitle(request.getIndividualGuestTitle() != null ? request.getIndividualGuestTitle().trim() : null);
        visit.setIndividualGuestIdNumber(request.getIndividualGuestIdNumber() != null ? request.getIndividualGuestIdNumber().trim() : null);
        visit.setSponsor(sponsor);
        visit.setScheduledStartTime(request.getScheduledStartTime());
        visit.setScheduledEndTime(request.getScheduledEndTime());

        Visit saved = visitRepository.save(visit);

        auditLoggerService.logEvent(
                null,
                requesterUsername,
                AuditEventType.VISIT_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "VISIT_MODULE",
                String.format("Visit '%s' details updated by '%s'", saved.getVisitCode(), requesterUsername)
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public VisitDetailResponse transitionVisitStatus(UUID id, VisitStatusTransitionRequest request, String approverUsername) {
        log.info("Transitioning status for visit ID: {} to: {} by user: {}", id, request.getStatus(), approverUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        User approver = userRepository.findByUsername(approverUsername)
                .orElse(null);

        VisitStatus current = visit.getStatus();
        VisitStatus target = request.getStatus();

        // State Machine validation rules
        if (target == VisitStatus.APPROVED) {
            if (current != VisitStatus.SUBMITTED && current != VisitStatus.UNDER_REVIEW) {
                throw new IllegalArgumentException(String.format("Cannot approve visit currently in '%s' status.", current));
            }
            visit.setApprover(approver);
        } else if (target == VisitStatus.REJECTED) {
            if (current != VisitStatus.SUBMITTED && current != VisitStatus.UNDER_REVIEW) {
                throw new IllegalArgumentException(String.format("Cannot reject visit currently in '%s' status.", current));
            }
            visit.setApprover(approver);
        } else if (target == VisitStatus.CANCELLED) {
            if (current == VisitStatus.COMPLETED || current == VisitStatus.IN_PROGRESS) {
                throw new IllegalArgumentException(String.format("Cannot cancel visit that is already '%s'.", current));
            }
        }

        visit.setStatus(target);
        if (StringUtils.hasText(request.getDecisionNotes())) {
            visit.setDecisionNotes(request.getDecisionNotes().trim());
        }

        Visit saved = visitRepository.save(visit);

        if (notificationService != null) {
            try {
                notificationService.notifyVisitStatusTransition(saved, current, target, request.getDecisionNotes());
            } catch (Exception e) {
                log.warn("Failed to dispatch status transition notification for '{}': {}", saved.getVisitCode(), e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                approver,
                approverUsername,
                AuditEventType.VISIT_STATUS_CHANGED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "VISIT_MODULE",
                String.format("Visit '%s' status transitioned from '%s' to '%s' by '%s'",
                        saved.getVisitCode(), current, target, approverUsername)
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public VisitDetailResponse checkInVisitor(UUID id, CheckInRequest request, String securityUsername) {
        log.info("Security desk check-in for visit ID: {} by user: {}", id, securityUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        if (visit.getStatus() != VisitStatus.APPROVED && visit.getStatus() != VisitStatus.SCHEDULED && visit.getStatus() != VisitStatus.IN_PROGRESS) {
            throw new IllegalArgumentException(String.format("Cannot check-in visitor. Visit must be APPROVED or SCHEDULED, but is currently '%s'.", visit.getStatus()));
        }

        // Generate badge number if not already assigned
        String badgeNumber = request.getCustomBadgeNumber();
        if (!StringUtils.hasText(badgeNumber)) {
            badgeNumber = StringUtils.hasText(visit.getVisitorBadgeNumber()) ? visit.getVisitorBadgeNumber() : generateBadgeNumber();
        }

        visit.setVisitorBadgeNumber(badgeNumber);
        visit.setActualCheckInTime(Instant.now());
        visit.setStatus(VisitStatus.IN_PROGRESS);

        if (StringUtils.hasText(request.getVerifiedIdNumber())) {
            visit.setIndividualGuestIdNumber(request.getVerifiedIdNumber().trim());
        }

        Visit saved = visitRepository.save(visit);

        if (notificationService != null) {
            try {
                notificationService.notifyVisitorCheckedIn(saved);
            } catch (Exception e) {
                log.warn("Failed to dispatch visitor check-in notification for '{}': {}", saved.getVisitCode(), e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                null,
                securityUsername,
                AuditEventType.VISITOR_CHECKED_IN,
                AuditStatus.SUCCESS,
                "SECURITY_DESK",
                "FRONT_DESK_PANEL",
                String.format("Visitor checked in for visit '%s' with badge '%s' by security staff '%s'",
                        saved.getVisitCode(), badgeNumber, securityUsername)
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public VisitDetailResponse checkOutVisitor(UUID id, CheckOutRequest request, String securityUsername) {
        log.info("Security desk check-out for visit ID: {} by user: {}", id, securityUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        if (visit.getStatus() != VisitStatus.IN_PROGRESS) {
            throw new IllegalArgumentException(String.format("Cannot check-out visitor. Visit is not currently IN_PROGRESS (current status: '%s').", visit.getStatus()));
        }

        visit.setActualCheckOutTime(Instant.now());
        visit.setStatus(VisitStatus.COMPLETED);

        Visit saved = visitRepository.save(visit);

        if (feedbackService != null) {
            try {
                feedbackService.createAndSendFeedbackInvitation(saved);
            } catch (Exception e) {
                log.warn("Failed to dispatch survey email for completed visit '{}': {}", saved.getVisitCode(), e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                null,
                securityUsername,
                AuditEventType.VISITOR_CHECKED_OUT,
                AuditStatus.SUCCESS,
                "SECURITY_DESK",
                "FRONT_DESK_PANEL",
                String.format("Visitor checked out for visit '%s' by security staff '%s'",
                        saved.getVisitCode(), securityUsername)
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public void deleteVisit(UUID id, String authenticatedUsername) {
        log.info("Deleting visit ID: {} by user: {}", id, authenticatedUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        if (visit.getStatus() == VisitStatus.IN_PROGRESS || visit.getStatus() == VisitStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot delete a visit that is ongoing or already completed.");
        }

        visitRepository.delete(visit);

        auditLoggerService.logEvent(
                null,
                authenticatedUsername,
                AuditEventType.VISIT_DELETED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "VISIT_MODULE",
                String.format("Visit '%s' was deleted by '%s'", visit.getVisitCode(), authenticatedUsername)
        );
    }

    @Override
    @Transactional
    public VisitDetailResponse bookPublicVisit(PublicBookingRequest request) {
        log.info("Processing public customer visit booking: '{}' by guest '{}'", request.getTitle(), request.getContactEmail());

        validateSchedule(request.getPreferredStartTime(), request.getPreferredEndTime());

        // Resolve default bank system requester
        User systemRequester = userRepository.findByUsername("admin")
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("No staff users available to handle incoming public visit requests.")));

        Organization guestOrg = null;
        if (request.getGuestCategory() == GuestCategory.ORGANIZATION && StringUtils.hasText(request.getOrganizationName())) {
            String orgName = request.getOrganizationName().trim();
            guestOrg = organizationRepository.findByName(orgName).orElseGet(() -> {
                Organization newOrg = Organization.builder()
                        .name(orgName)
                        .category("Enterprise Customers")
                        .marketCountry("Ethiopia")
                        .contactPersonName(request.getContactPersonFirstName() + " " + request.getContactPersonLastName())
                        .contactEmail(request.getContactEmail().trim().toLowerCase())
                        .contactPhone(request.getContactPhone().trim())
                        .notes("Auto-registered via Public Customer Visit Booking portal.")
                        .build();
                return organizationRepository.save(newOrg);
            });
        }

        String visitCode = generateVisitCode();
        String dept = StringUtils.hasText(request.getRequestedDepartment()) ? request.getRequestedDepartment().trim() : "General Management & Public Relations";

        Visit visit = Visit.builder()
                .visitCode(visitCode)
                .title(request.getTitle().trim())
                .requestingDepartment(dept)
                .visitType(VisitType.EXTERNAL)
                .visitObjective(request.getVisitObjective().trim())
                .expectedOutcome(StringUtils.hasText(request.getAdditionalNotes()) ? request.getAdditionalNotes().trim() : null)
                .priorityLevel(VisitPriority.MEDIUM)
                .status(VisitStatus.SUBMITTED)
                .opportunityValue(BigDecimal.ZERO)
                .currency("USD")
                .visitorCount(request.getVisitorCount() != null && request.getVisitorCount() > 0 ? request.getVisitorCount() : 1)
                .guestCategory(request.getGuestCategory())
                .guestOrganization(guestOrg)
                .individualGuestFirstName(request.getContactPersonFirstName().trim())
                .individualGuestMiddleName(StringUtils.hasText(request.getContactPersonMiddleName()) ? request.getContactPersonMiddleName().trim() : null)
                .individualGuestLastName(request.getContactPersonLastName().trim())
                .individualGuestEmail(request.getContactEmail().trim().toLowerCase())
                .individualGuestPhone(request.getContactPhone().trim())
                .individualGuestTitle(StringUtils.hasText(request.getGuestTitle()) ? request.getGuestTitle().trim() : null)
                .requester(systemRequester)
                .scheduledStartTime(request.getPreferredStartTime())
                .scheduledEndTime(request.getPreferredEndTime())
                .build();

        Visit saved = visitRepository.save(visit);

        if (notificationService != null) {
            try {
                notificationService.notifyVisitRequested(saved);
            } catch (Exception e) {
                log.warn("Failed to dispatch public visit booking notification for '{}': {}", saved.getVisitCode(), e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                systemRequester,
                "PUBLIC_GUEST (" + request.getContactEmail() + ")",
                AuditEventType.VISIT_CREATED,
                AuditStatus.SUCCESS,
                "PUBLIC_PORTAL",
                "VISIT_MODULE",
                String.format("Public customer visit booking submitted with code '%s' for '%s'", saved.getVisitCode(), saved.getGuestDisplayName())
        );

        return VisitDetailResponse.from(saved);
    }

    @Override
    @Transactional
    public VisitDetailResponse updateVisitorDetails(UUID id, UpdateVisitorDetailsRequest request, String securityUsername) {
        log.info("Updating visitor demographic details for visit ID: {} by user: {}", id, securityUsername);

        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + id));

        if (request.getFirstName() != null) visit.setVisitorFirstName(request.getFirstName().trim());
        if (request.getMiddleName() != null) visit.setVisitorMiddleName(request.getMiddleName().trim());
        if (request.getSurname() != null) visit.setVisitorSurname(request.getSurname().trim());
        if (request.getIdNumber() != null) visit.setVisitorIdNumber(request.getIdNumber().trim());
        if (request.getPhone() != null) visit.setVisitorPhone(request.getPhone().trim());
        if (request.getEmail() != null) visit.setVisitorEmail(request.getEmail().trim().toLowerCase());
        if (request.getDateOfBirth() != null) visit.setVisitorDateOfBirth(request.getDateOfBirth());
        if (request.getIssuedDate() != null) visit.setVisitorIssuedDate(request.getIssuedDate());
        if (request.getExpiredDate() != null) visit.setVisitorExpiredDate(request.getExpiredDate());
        if (request.getGender() != null) visit.setVisitorGender(request.getGender());
        if (request.getCitizenship() != null) visit.setVisitorCitizenship(request.getCitizenship().trim());
        if (request.getRegion() != null) visit.setVisitorRegion(request.getRegion().trim());
        if (request.getZone() != null) visit.setVisitorZone(request.getZone().trim());
        if (request.getWoreda() != null) visit.setVisitorWoreda(request.getWoreda().trim());
        if (request.getIdType() != null) visit.setVisitorIdType(request.getIdType().trim());
        if (request.getIdPhotoUrl() != null) visit.setVisitorIdPhotoUrl(request.getIdPhotoUrl());

        Visit saved = visitRepository.save(visit);

        auditLoggerService.logEvent(
                null,
                securityUsername,
                AuditEventType.VISIT_CREATED,
                AuditStatus.SUCCESS,
                "FRONT_DESK",
                "VISIT_MODULE",
                String.format("Visitor demographics updated for visit '%s' (%s)", saved.getVisitCode(), saved.getGuestDisplayName())
        );

        return VisitDetailResponse.from(saved);
    }

    private void validateSchedule(Instant start, Instant end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new IllegalArgumentException("Scheduled end time must be strictly after scheduled start time.");
        }
    }

    private void validateRoomConflict(String room, Instant start, Instant end, UUID excludeId) {
        List<Visit> conflicts = visitRepository.findOverlappingRoomVisits(room, start, end, excludeId);
        if (!conflicts.isEmpty()) {
            Visit conflicting = conflicts.get(0);
            throw new IllegalArgumentException(String.format(
                    "Room Conflict: '%s' is already booked for visit '%s' (%s) between %s and %s.",
                    room, conflicting.getVisitCode(), conflicting.getTitle(),
                    conflicting.getScheduledStartTime(), conflicting.getScheduledEndTime()
            ));
        }
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

    private String generateBadgeNumber() {
        String yearMonth = DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC).format(Instant.now());
        String prefix = "COOPV" + yearMonth;
        long nextNum = visitRepository.countByVisitorBadgeNumberStartingWith(prefix) + 1;

        String badge = String.format("%s%04d", prefix, nextNum);
        while (visitRepository.existsByVisitorBadgeNumber(badge)) {
            nextNum++;
            badge = String.format("%s%04d", prefix, nextNum);
        }
        return badge;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomSlotResponse> getRoomAvailabilitySlots(String roomName, Instant fromDate, Instant toDate) {
        if (roomName == null || roomName.isBlank()) {
            return Collections.emptyList();
        }
        Instant start = fromDate != null ? fromDate : Instant.now().minus(java.time.Duration.ofDays(7));
        Instant end = toDate != null ? toDate : Instant.now().plus(java.time.Duration.ofDays(60));

        List<Visit> visits = visitRepository.findActiveRoomVisitsInWindow(roomName.trim(), start, end);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC);

        return visits.stream().map(v -> {
            String date = v.getScheduledStartTime() != null ? dateFmt.format(v.getScheduledStartTime()) : "";
            String timeFormatted = "";
            if (v.getScheduledStartTime() != null && v.getScheduledEndTime() != null) {
                timeFormatted = String.format("%s - %s", timeFmt.format(v.getScheduledStartTime()), timeFmt.format(v.getScheduledEndTime()));
            }
            return RoomSlotResponse.builder()
                    .roomName(v.getLocationRoom())
                    .startTime(v.getScheduledStartTime())
                    .endTime(v.getScheduledEndTime())
                    .date(date)
                    .timeFormatted(timeFormatted)
                    .booked(true)
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminRoomBookingResponse> getAdminRoomBookings(String roomName, Instant fromDate, Instant toDate) {
        String cleanRoom = (roomName != null && !roomName.isBlank()) ? roomName.trim() : null;
        List<Visit> visits = visitRepository.findAllRoomBookingsForAdmin(cleanRoom, fromDate, toDate);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneOffset.UTC);

        return visits.stream().map(v -> {
            String date = v.getScheduledStartTime() != null ? dateFmt.format(v.getScheduledStartTime()) : "";
            String timeRange = "";
            if (v.getScheduledStartTime() != null && v.getScheduledEndTime() != null) {
                timeRange = String.format("%s - %s", timeFmt.format(v.getScheduledStartTime()), timeFmt.format(v.getScheduledEndTime()));
            }

            User host = v.getRequester();
            return AdminRoomBookingResponse.builder()
                    .visitId(v.getId())
                    .visitCode(v.getVisitCode())
                    .roomName(v.getLocationRoom())
                    .scheduledStartTime(v.getScheduledStartTime())
                    .scheduledEndTime(v.getScheduledEndTime())
                    .date(date)
                    .timeRange(timeRange)
                    .title(v.getTitle())
                    .purpose(v.getVisitObjective())
                    .guestDisplayName(v.getGuestDisplayName())
                    .visitorCount(v.getVisitorCount())
                    .status(v.getStatus() != null ? v.getStatus().name() : "")
                    .bookedById(host != null ? host.getId() : null)
                    .bookedByName(host != null ? host.getFullName() : "N/A")
                    .bookedByEmail(host != null ? host.getEmail() : "N/A")
                    .bookedByDepartment(host != null ? host.getDepartment() : v.getRequestingDepartment())
                    .bookedByPhone(host != null ? host.getPhoneNumber() : "N/A")
                    .build();
        }).toList();
    }
}
