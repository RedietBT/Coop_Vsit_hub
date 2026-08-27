package com.example.coop_vsit_hub.report_management.controller;

import com.example.coop_vsit_hub.report_management.dto.ReportSummaryDto;
import com.example.coop_vsit_hub.report_management.dto.VisitorReportItemDto;
import com.example.coop_vsit_hub.report_management.service.ReportService;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "5.1 Reports & Visitor Analytics", description = "Visitor reports, department statistics, CSV, and PDF export")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @Operation(summary = "Get Report Summary & Highlights", description = "Computes visitor counts, top department, and pipeline summary for selected period.")
    public ResponseEntity<ReportSummaryDto> getReportSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String department
    ) {
        return ResponseEntity.ok(reportService.getReportSummary(startDate, endDate, department));
    }

    @GetMapping("/detailed")
    @Operation(summary = "Get Detailed Visitor Report (Paginated)", description = "Retrieves visitor report records with duration, host, and feedback.")
    public ResponseEntity<PageResponse<VisitorReportItemDto>> getDetailedReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(reportService.getDetailedReport(startDate, endDate, department, page, size));
    }

    @GetMapping("/export-csv")
    @Operation(summary = "Export Detailed Visitor Report as CSV", description = "Generates and streams downloadable CSV file.")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String department
    ) {
        byte[] csvData = reportService.exportCsv(startDate, endDate, department);
        String filename = "Visitor_Report_" + System.currentTimeMillis() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    @GetMapping("/export-pdf")
    @Operation(summary = "Export Detailed Visitor Report as PDF", description = "Generates and streams high-resolution executive PDF document.")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String department
    ) {
        byte[] pdfData = reportService.exportPdf(startDate, endDate, department);
        String filename = "Visitor_Report_" + System.currentTimeMillis() + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfData);
    }
}
