package com.example.coop_vsit_hub.analytics_management.service;

import com.example.coop_vsit_hub.analytics_management.dto.ExecutiveDashboardResponse;
import com.example.coop_vsit_hub.feedback_management.repository.VisitFeedbackRepository;
import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.individual_guest_management.repository.IndividualGuestRepository;
import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.visit_management.repository.OrganizationRepository;
import com.example.coop_vsit_hub.user_and_auth.dto.AuditLogResponse;
import com.example.coop_vsit_hub.user_and_auth.repository.AuditLogRepository;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import com.example.coop_vsit_hub.visit_management.enums.VisitPriority;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final VisitRepository visitRepository;
    private final OrganizationRepository organizationRepository;
    private final IndividualGuestRepository individualGuestRepository;
    private final VisitFeedbackRepository feedbackRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public ExecutiveDashboardResponse getExecutiveDashboard() {
        log.info("Generating comprehensive bank executive analytics dashboard");

        // 1. Financial Pipeline Calculations
        BigDecimal totalPipeline = visitRepository.sumTotalPipelineValue();
        BigDecimal realizedCompleted = visitRepository.sumRealizedCompletedValue();
        BigDecimal activePipeline = visitRepository.sumActivePipelineValue();
        BigDecimal pendingReview = visitRepository.sumPendingReviewValue();

        long totalVisits = visitRepository.count();
        BigDecimal avgDealSize = totalVisits > 0 ?
                totalPipeline.divide(BigDecimal.valueOf(totalVisits), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // 2. Operational Counts & Lifecycle Rates
        long completed = visitRepository.countByStatus(VisitStatus.COMPLETED);
        long approved = visitRepository.countByStatus(VisitStatus.APPROVED);
        long inProgress = visitRepository.countByStatus(VisitStatus.IN_PROGRESS);
        long rejected = visitRepository.countByStatus(VisitStatus.REJECTED);
        long cancelled = visitRepository.countByStatus(VisitStatus.CANCELLED);
        long awaitingApproval = visitRepository.countByStatus(VisitStatus.SUBMITTED) + visitRepository.countByStatus(VisitStatus.UNDER_REVIEW);

        double conversionRate = 0.0;
        long decidedVisits = completed + rejected + cancelled;
        if (decidedVisits > 0) {
            conversionRate = (completed / (double) decidedVisits) * 100.0;
        }

        double approvalRate = 0.0;
        long approvalDecisions = approved + inProgress + completed + rejected;
        if (approvalDecisions > 0) {
            approvalRate = ((approved + inProgress + completed) / (double) approvalDecisions) * 100.0;
        }

        // Calculate average visit duration in minutes for completed visits
        List<Visit> completedVisitsList = visitRepository.findAll().stream()
                .filter(v -> v.getStatus() == VisitStatus.COMPLETED && v.getActualCheckInTime() != null && v.getActualCheckOutTime() != null)
                .toList();

        double avgDurationMinutes = 0.0;
        if (!completedVisitsList.isEmpty()) {
            long totalMinutes = 0;
            for (Visit v : completedVisitsList) {
                totalMinutes += Duration.between(v.getActualCheckInTime(), v.getActualCheckOutTime()).toMinutes();
            }
            avgDurationMinutes = totalMinutes / (double) completedVisitsList.size();
        }

        // 3. Customer Satisfaction (CSAT) & NPS
        long totalSurveys = feedbackRepository.count();
        long completedSurveys = feedbackRepository.countByIsSubmittedTrue();
        double surveyResponseRate = totalSurveys > 0 ? (completedSurveys / (double) totalSurveys) * 100.0 : 0.0;

        Double avgH = feedbackRepository.getAverageHospitalityRating();
        Double avgF = feedbackRepository.getAverageFacilityRating();
        Double avgO = feedbackRepository.getAverageObjectiveRating();

        double hScore = avgH != null ? avgH : 0.0;
        double fScore = avgF != null ? avgF : 0.0;
        double oScore = avgO != null ? avgO : 0.0;
        double overallRatingAvg = (hScore + fScore + oScore) / 3.0;
        double csatPct = (overallRatingAvg / 5.0) * 100.0;

        long promoters = feedbackRepository.countPromoters();
        long detractors = feedbackRepository.countDetractors();
        int nps = 0;
        if (completedSurveys > 0) {
            double pPct = (promoters / (double) completedSurveys) * 100.0;
            double dPct = (detractors / (double) completedSurveys) * 100.0;
            nps = (int) Math.round(pPct - dPct);
        }

        // 4. Partner Organizations & Individual Guests
        long totalOrgs = organizationRepository.count();
        Double avgOrgScore = organizationRepository.getAverageRelationshipScore();
        long totalGuests = individualGuestRepository.count();
        Double avgGuestScore = individualGuestRepository.getAverageRelationshipScore();

        // 5. Multi-Dimensional Distributions
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

        // 6. Top Entities & Recent Activities
        List<OrganizationSummaryResponse> topOrgs = organizationRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "relationshipScore"))
        ).getContent().stream().map(OrganizationSummaryResponse::from).toList();

        List<IndividualGuestSummaryResponse> topGuests = individualGuestRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "relationshipScore"))
        ).getContent().stream().map(IndividualGuestSummaryResponse::from).toList();

        List<VisitSummaryResponse> upcomingVisits = visitRepository.findUpcomingScheduledVisits(Instant.now())
                .stream().map(VisitSummaryResponse::from).toList();

        List<AuditLogResponse> recentAudits = auditLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream().map(AuditLogResponse::from).collect(Collectors.toList());

        return ExecutiveDashboardResponse.builder()
                .totalPipelineValue(totalPipeline)
                .realizedCompletedValue(realizedCompleted)
                .activePipelineValue(activePipeline)
                .pendingReviewValue(pendingReview)
                .averageDealSize(avgDealSize)
                .currency("USD")
                .totalVisitsCount(totalVisits)
                .completedVisitsCount(completed)
                .approvedVisitsCount(approved)
                .inProgressVisitsCount(inProgress)
                .awaitingApprovalCount(awaitingApproval)
                .conversionRatePercentage(Math.round(conversionRate * 10.0) / 10.0)
                .approvalRatePercentage(Math.round(approvalRate * 10.0) / 10.0)
                .averageVisitDurationMinutes(Math.round(avgDurationMinutes * 10.0) / 10.0)
                .csatScorePercentage(Math.round(csatPct * 10.0) / 10.0)
                .netPromoterScore(nps)
                .surveyResponseRatePercentage(Math.round(surveyResponseRate * 10.0) / 10.0)
                .averageHospitalityRating(Math.round(hScore * 10.0) / 10.0)
                .averageFacilityRating(Math.round(fScore * 10.0) / 10.0)
                .averageObjectiveRating(Math.round(oScore * 10.0) / 10.0)
                .totalPartnerOrganizations(totalOrgs)
                .totalIndividualGuests(totalGuests)
                .averageOrganizationRelationshipScore(avgOrgScore != null ? Math.round(avgOrgScore * 10.0) / 10.0 : 0.0)
                .averageIndividualGuestRelationshipScore(avgGuestScore != null ? Math.round(avgGuestScore * 10.0) / 10.0 : 0.0)
                .visitsByStatus(statusMap)
                .visitsByPriority(priorityMap)
                .visitsByDepartment(deptMap)
                .topPartnerOrganizations(topOrgs)
                .topVipGuests(topGuests)
                .upcomingScheduledVisits(upcomingVisits)
                .recentAuditActivities(recentAudits)
                .build();
    }
}
