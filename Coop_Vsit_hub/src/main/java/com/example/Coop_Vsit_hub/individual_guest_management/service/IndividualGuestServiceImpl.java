package com.example.coop_vsit_hub.individual_guest_management.service;

import com.example.coop_vsit_hub.individual_guest_management.dto.*;
import com.example.coop_vsit_hub.individual_guest_management.enums.IdentityDocumentType;
import com.example.coop_vsit_hub.individual_guest_management.enums.VipTier;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import com.example.coop_vsit_hub.individual_guest_management.repository.IndividualGuestRepository;
import com.example.coop_vsit_hub.individual_guest_management.repository.IndividualGuestSpecification;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import com.example.coop_vsit_hub.visit_management.model.Visit;
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
public class IndividualGuestServiceImpl implements IndividualGuestService {

    private final IndividualGuestRepository guestRepository;
    private final VisitRepository visitRepository;
    private final AuditLoggerService auditLoggerService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IndividualGuestSummaryResponse> getAllIndividualGuests(
            String search,
            VipTier vipTier,
            IdentityDocumentType idType,
            String country,
            String affiliation,
            Integer minScore,
            Integer maxScore,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        log.info("Fetching individual guests with search: '{}', vipTier: '{}'", search, vipTier);

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProperty = StringUtils.hasText(sortBy) ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(direction, sortProperty));

        Specification<IndividualGuest> spec = IndividualGuestSpecification.filterGuests(
                search, vipTier, idType, country, affiliation, minScore, maxScore
        );

        Page<IndividualGuest> guestPage = guestRepository.findAll(spec, pageable);
        List<UUID> guestIds = guestPage.getContent().stream().map(IndividualGuest::getId).toList();

        Map<UUID, Long> visitCountMap = new HashMap<>();
        if (!guestIds.isEmpty()) {
            List<Object[]> counts = visitRepository.countVisitsGroupedByMasterIndividualGuestIds(guestIds);
            for (Object[] row : counts) {
                if (row != null && row.length >= 2 && row[0] instanceof UUID gId && row[1] instanceof Long cnt) {
                    visitCountMap.put(gId, cnt);
                }
            }
        }

