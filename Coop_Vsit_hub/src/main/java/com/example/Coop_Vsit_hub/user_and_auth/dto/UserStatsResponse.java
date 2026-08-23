package com.example.coop_vsit_hub.user_and_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long lockedUsers;
    private long unverifiedUsers;
    private long mustChangePasswordUsers;
    private Map<String, Long> usersByRole;
    private Map<String, Long> usersByDepartment;
}
