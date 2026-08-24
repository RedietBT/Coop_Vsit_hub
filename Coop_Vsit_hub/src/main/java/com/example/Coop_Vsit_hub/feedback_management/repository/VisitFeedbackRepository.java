package com.example.coop_vsit_hub.feedback_management.repository;

import com.example.coop_vsit_hub.feedback_management.model.VisitFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitFeedbackRepository extends JpaRepository<VisitFeedback, UUID> {

    Optional<VisitFeedback> findBySurveyToken(String surveyToken);

    Optional<VisitFeedback> findByVisitId(UUID visitId);

    boolean existsBySurveyToken(String surveyToken);

    long countByIsSubmittedTrue();

    @Query("SELECT COALESCE(AVG(f.hospitalityRating), 0.0) FROM VisitFeedback f WHERE f.isSubmitted = true")
    Double getAverageHospitalityRating();

    @Query("SELECT COALESCE(AVG(f.facilityRating), 0.0) FROM VisitFeedback f WHERE f.isSubmitted = true")
    Double getAverageFacilityRating();

    @Query("SELECT COALESCE(AVG(f.objectiveRating), 0.0) FROM VisitFeedback f WHERE f.isSubmitted = true")
    Double getAverageObjectiveRating();

    @Query("SELECT COUNT(f) FROM VisitFeedback f WHERE f.isSubmitted = true AND f.npsScore >= 9")
    long countPromoters();

    @Query("SELECT COUNT(f) FROM VisitFeedback f WHERE f.isSubmitted = true AND f.npsScore BETWEEN 7 AND 8")
    long countPassives();

    @Query("SELECT COUNT(f) FROM VisitFeedback f WHERE f.isSubmitted = true AND f.npsScore <= 6")
    long countDetractors();

    @Query("SELECT f FROM VisitFeedback f WHERE f.isSubmitted = true ORDER BY f.submittedAt DESC")
    List<VisitFeedback> findTop20RecentSubmittedFeedback();
}
