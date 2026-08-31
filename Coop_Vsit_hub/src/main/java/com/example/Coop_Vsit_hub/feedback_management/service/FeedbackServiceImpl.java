package com.example.coop_vsit_hub.feedback_management.service;

import com.example.coop_vsit_hub.feedback_management.dto.FeedbackAnalyticsResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackDetailResponse;
import com.example.coop_vsit_hub.feedback_management.dto.FeedbackVerifyResponse;
import com.example.coop_vsit_hub.feedback_management.dto.SubmitFeedbackRequest;
import com.example.coop_vsit_hub.feedback_management.model.VisitFeedback;
import com.example.coop_vsit_hub.feedback_management.repository.VisitFeedbackRepository;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditEventType;
import com.example.coop_vsit_hub.user_and_auth.enums.AuditStatus;
import com.example.coop_vsit_hub.user_and_auth.service.AuditLoggerService;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackServiceImpl implements FeedbackService {

    private final VisitFeedbackRepository feedbackRepository;
    private final VisitRepository visitRepository;
    private final AuditLoggerService auditLoggerService;
    private final JavaMailSender mailSender;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.coop_vsit_hub.notification_management.service.NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @Value("${spring.mail.from:feedback@coopbank.com.et}")
    private String senderEmail;

    @Override
    @Transactional(readOnly = true)
    public FeedbackVerifyResponse verifyFeedbackToken(String token) {
        log.info("Verifying feedback survey token: {}", token);

        if (!StringUtils.hasText(token)) {
            return FeedbackVerifyResponse.builder()
                    .valid(false)
                    .message("Survey token is missing.")
                    .build();
        }

        VisitFeedback feedback = feedbackRepository.findBySurveyToken(token.trim())
                .orElse(null);

        if (feedback == null) {
            return FeedbackVerifyResponse.builder()
                    .valid(false)
                    .message("Invalid or non-existent survey link.")
                    .build();
        }

        if (feedback.isSubmitted()) {
            return FeedbackVerifyResponse.builder()
                    .valid(false)
                    .alreadySubmitted(true)
                    .visitId(feedback.getVisit().getId())
                    .visitCode(feedback.getVisit().getVisitCode())
                    .visitTitle(feedback.getVisit().getTitle())
                    .guestDisplayName(feedback.getVisit().getGuestDisplayName())
                    .message("This survey has already been completed. Thank you for your feedback!")
                    .build();
        }

        if (feedback.isExpired()) {
            return FeedbackVerifyResponse.builder()
                    .valid(false)
                    .expired(true)
                    .visitId(feedback.getVisit().getId())
                    .visitCode(feedback.getVisit().getVisitCode())
                    .visitTitle(feedback.getVisit().getTitle())
                    .guestDisplayName(feedback.getVisit().getGuestDisplayName())
                    .message("This feedback survey link has expired (valid for 14 days post-visit).")
                    .build();
        }

        return FeedbackVerifyResponse.builder()
                .valid(true)
                .visitId(feedback.getVisit().getId())
                .visitCode(feedback.getVisit().getVisitCode())
                .visitTitle(feedback.getVisit().getTitle())
                .guestDisplayName(feedback.getVisit().getGuestDisplayName())
                .visitDate(feedback.getVisit().getScheduledStartTime())
                .alreadySubmitted(false)
                .expired(false)
                .message("Token verified successfully. Welcome to CoopBank Guest Feedback!")
                .build();
    }

    @Override
    @Transactional
    public FeedbackDetailResponse submitFeedback(SubmitFeedbackRequest request) {
        log.info("Submitting visitor survey with token: {}", request.getToken());

        VisitFeedback feedback = feedbackRepository.findBySurveyToken(request.getToken().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid survey token."));

        if (feedback.isSubmitted()) {
            throw new IllegalArgumentException("This feedback survey has already been submitted.");
        }

        if (feedback.isExpired()) {
            throw new IllegalArgumentException("This survey invitation link has expired.");
        }

        feedback.setHospitalityRating(request.getHospitalityRating());
        feedback.setFacilityRating(request.getFacilityRating());
        feedback.setObjectiveRating(request.getObjectiveRating());
        feedback.setNpsScore(request.getNpsScore());
        feedback.setComments(StringUtils.hasText(request.getComments()) ? request.getComments().trim() : null);
        feedback.setSubmitted(true);
        feedback.setSubmittedAt(Instant.now());

        VisitFeedback saved = feedbackRepository.save(feedback);

        if (notificationService != null) {
            try {
                double avgRating = (saved.getHospitalityRating() + saved.getFacilityRating() + saved.getObjectiveRating()) / 3.0;
                notificationService.notifyFeedbackSubmitted(saved.getVisit(), saved.getNpsScore(), avgRating);
            } catch (Exception e) {
                log.warn("Failed to dispatch feedback notification for '{}': {}", saved.getVisit().getVisitCode(), e.getMessage());
            }
        }

        auditLoggerService.logEvent(
                null,
                "GUEST (" + feedback.getVisit().getGuestDisplayName() + ")",
                AuditEventType.VISIT_STATUS_CHANGED,
                AuditStatus.SUCCESS,
                "PUBLIC_FEEDBACK_PORTAL",
                "FEEDBACK_MODULE",
                String.format("Customer feedback submitted for visit '%s' (NPS: %d, CSAT avg: %.1f)",
                        saved.getVisit().getVisitCode(), saved.getNpsScore(),
                        (saved.getHospitalityRating() + saved.getFacilityRating() + saved.getObjectiveRating()) / 3.0)
        );

        return FeedbackDetailResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackAnalyticsResponse getFeedbackAnalytics() {
        log.info("Computing executive CSAT and NPS satisfaction analytics");

        long totalSent = feedbackRepository.count();
        long totalCompleted = feedbackRepository.countByIsSubmittedTrue();

        double responseRate = totalSent > 0 ? (totalCompleted / (double) totalSent) * 100.0 : 0.0;
        Double avgHospitality = feedbackRepository.getAverageHospitalityRating();
        Double avgFacility = feedbackRepository.getAverageFacilityRating();
        Double avgObjective = feedbackRepository.getAverageObjectiveRating();

        double hScore = avgHospitality != null ? avgHospitality : 0.0;
        double fScore = avgFacility != null ? avgFacility : 0.0;
        double oScore = avgObjective != null ? avgObjective : 0.0;
        double overallAvg = (hScore + fScore + oScore) / 3.0;
        double csatPct = (overallAvg / 5.0) * 100.0;

        long promoters = feedbackRepository.countPromoters();
        long passives = feedbackRepository.countPassives();
        long detractors = feedbackRepository.countDetractors();

        int nps = 0;
        if (totalCompleted > 0) {
            double promoterPct = (promoters / (double) totalCompleted) * 100.0;
            double detractorPct = (detractors / (double) totalCompleted) * 100.0;
            nps = (int) Math.round(promoterPct - detractorPct);
        }

        Map<String, Long> npsMap = new LinkedHashMap<>();
        npsMap.put("Promoters (9-10)", promoters);
        npsMap.put("Passives (7-8)", passives);
        npsMap.put("Detractors (0-6)", detractors);

        List<FeedbackDetailResponse> recentReviews = feedbackRepository.findTop20RecentSubmittedFeedback()
                .stream()
                .map(FeedbackDetailResponse::from)
                .collect(Collectors.toList());

        return FeedbackAnalyticsResponse.builder()
                .totalSurveysSent(totalSent)
                .totalSurveysCompleted(totalCompleted)
                .responseRatePercentage(Math.round(responseRate * 10.0) / 10.0)
                .averageHospitalityRating(Math.round(hScore * 10.0) / 10.0)
                .averageFacilityRating(Math.round(fScore * 10.0) / 10.0)
                .averageObjectiveRating(Math.round(oScore * 10.0) / 10.0)
                .averageOverallRating(Math.round(overallAvg * 10.0) / 10.0)
                .csatPercentage(Math.round(csatPct * 10.0) / 10.0)
                .netPromoterScore(nps)
                .npsBreakdown(npsMap)
                .recentFeedbackReviews(recentReviews)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackDetailResponse getFeedbackByVisitId(UUID visitId) {
        log.info("Fetching feedback for visit ID: {}", visitId);
        VisitFeedback feedback = feedbackRepository.findByVisitId(visitId)
                .orElseThrow(() -> new IllegalArgumentException("No feedback survey found for visit ID: " + visitId));
        return FeedbackDetailResponse.from(feedback);
    }

    @Override
    @Transactional
    public void createAndSendFeedbackInvitation(Visit visit) {
        log.info("Creating and dispatching survey token for visit: {}", visit.getVisitCode());

        VisitFeedback feedback = feedbackRepository.findByVisitId(visit.getId())
                .orElseGet(() -> {
                    String token = "fb-" + UUID.randomUUID().toString();
                    Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);
                    VisitFeedback newFb = VisitFeedback.builder()
                            .visit(visit)
                            .surveyToken(token)
                            .tokenExpiresAt(expiresAt)
                            .isSubmitted(false)
                            .build();
                    return feedbackRepository.save(newFb);
                });

        String recipientEmail = visit.getIndividualGuestEmail();
        if (!StringUtils.hasText(recipientEmail) && visit.getGuestOrganization() != null) {
            recipientEmail = visit.getGuestOrganization().getContactEmail();
        }

        if (StringUtils.hasText(recipientEmail)) {
            sendSurveyEmail(recipientEmail, visit, feedback.getSurveyToken());
        } else {
            log.warn("No guest email address on record for visit '{}' to send feedback survey.", visit.getVisitCode());
        }
    }

    @Override
    @Transactional
    public void resendFeedbackInvitation(UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("Visit not found with ID: " + visitId));
        createAndSendFeedbackInvitation(visit);
    }

    @Override
    @Transactional
    public FeedbackDetailResponse togglePinFeedback(UUID id, String adminUsername) {
        log.info("Toggling pin status for feedback ID: {} by '{}'", id, adminUsername);
        VisitFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback survey not found with ID: " + id));

        feedback.setPinned(!feedback.isPinned());
        VisitFeedback saved = feedbackRepository.save(feedback);

        auditLoggerService.logEvent(
                null,
                adminUsername,
                AuditEventType.VISIT_STATUS_CHANGED,
                AuditStatus.SUCCESS,
                "FEEDBACK_MODULE",
                "FEEDBACK_MANAGEMENT",
                String.format("Feedback '%s' for visit '%s' was %s on Executive Dashboard by %s",
                        saved.getId(), saved.getVisit().getVisitCode(), saved.isPinned() ? "PINNED" : "UNPINNED", adminUsername)
        );

        return FeedbackDetailResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDetailResponse> getPinnedFeedbacks() {
        log.info("Fetching all pinned feedback reviews for Executive Analytics");
        return feedbackRepository.findByIsSubmittedTrueAndIsPinnedTrueOrderBySubmittedAtDesc()
                .stream()
                .map(FeedbackDetailResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDetailResponse> getFeedbacksByGuestId(UUID guestId) {
        log.info("Fetching feedback reviews for guest ID: {}", guestId);
        return feedbackRepository.findByVisit_MasterIndividualGuest_IdAndIsSubmittedTrueOrderBySubmittedAtDesc(guestId)
                .stream()
                .map(FeedbackDetailResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDetailResponse> getFeedbacksByOrganizationId(UUID orgId) {
        log.info("Fetching feedback reviews for organization ID: {}", orgId);
        return feedbackRepository.findByVisit_GuestOrganization_IdAndIsSubmittedTrueOrderBySubmittedAtDesc(orgId)
                .stream()
                .map(FeedbackDetailResponse::from)
                .collect(Collectors.toList());
    }

    private void sendSurveyEmail(String recipientEmail, Visit visit, String token) {
        try {
            String surveyUrl = frontendUrl + "/api/v1/feedback/verify/" + token;
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String from = StringUtils.hasText(senderEmail) ? senderEmail.trim() : "feedback@coopbank.com.et";
            helper.setFrom(from);
            helper.setTo(recipientEmail);
            helper.setSubject("CoopBank - How was your executive visit? (" + visit.getVisitCode() + ")");

            String html = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #0072bc; padding: 15px; border-radius: 6px; text-align: center; color: white;">
                        <h2>🏦 Cooperative Bank of Oromia</h2>
                        <p style="margin: 0;">Executive & Innovation Hub</p>
                    </div>
                    <div style="padding: 20px 0;">
                        <p>Dear <strong>%s</strong>,</p>
                        <p>Thank you for visiting Cooperative Bank of Oromia for <strong>"%s"</strong> (Ref: <code>%s</code>).</p>
                        <p>We are dedicated to providing world-class partnership hospitality and executive facilities. Please take 1 minute to share your feedback with us:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="background-color: #f7941d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Complete 1-Minute Survey</a>
                        </div>
                        <p style="color: #666; font-size: 12px;">This survey link is secure and valid for 14 days. If the button above does not work, copy and paste this link into your browser:<br/><a href="%s">%s</a></p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee;"/>
                    <p style="font-size: 11px; color: #999; text-align: center;">Cooperative Bank of Oromia | Executive Visit Hub</p>
                </div>
                """,
                visit.getGuestDisplayName(),
                visit.getTitle(),
                visit.getVisitCode(),
                surveyUrl,
                surveyUrl,
                surveyUrl
            );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Survey email sent successfully to '{}' for visit '{}'", recipientEmail, visit.getVisitCode());
        } catch (Exception e) {
            log.error("Failed to send survey invitation email to '{}': {}", recipientEmail, e.getMessage());
        }
    }
}
