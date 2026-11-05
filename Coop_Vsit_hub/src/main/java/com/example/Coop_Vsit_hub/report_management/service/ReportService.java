package com.example.coop_vsit_hub.report_management.service;

import com.example.coop_vsit_hub.report_management.dto.ReportSummaryDto;
import com.example.coop_vsit_hub.report_management.dto.VisitorReportItemDto;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;

import java.time.Instant;
import java.util.List;

public interface ReportService {

    ReportSummaryDto getReportSummary(Instant startDate, Instant endDate, String department, String engagementType);

    default ReportSummaryDto getReportSummary(Instant startDate, Instant endDate, String department) {
        return getReportSummary(startDate, endDate, department, null);
    }

    PageResponse<VisitorReportItemDto> getDetailedReport(Instant startDate, Instant endDate, String department, String engagementType, int page, int size);

    default PageResponse<VisitorReportItemDto> getDetailedReport(Instant startDate, Instant endDate, String department, int page, int size) {
        return getDetailedReport(startDate, endDate, department, null, page, size);
    }

    List<VisitorReportItemDto> getAllReportItems(Instant startDate, Instant endDate, String department, String engagementType);

    default List<VisitorReportItemDto> getAllReportItems(Instant startDate, Instant endDate, String department) {
        return getAllReportItems(startDate, endDate, department, null);
    }

    byte[] exportCsv(Instant startDate, Instant endDate, String department, String engagementType);

    default byte[] exportCsv(Instant startDate, Instant endDate, String department) {
        return exportCsv(startDate, endDate, department, null);
    }

    byte[] exportExcel(Instant startDate, Instant endDate, String department, String engagementType);

    default byte[] exportExcel(Instant startDate, Instant endDate, String department) {
        return exportExcel(startDate, endDate, department, null);
    }

    byte[] exportPdf(Instant startDate, Instant endDate, String department, String engagementType);

    default byte[] exportPdf(Instant startDate, Instant endDate, String department) {
        return exportPdf(startDate, endDate, department, null);
    }
}