        Page<IndividualGuestSummaryResponse> dtoPage = guestPage.map(guest -> {
            long totalVisits = visitCountMap.getOrDefault(guest.getId(), 0L);
            return IndividualGuestSummaryResponse.from(guest, totalVisits);
        });

        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public IndividualGuestDetailResponse getIndividualGuestById(UUID id) {
        log.info("Fetching individual guest details for ID: {}", id);

        IndividualGuest guest = guestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Individual guest not found with ID: " + id));

        long totalVisits = visitRepository.countByMasterIndividualGuestId(id);
        BigDecimal pipelineValue = visitRepository.sumOpportunityValueByMasterIndividualGuestId(id);
        List<Visit> pastVisits = visitRepository.findTop10ByMasterIndividualGuestIdOrderByScheduledStartTimeDesc(id);

        List<VisitSummaryResponse> recentVisitDtos = pastVisits.stream()
                .map(VisitSummaryResponse::from)
                .collect(Collectors.toList());

        return IndividualGuestDetailResponse.from(guest, totalVisits, pipelineValue, recentVisitDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public IndividualGuestStatsResponse getIndividualGuestStats() {
        log.info("Calculating individual guest portfolio intelligence metrics");

        long total = guestRepository.count();
        Double avgScore = guestRepository.getAverageRelationshipScore();

        Map<String, Long> vipTierMap = new LinkedHashMap<>();
        for (Object[] row : guestRepository.countGuestsByVipTierGroup()) {
            VipTier tier = (VipTier) row[0];
            Long count = (Long) row[1];
            vipTierMap.put(tier.name(), count);
        }

        Map<String, Long> countryMap = new LinkedHashMap<>();
        for (Object[] row : guestRepository.countGuestsByCountryGroup()) {
            String country = (String) row[0];
            Long count = (Long) row[1];
            countryMap.put(country, count);
        }

        Map<String, Long> idTypeMap = new LinkedHashMap<>();
        for (Object[] row : guestRepository.countGuestsByIdTypeGroup()) {
            IdentityDocumentType idType = (IdentityDocumentType) row[0];
            Long count = (Long) row[1];
            idTypeMap.put(idType.name(), count);
        }

        return IndividualGuestStatsResponse.builder()
                .totalIndividualGuests(total)
                .averageRelationshipScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .guestsByVipTier(vipTierMap)
                .guestsByCountry(countryMap)
                .guestsByIdType(idTypeMap)
                .build();
    }

    @Override
    @Transactional
    public IndividualGuestDetailResponse createIndividualGuest(CreateIndividualGuestRequest request, String createdBy) {
        log.info("Registering individual guest: '{} {}' by user '{}'", request.getFirstName(), request.getLastName(), createdBy);

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : null;
        if (email != null && guestRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An individual guest with email '" + email + "' is already registered.");
        }

        String phone = StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null;
        if (phone != null && guestRepository.existsByPhoneNumber(phone)) {
            throw new IllegalArgumentException("An individual guest with phone number '" + phone + "' is already registered.");
        }

        IndividualGuest guest = IndividualGuest.builder()
                .firstName(request.getFirstName().trim())
                .middleName(StringUtils.hasText(request.getMiddleName()) ? request.getMiddleName().trim() : null)
                .lastName(request.getLastName().trim())
                .email(email)
                .phoneNumber(phone)
                .idNumber(StringUtils.hasText(request.getIdNumber()) ? request.getIdNumber().trim() : null)
                .idType(request.getIdType() != null ? request.getIdType() : IdentityDocumentType.NATIONAL_ID)
                .guestTitle(StringUtils.hasText(request.getGuestTitle()) ? request.getGuestTitle().trim() : null)
                .organizationAffiliation(StringUtils.hasText(request.getOrganizationAffiliation()) ? request.getOrganizationAffiliation().trim() : null)
                .countryOfResidence(StringUtils.hasText(request.getCountryOfResidence()) ? request.getCountryOfResidence().trim() : "Ethiopia")
                .vipTier(request.getVipTier() != null ? request.getVipTier() : VipTier.STANDARD)
                .relationshipScore(request.getRelationshipScore() != null ? request.getRelationshipScore() : 50)
                .notes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null)
                .build();

        IndividualGuest saved = guestRepository.save(guest);

        auditLoggerService.logEvent(
                null,
                createdBy,
                AuditEventType.GUEST_CREATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "GUEST_MODULE",
                String.format("Individual VIP guest '%s' (%s) registered by '%s'", saved.getFullName(), saved.getEmail(), createdBy)
        );

        return IndividualGuestDetailResponse.from(saved, 0, BigDecimal.ZERO, List.of());
    }

    @Override
    @Transactional
    public IndividualGuestDetailResponse updateIndividualGuest(UUID id, UpdateIndividualGuestRequest request, String updatedBy) {
        log.info("Updating individual guest ID: {} by user '{}'", id, updatedBy);

        IndividualGuest guest = guestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Individual guest not found with ID: " + id));

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : null;
        if (email != null && guestRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new IllegalArgumentException("Another individual guest with email '" + email + "' already exists.");
        }

        String phone = StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null;
        if (phone != null && guestRepository.existsByPhoneNumberAndIdNot(phone, id)) {
            throw new IllegalArgumentException("Another individual guest with phone number '" + phone + "' already exists.");
        }

        guest.setFirstName(request.getFirstName().trim());
        guest.setMiddleName(StringUtils.hasText(request.getMiddleName()) ? request.getMiddleName().trim() : null);
        guest.setLastName(request.getLastName().trim());
        guest.setEmail(email);
        guest.setPhoneNumber(phone);
        guest.setIdNumber(StringUtils.hasText(request.getIdNumber()) ? request.getIdNumber().trim() : null);
        guest.setIdType(request.getIdType() != null ? request.getIdType() : IdentityDocumentType.NATIONAL_ID);
        guest.setGuestTitle(StringUtils.hasText(request.getGuestTitle()) ? request.getGuestTitle().trim() : null);
        guest.setOrganizationAffiliation(StringUtils.hasText(request.getOrganizationAffiliation()) ? request.getOrganizationAffiliation().trim() : null);
        guest.setCountryOfResidence(StringUtils.hasText(request.getCountryOfResidence()) ? request.getCountryOfResidence().trim() : "Ethiopia");
        guest.setVipTier(request.getVipTier() != null ? request.getVipTier() : VipTier.STANDARD);
        guest.setRelationshipScore(request.getRelationshipScore() != null ? request.getRelationshipScore() : 50);
        guest.setNotes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null);

        IndividualGuest saved = guestRepository.save(guest);

        auditLoggerService.logEvent(
                null,
                updatedBy,
                AuditEventType.GUEST_UPDATED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "GUEST_MODULE",
                String.format("Individual VIP guest '%s' profile updated by '%s'", saved.getFullName(), updatedBy)
        );

        long totalVisits = visitRepository.countByMasterIndividualGuestId(id);
        BigDecimal pipelineValue = visitRepository.sumOpportunityValueByMasterIndividualGuestId(id);
        List<Visit> pastVisits = visitRepository.findTop10ByMasterIndividualGuestIdOrderByScheduledStartTimeDesc(id);

        List<VisitSummaryResponse> recentVisitDtos = pastVisits.stream()
                .map(VisitSummaryResponse::from)
                .collect(Collectors.toList());

        return IndividualGuestDetailResponse.from(saved, totalVisits, pipelineValue, recentVisitDtos);
    }

    @Override
    @Transactional
    public void deleteIndividualGuest(UUID id, String deletedBy) {
        log.info("Deleting individual guest ID: {} by user '{}'", id, deletedBy);

        IndividualGuest guest = guestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Individual guest not found with ID: " + id));

        long visitCount = visitRepository.countByMasterIndividualGuestId(id);
        if (visitCount > 0) {
            throw new IllegalArgumentException(String.format(
                    "Cannot delete guest '%s'. They are linked to %d active or past visit records.",
                    guest.getFullName(), visitCount
            ));
        }

        guestRepository.delete(guest);

        auditLoggerService.logEvent(
                null,
                deletedBy,
                AuditEventType.GUEST_DELETED,
                AuditStatus.SUCCESS,
                "SYSTEM",
                "GUEST_MODULE",
                String.format("Individual VIP guest '%s' was deleted by '%s'", guest.getFullName(), deletedBy)
        );
    }
}
