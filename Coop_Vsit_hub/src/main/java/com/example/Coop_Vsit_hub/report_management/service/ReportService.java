package com.example.coop_vsit_hub.report_management.service;

import com.example.coop_vsit_hub.report_management.dto.ReportSummaryDto;
import com.example.coop_vsit_hub.report_management.dto.VisitorReportItemDto;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    ReportSummaryDto getReportSummary(Instant startDate, Instant endDate, String department);

    PageResponse<VisitorReportItemDto> getDetailedReport(Instant startDate, Instant endDate, String department, int page, int size);

    List<VisitorReportItemDto> getAllReportItems(Instant startDate, Instant endDate, String department);

    byte[] exportCsv(Instant startDate, Instant endDate, String department);

    byte[] exportPdf(Instant startDate, Instant endDate, String department);
}
