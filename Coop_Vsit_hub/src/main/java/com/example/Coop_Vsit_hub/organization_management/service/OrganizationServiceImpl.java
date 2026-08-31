package com.example.coop_vsit_hub.organization_management.service;

import com.example.coop_vsit_hub.organization_management.dto.*;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.OrganizationRepository;
import com.example.coop_vsit_hub.visit_management.repository.OrganizationSpecification;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
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
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final VisitRepository visitRepository;
    private final AuditLoggerService auditLoggerService;
    private final com.example.coop_vsit_hub.feedback_management.repository.VisitFeedbackRepository feedbackRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrganizationSummaryResponse> getAllOrganizations(
            String search,
            String category,
            String marketCountry,
            String industrySector,
            Integer minScore,
            Integer maxScore,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        log.info("Fetching organizations with search: '{}', category: '{}', sector: '{}'", search, category, industrySector);

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProperty = StringUtils.hasText(sortBy) ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(direction, sortProperty));

        Specification<Organization> spec = OrganizationSpecification.filterOrganizations(
                search, category, marketCountry, industrySector, minScore, maxScore
        );

        Page<Organization> orgPage = organizationRepository.findAll(spec, pageable);
        List<UUID> orgIds = orgPage.getContent().stream().map(Organization::getId).toList();

        Map<UUID, Long> visitCountMap = new HashMap<>();
        if (!orgIds.isEmpty()) {
            List<Object[]> counts = visitRepository.countVisitsGroupedByGuestOrganizationIds(orgIds);
            for (Object[] row : counts) {
                if (row != null && row.length >= 2 && row[0] instanceof UUID oId && row[1] instanceof Long cnt) {
                    visitCountMap.put(oId, cnt);
                }
            }
        }

        Page<OrganizationSummaryResponse> dtoPage = orgPage.map(org -> {
            long totalVisits = visitCountMap.getOrDefault(org.getId(), 0L);
            return OrganizationSummaryResponse.from(org, totalVisits);
        });

        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationDetailResponse getOrganizationById(UUID id) {
        log.info("Fetching organization details for ID: {}", id);

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));

        long totalVisits = visitRepository.countByGuestOrganizationId(id);
        BigDecimal pipelineValue = visitRepository.sumOpportunityValueByGuestOrganizationId(id);
        List<Visit> recentVisitEntities = visitRepository.findTop10ByGuestOrganizationIdOrderByScheduledStartTimeDesc(id);

        List<VisitSummaryResponse> recentVisits = recentVisitEntities.stream()
                .map(VisitSummaryResponse::from)
                .collect(Collectors.toList());

        List<com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse> recentFeedbacks = feedbackRepository != null
                ? feedbackRepository.findByVisit_GuestOrganization_IdAndIsSubmittedTrueOrderBySubmittedAtDesc(id)
                        .stream()
                        .map(com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse::from)
                        .collect(Collectors.toList())
                : List.of();

        return OrganizationDetailResponse.from(org, totalVisits, pipelineValue, recentVisits, recentFeedbacks);
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationPortfolioStatsResponse getPortfolioStatistics() {
        log.info("Computing organization portfolio metrics and sector breakdowns");

        long total = organizationRepository.count();
        Double avgScore = organizationRepository.getAverageRelationshipScore();

        Map<String, Long> categoryMap = new LinkedHashMap<>();
        for (Object[] row : organizationRepository.countOrganizationsByCategory()) {
            String cat = (String) row[0];
            Long count = (Long) row[1];
            categoryMap.put(cat, count);
        }

        Map<String, Long> countryMap = new LinkedHashMap<>();
        for (Object[] row : organizationRepository.countOrganizationsByCountry()) {
            String country = (String) row[0];
            Long count = (Long) row[1];
            countryMap.put(country, count);
        }

        Map<String, Long> sectorMap = new LinkedHashMap<>();
        for (Object[] row : organizationRepository.countOrganizationsByIndustrySector()) {
            String sector = (String) row[0];
            Long count = (Long) row[1];
            sectorMap.put(sector, count);
        }

        return OrganizationPortfolioStatsResponse.builder()
                .totalOrganizations(total)
                .averageRelationshipScore(Math.round((avgScore != null ? avgScore : 0.0) * 10.0) / 10.0)
                .organizationsByCategory(categoryMap)
                .organizationsByCountry(countryMap)
                .organizationsByIndustry(sectorMap)
                .build();
    }

    @Override
    @Transactional
    public OrganizationDetailResponse createOrganization(CreateOrganizationRequest request, String authenticatedUsername) {
        log.info("Registering new guest organization '{}' by user '{}'", request.getName(), authenticatedUsername);

        String trimmedName = request.getName().trim();
        if (organizationRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException(String.format("An organization with name '%s' is already registered.", trimmedName));
        }

        String phone = StringUtils.hasText(request.getContactPhone()) ? request.getContactPhone().trim() : null;
        if (phone != null && organizationRepository.existsByContactPhone(phone)) {
            throw new IllegalArgumentException(String.format("An organization with phone number '%s' is already registered.", phone));
        }

        String email = StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail().trim().toLowerCase() : null;
        if (email != null && organizationRepository.existsByContactEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(String.format("An organization with email '%s' is already registered.", email));
        }

        String contactPerson = StringUtils.hasText(request.getContactPersonName())
                ? request.getContactPersonName().trim()
                : (StringUtils.hasText(request.getPrimaryContactPerson()) ? request.getPrimaryContactPerson().trim() : null);

        Organization org = Organization.builder()
                .name(trimmedName)
                .category(StringUtils.hasText(request.getCategory()) ? request.getCategory().trim() : "Partner Organization")
                .marketCountry(StringUtils.hasText(request.getMarketCountry()) ? request.getMarketCountry().trim() : "Ethiopia")
                .relationshipScore(request.getRelationshipScore() != null ? request.getRelationshipScore() : 85)
                .contactPersonName(contactPerson)
                .contactEmail(email)
                .contactPhone(phone)
                .website(StringUtils.hasText(request.getWebsite()) ? request.getWebsite().trim() : null)
                .industrySector(StringUtils.hasText(request.getIndustrySector()) ? request.getIndustrySector().trim() : null)
                .notes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null)
                .build();

        Organization saved = organizationRepository.save(org);

        auditLoggerService.logEvent(
                null,
                authenticatedUsername,
                AuditEventType.ORGANIZATION_CREATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ORGANIZATION_MODULE",
                String.format("Registered new partner organization '%s'", saved.getName())
        );

        return OrganizationDetailResponse.from(saved, 0, BigDecimal.ZERO, List.of());
    }

    @Override
    @Transactional
    public OrganizationDetailResponse updateOrganization(UUID id, UpdateOrganizationRequest request, String authenticatedUsername) {
        log.info("Updating organization ID: {} by user: {}", id, authenticatedUsername);

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));

        String trimmedName = request.getName().trim();
        if (organizationRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new IllegalArgumentException(String.format("Another organization with name '%s' already exists.", trimmedName));
        }

        String phone = StringUtils.hasText(request.getContactPhone()) ? request.getContactPhone().trim() : null;
        if (phone != null && organizationRepository.existsByContactPhoneAndIdNot(phone, id)) {
            throw new IllegalArgumentException(String.format("Another organization with phone number '%s' is already registered.", phone));
        }

        String email = StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail().trim().toLowerCase() : null;
        if (email != null && organizationRepository.existsByContactEmailIgnoreCaseAndIdNot(email, id)) {
            throw new IllegalArgumentException(String.format("Another organization with email '%s' is already registered.", email));
        }

        org.setName(trimmedName);
        if (StringUtils.hasText(request.getCategory())) {
            org.setCategory(request.getCategory().trim());
        }
        if (StringUtils.hasText(request.getMarketCountry())) {
            org.setMarketCountry(request.getMarketCountry().trim());
        }
        if (request.getRelationshipScore() != null) {
            org.setRelationshipScore(request.getRelationshipScore());
        }
        org.setContactPersonName(StringUtils.hasText(request.getContactPersonName()) ? request.getContactPersonName().trim() : null);
        org.setContactEmail(email);
        org.setContactPhone(phone);
        org.setWebsite(StringUtils.hasText(request.getWebsite()) ? request.getWebsite().trim() : null);
        org.setIndustrySector(StringUtils.hasText(request.getIndustrySector()) ? request.getIndustrySector().trim() : null);
        org.setNotes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null);

        Organization saved = organizationRepository.save(org);

        auditLoggerService.logEvent(
                null,
                authenticatedUsername,
                AuditEventType.ORGANIZATION_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ORGANIZATION_MODULE",
                String.format("Updated partner organization '%s' (Relationship score: %d)", saved.getName(), saved.getRelationshipScore())
        );

        long totalVisits = visitRepository.countByGuestOrganizationId(id);
        BigDecimal pipelineValue = visitRepository.sumOpportunityValueByGuestOrganizationId(id);
        List<Visit> recentVisitEntities = visitRepository.findTop10ByGuestOrganizationIdOrderByScheduledStartTimeDesc(id);
        List<VisitSummaryResponse> recentVisits = recentVisitEntities.stream().map(VisitSummaryResponse::from).collect(Collectors.toList());

        return OrganizationDetailResponse.from(saved, totalVisits, pipelineValue, recentVisits);
    }

    @Override
    @Transactional
    public void deleteOrganization(UUID id, String authenticatedUsername) {
        log.info("Deleting organization ID: {} by user: {}", id, authenticatedUsername);

        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + id));

        long visitCount = visitRepository.countByGuestOrganizationId(id);
        if (visitCount > 0) {
            throw new IllegalArgumentException(String.format(
                    "Cannot delete organization '%s' because it is linked to %d existing visit records. Consider updating its details or archiving it instead.",
                    org.getName(), visitCount
            ));
        }

        organizationRepository.delete(org);

        auditLoggerService.logEvent(
                null,
                authenticatedUsername,
                AuditEventType.ORGANIZATION_DELETED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "ORGANIZATION_MODULE",
                String.format("Deleted partner organization '%s'", org.getName())
        );
    }
}
