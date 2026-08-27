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
    private String department;
    private String floor;
    private String meetingWith;
    private Instant checkInTime;
    private Instant checkOutTime;
    private String duration;
    private String feedback;
    private String status;
    private BigDecimal opportunityValue;
}
