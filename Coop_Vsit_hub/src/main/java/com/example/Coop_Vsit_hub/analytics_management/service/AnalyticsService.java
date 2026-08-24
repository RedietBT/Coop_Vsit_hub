package com.example.coop_vsit_hub.analytics_management.service;

import com.example.coop_vsit_hub.analytics_management.dto.ExecutiveDashboardResponse;

/**
 * Service contract for Executive Analytics & Real-Time KPIs.
 */
public interface AnalyticsService {

    /**
     * Compute and aggregate the entire bank's executive visit cockpit metrics.
     */
    ExecutiveDashboardResponse getExecutiveDashboard();
}
