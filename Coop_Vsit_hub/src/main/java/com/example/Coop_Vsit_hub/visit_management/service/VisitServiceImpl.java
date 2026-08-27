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
        return VisitDetailResponse.from(visit);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitDetailResponse getVisitByCode(String visitCode) {
        log.info("Fetching visit details for code: {}", visitCode);
        Visit visit = visitRepository.findByVisitCode(visitCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with Code: " + visitCode));
        return VisitDetailResponse.from(visit);
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

        String visitCode = generateVisitCode();
        VisitStatus initialStatus = Boolean.TRUE.equals(request.getIsDraft()) ? VisitStatus.DRAFT : VisitStatus.SUBMITTED;

        String fName = request.getIndividualGuestFirstName();
        String mName = request.getIndividualGuestMiddleName();
        String lName = request.getIndividualGuestLastName();
        String email = request.getIndividualGuestEmail();
        String phone = request.getIndividualGuestPhone();
        String title = request.getIndividualGuestTitle();
        String idNum = request.getIndividualGuestIdNumber();

        if (indGuest != null) {
            if (!StringUtils.hasText(fName)) fName = indGuest.getFirstName();
            if (!StringUtils.hasText(mName)) mName = indGuest.getMiddleName();
            if (!StringUtils.hasText(lName)) lName = indGuest.getLastName();
            if (!StringUtils.hasText(email)) email = indGuest.getEmail();
            if (!StringUtils.hasText(phone)) phone = indGuest.getPhoneNumber();
            if (!StringUtils.hasText(title)) title = indGuest.getGuestTitle();
            if (!StringUtils.hasText(idNum)) idNum = indGuest.getIdNumber();
        }

        Visit visit = Visit.builder()
                .visitCode(visitCode)
                .title(request.getTitle().trim())
                .requestingDepartment(request.getRequestingDepartment().trim())
                .visitType(request.getVisitType() != null ? request.getVisitType() : VisitType.EXTERNAL)
                .visitObjective(request.getVisitObjective().trim())
                .expectedOutcome(request.getExpectedOutcome() != null ? request.getExpectedOutcome().trim() : null)
                .priorityLevel(request.getPriorityLevel() != null ? request.getPriorityLevel() : VisitPriority.MEDIUM)
                .status(initialStatus)
                .opportunityValue(request.getOpportunityValue() != null ? request.getOpportunityValue() : BigDecimal.ZERO)
                .currency(StringUtils.hasText(request.getCurrency()) ? request.getCurrency().trim().toUpperCase() : "USD")
                .presentationTheme(request.getPresentationTheme() != null ? request.getPresentationTheme().trim() : null)
                .sensitiveTopics(request.getSensitiveTopics() != null ? request.getSensitiveTopics().trim() : null)
                .locationRoom(request.getLocationRoom() != null ? request.getLocationRoom().trim() : null)
                .visitorCount(request.getVisitorCount() != null && request.getVisitorCount() > 0 ? request.getVisitorCount() : 1)
                .guestCategory(request.getGuestCategory())
                .guestOrganization(guestOrg)
                .masterIndividualGuest(indGuest)
                .individualGuestFirstName(fName != null ? fName.trim() : null)
                .individualGuestMiddleName(mName != null ? mName.trim() : null)
                .individualGuestLastName(lName != null ? lName.trim() : null)
                .individualGuestEmail(email != null ? email.trim().toLowerCase() : null)
                .individualGuestPhone(phone != null ? phone.trim() : null)
                .individualGuestTitle(title != null ? title.trim() : null)
                .individualGuestIdNumber(idNum != null ? idNum.trim() : null)
                .requester(requester)
                .sponsor(sponsor)
                .scheduledStartTime(request.getScheduledStartTime())
                .scheduledEndTime(request.getScheduledEndTime())
                .build();

        Visit saved = visitRepository.save(visit);

        if (notificationService != null && saved.getStatus() == VisitStatus.SUBMITTED) {
            try {
                notificationService.notifyVisitRequested(saved);
            } catch (Exception e) {
                log.warn("Failed to dispatch visit request notification for '{}': {}", saved.getVisitCode(), e.getMessage());
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
}
