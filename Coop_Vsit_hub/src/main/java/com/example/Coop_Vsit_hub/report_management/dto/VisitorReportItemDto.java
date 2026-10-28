package com.example.coop_vsit_hub.report_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorReportItemDto {
    private UUID id;
    private String visitCode;
    private String name;
    private String phone;
    private String email;
    private String guestOrganization;
    private String meetingTitle;
    private String purpose;
    private String department;
    private String floor;
    private String meetingWith;
    private String hostPhone;
    private String hostEmail;
    private String requestedItems;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private Instant checkInTime;
    private Instant checkOutTime;
    private Integer visitorCount;
    private String duration;
    private String feedback;
    private String status;
    private String cancellationReason;
    private String cancelledBy;
    private BigDecimal opportunityValue;
    private Instant createdAt;
}
