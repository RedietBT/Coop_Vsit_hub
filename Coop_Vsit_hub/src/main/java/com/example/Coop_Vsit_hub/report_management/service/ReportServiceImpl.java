package com.example.coop_vsit_hub.report_management.service;

import com.example.coop_vsit_hub.feedback_management.model.VisitFeedback;
import com.example.coop_vsit_hub.feedback_management.repository.VisitFeedbackRepository;
import com.example.coop_vsit_hub.report_management.dto.ReportSummaryDto;
import com.example.coop_vsit_hub.report_management.dto.VisitorReportItemDto;
import com.example.coop_vsit_hub.user_and_auth.dto.PageResponse;
import com.example.coop_vsit_hub.visit_management.enums.VisitStatus;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final VisitRepository visitRepository;
    private final VisitFeedbackRepository feedbackRepository;
    private final com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingRepository roomBookingRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("M/d/yyyy, h:mm:ss a").withZone(ZoneId.systemDefault());

    @Override
    @Transactional(readOnly = true)
    public ReportSummaryDto getReportSummary(Instant startDate, Instant endDate, String department) {
        Specification<Visit> spec = buildFilterSpec(startDate, endDate, department);
        List<Visit> visits = visitRepository.findAll(spec);

        long totalVisitors = visits.stream().mapToInt(Visit::getVisitorCount).sum();
        if (totalVisitors == 0 && !visits.isEmpty()) {
            totalVisitors = visits.size();
        }

        BigDecimal totalOpportunity = visits.stream()
                .map(v -> v.getOpportunityValue() != null ? v.getOpportunityValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeCount = visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.IN_PROGRESS)
                .count();

        long completedCount = visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.COMPLETED)
                .count();

        // Find top department
        Map<String, Long> deptCounts = visits.stream()
                .filter(v -> v.getRequestingDepartment() != null && !v.getRequestingDepartment().isBlank())
                .collect(Collectors.groupingBy(Visit::getRequestingDepartment, Collectors.counting()));

        String topDept = "General Operations";
        long topDeptCount = 0;
        if (!deptCounts.isEmpty()) {
            Map.Entry<String, Long> topEntry = Collections.max(deptCounts.entrySet(), Map.Entry.comparingByValue());
            topDept = topEntry.getKey();
            topDeptCount = topEntry.getValue();
        }

        // Find top meeting room
        Map<String, Long> roomCounts = visits.stream()
                .filter(v -> v.getLocationRoom() != null && !v.getLocationRoom().isBlank())
                .collect(Collectors.groupingBy(v -> v.getLocationRoom().trim(), Collectors.counting()));

        String topRoom = "None";
        long topRoomCount = 0;
        if (!roomCounts.isEmpty()) {
            Map.Entry<String, Long> topRoomEntry = Collections.max(roomCounts.entrySet(), Map.Entry.comparingByValue());
            topRoom = topRoomEntry.getKey();
            topRoomCount = topRoomEntry.getValue();
        }

        // 1. Dynamic Meeting Room Distribution (Most Visited Rooms)
        List<ReportSummaryDto.DepartmentActivityDto> roomDist = new ArrayList<>();
        long grandTotalVisits = visits.size();
        for (Map.Entry<String, Long> entry : roomCounts.entrySet()) {
            double pctVal = grandTotalVisits > 0 ? (entry.getValue() / (double) grandTotalVisits) * 100.0 : 0.0;
            roomDist.add(ReportSummaryDto.DepartmentActivityDto.builder()
                    .name(entry.getKey())
                    .count(entry.getValue())
                    .pct(String.format("%.0f%%", pctVal))
                    .floor("Meeting Facility")
                    .build());
        }
        roomDist.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));

        // 1b. Dynamic Department Distribution
        List<ReportSummaryDto.DepartmentActivityDto> deptDist = new ArrayList<>();
        for (Map.Entry<String, Long> entry : deptCounts.entrySet()) {
            double pctVal = grandTotalVisits > 0 ? (entry.getValue() / (double) grandTotalVisits) * 100.0 : 0.0;
            deptDist.add(ReportSummaryDto.DepartmentActivityDto.builder()
                    .name(entry.getKey())
                    .count(entry.getValue())
                    .pct(String.format("%.0f%%", pctVal))
                    .floor("HQ Division")
                    .build());
        }
        deptDist.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));

        // 2. Dynamic Room Average Dwell Duration
        Map<String, List<Long>> roomDurations = new HashMap<>();
        for (Visit v : visits) {
            String rName = (v.getLocationRoom() != null && !v.getLocationRoom().isBlank())
                    ? v.getLocationRoom().trim() : "Main Reception";
            long durationMinutes = 30;
            if (v.getActualCheckInTime() != null && v.getActualCheckOutTime() != null) {
                durationMinutes = Math.max(5, Duration.between(v.getActualCheckInTime(), v.getActualCheckOutTime()).toMinutes());
            } else if (v.getScheduledStartTime() != null && v.getScheduledEndTime() != null) {
                durationMinutes = Math.max(5, Duration.between(v.getScheduledStartTime(), v.getScheduledEndTime()).toMinutes());
            }
            roomDurations.computeIfAbsent(rName, k -> new ArrayList<>()).add(durationMinutes);
        }

        List<ReportSummaryDto.DepartmentDwellDto> roomDwellStats = new ArrayList<>();
        for (Map.Entry<String, List<Long>> entry : roomDurations.entrySet()) {
            double avgMin = entry.getValue().stream().mapToLong(Long::longValue).average().orElse(30.0);
            long avgMinRounded = Math.round(avgMin);
            String formatted = avgMinRounded >= 60
                    ? String.format("%dh %dm", avgMinRounded / 60, avgMinRounded % 60)
                    : String.format("%d mins", avgMinRounded);

            roomDwellStats.add(ReportSummaryDto.DepartmentDwellDto.builder()
                    .name(entry.getKey())
                    .avgMinutes(avgMinRounded)
                    .formattedDuration(formatted)
                    .subtitle("Average dwell (" + entry.getValue().size() + " visits)")
                    .build());
        }
        roomDwellStats.sort((a, b) -> Long.compare(b.getAvgMinutes(), a.getAvgMinutes()));

        // 2b. Dynamic Department Average Dwell Duration
        Map<String, List<Long>> deptDurations = new HashMap<>();
        for (Visit v : visits) {
            String dName = v.getRequestingDepartment() != null ? v.getRequestingDepartment() : "General Reception";
            long durationMinutes = 30;
            if (v.getActualCheckInTime() != null && v.getActualCheckOutTime() != null) {
                durationMinutes = Math.max(5, Duration.between(v.getActualCheckInTime(), v.getActualCheckOutTime()).toMinutes());
            } else if (v.getScheduledStartTime() != null && v.getScheduledEndTime() != null) {
                durationMinutes = Math.max(5, Duration.between(v.getScheduledStartTime(), v.getScheduledEndTime()).toMinutes());
            }
            deptDurations.computeIfAbsent(dName, k -> new ArrayList<>()).add(durationMinutes);
        }

        List<ReportSummaryDto.DepartmentDwellDto> dwellStats = new ArrayList<>();
        for (Map.Entry<String, List<Long>> entry : deptDurations.entrySet()) {
            double avgMin = entry.getValue().stream().mapToLong(Long::longValue).average().orElse(30.0);
            long avgMinRounded = Math.round(avgMin);
            String formatted = avgMinRounded >= 60
                    ? String.format("%dh %dm", avgMinRounded / 60, avgMinRounded % 60)
                    : String.format("%d mins", avgMinRounded);

            dwellStats.add(ReportSummaryDto.DepartmentDwellDto.builder()
                    .name(entry.getKey())
                    .avgMinutes(avgMinRounded)
                    .formattedDuration(formatted)
                    .subtitle("Average duration (" + entry.getValue().size() + " visits)")
                    .build());
        }

        // 3. Financial Deals
        List<Visit> dealsWithOpp = visits.stream()
                .filter(v -> v.getOpportunityValue() != null && v.getOpportunityValue().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        long dealsCount = dealsWithOpp.size();
        BigDecimal avgDeal = BigDecimal.ZERO;
        if (dealsCount > 0) {
            avgDeal = totalOpportunity.divide(BigDecimal.valueOf(dealsCount), 2, java.math.RoundingMode.HALF_UP);
        }

        long internalCount = visits.stream()
                .filter(v -> v.getVisitType() == com.example.coop_vsit_hub.visit_management.enums.VisitType.INTERNAL)
                .count();
        long externalCount = visits.stream()
                .filter(v -> v.getVisitType() == com.example.coop_vsit_hub.visit_management.enums.VisitType.EXTERNAL
                        || v.getVisitType() == com.example.coop_vsit_hub.visit_management.enums.VisitType.VIP_DELEGATION)
                .count();
        long totalEngagements = internalCount + externalCount;
        double internalPct = totalEngagements > 0 ? (double) internalCount * 100.0 / totalEngagements : 0.0;
        double externalPct = totalEngagements > 0 ? (double) externalCount * 100.0 / totalEngagements : 0.0;

        double convRate = grandTotalVisits > 0 ? (completedCount / (double) grandTotalVisits) * 100.0 : 0.0;

        return ReportSummaryDto.builder()
                .totalVisitors(totalVisitors)
                .topDepartment(topDept)
                .topDepartmentVisitorsCount(topDeptCount)
                .topMeetingRoom(topRoom)
                .topMeetingRoomVisitorsCount(topRoomCount)
                .totalOpportunityUSD(totalOpportunity)
                .activeVisitorsCount(activeCount)
                .completedVisitorsCount(completedCount)
                .internalEngagementsCount(internalCount)
                .externalEngagementsCount(externalCount)
                .internalPercentage(Math.round(internalPct * 10.0) / 10.0)
                .externalPercentage(Math.round(externalPct * 10.0) / 10.0)
                .roomDistribution(roomDist)
                .roomDwellStats(roomDwellStats)
                .departmentDistribution(deptDist)
                .departmentDwellStats(dwellStats)
                .totalActivePipeline(totalOpportunity)
                .conversionRate(Math.round(convRate * 10.0) / 10.0)
                .avgDealSize(avgDeal)
                .totalDealsCount(dealsCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VisitorReportItemDto> getDetailedReport(Instant startDate, Instant endDate, String department, int page, int size) {
        Specification<Visit> spec = buildFilterSpec(startDate, endDate, department);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Visit> visitPage = visitRepository.findAll(spec, pageable);

        Page<VisitorReportItemDto> dtoPage = visitPage.map(this::mapToReportItem);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitorReportItemDto> getAllReportItems(Instant startDate, Instant endDate, String department) {
        Specification<Visit> spec = buildFilterSpec(startDate, endDate, department);
        List<Visit> visits = visitRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        return visits.stream().map(this::mapToReportItem).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCsv(Instant startDate, Instant endDate, String department) {
        List<VisitorReportItemDto> items = getAllReportItems(startDate, endDate, department);
        StringBuilder sb = new StringBuilder();

        // 1. Write standard UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 directly without question marks or column merging
        sb.append('\uFEFF');

        // CSV Header with all comprehensive information
        sb.append("Visit / Booking Code,")
          .append("Meeting Name / Title,")
          .append("Reason / Purpose / Agenda,")
          .append("Engagement Type,")
          .append("Visitor / Guest Name,")
          .append("Visitor Phone,")
          .append("Visitor Email,")
          .append("Guest Organization,")
          .append("Visitor Count / Attendees,")
          .append("Meeting Room / Facility,")
          .append("Managing Department,")
          .append("Host / Reserving Staff,")
          .append("Host Phone,")
          .append("Host Email,")
          .append("Requested Amenities & Refreshments,")
          .append("Scheduled Start Time,")
          .append("Scheduled End Time,")
          .append("Actual Check-In Time,")
          .append("Actual Check-Out Time,")
          .append("Duration,")
          .append("Status,")
          .append("Cancellation Reason,")
          .append("Cancelled By,")
          .append("Visitor Feedback / Rating,")
          .append("Pipeline Opportunity ($ USD),")
          .append("Created Date\n");

        for (VisitorReportItemDto item : items) {
            String engTypeDisplay = "INTERNAL".equalsIgnoreCase(item.getEngagementType()) ? "Internal (Staff Only)" : "External (Stakeholders)";
            sb.append(escapeCsv(item.getVisitCode())).append(",");
            sb.append(escapeCsv(item.getMeetingTitle())).append(",");
            sb.append(escapeCsv(item.getPurpose())).append(",");
            sb.append(escapeCsv(engTypeDisplay)).append(",");
            sb.append(escapeCsv(item.getName())).append(",");
            sb.append(escapeCsv(item.getPhone())).append(",");
            sb.append(escapeCsv(item.getEmail())).append(",");
            sb.append(escapeCsv(item.getGuestOrganization())).append(",");
            sb.append(item.getVisitorCount() != null ? item.getVisitorCount() : 1).append(",");
            sb.append(escapeCsv(item.getFloor())).append(",");
            sb.append(escapeCsv(item.getDepartment())).append(",");
            sb.append(escapeCsv(item.getMeetingWith())).append(",");
            sb.append(escapeCsv(item.getHostPhone())).append(",");
            sb.append(escapeCsv(item.getHostEmail())).append(",");
            sb.append(escapeCsv(item.getRequestedItems())).append(",");
            sb.append(escapeCsv(formatDateTime(item.getScheduledStartTime()))).append(",");
            sb.append(escapeCsv(formatDateTime(item.getScheduledEndTime()))).append(",");
            sb.append(escapeCsv(formatDateTime(item.getCheckInTime()))).append(",");
            sb.append(escapeCsv(formatDateTime(item.getCheckOutTime()))).append(",");
            sb.append(escapeCsv(item.getDuration())).append(",");
            sb.append(escapeCsv(item.getStatus())).append(",");
            sb.append(escapeCsv(item.getCancellationReason())).append(",");
            sb.append(escapeCsv(item.getCancelledBy())).append(",");
            sb.append(escapeCsv(item.getFeedback())).append(",");
            sb.append(item.getOpportunityValue() != null ? item.getOpportunityValue().toString() : "0").append(",");
            sb.append(escapeCsv(formatDateTime(item.getCreatedAt()))).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportExcel(Instant startDate, Instant endDate, String department) {
        List<VisitorReportItemDto> items = getAllReportItems(startDate, endDate, department);
        StringBuilder sb = new StringBuilder();

        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<?mso-application progid=\"Excel.Sheet\"?>\n");
        sb.append("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"\n");
        sb.append(" xmlns:o=\"urn:schemas-microsoft-com:office:office\"\n");
        sb.append(" xmlns:x=\"urn:schemas-microsoft-com:office:excel\"\n");
        sb.append(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"\n");
        sb.append(" xmlns:html=\"http://www.w3.org/TR/REC-html40\">\n");
        sb.append(" <Styles>\n");
        sb.append("  <Style ss:ID=\"Default\" ss:Name=\"Normal\">\n");
        sb.append("   <Alignment ss:Vertical=\"Center\"/>\n");
        sb.append("   <Font ss:FontName=\"Calibri\" x:Family=\"Swiss\" ss:Size=\"11\" ss:Color=\"#1F2937\"/>\n");
        sb.append("  </Style>\n");
        sb.append("  <Style ss:ID=\"HeaderStyle\">\n");
        sb.append("   <Alignment ss:Horizontal=\"Center\" ss:Vertical=\"Center\" ss:WrapText=\"1\"/>\n");
        sb.append("   <Borders>\n");
        sb.append("    <Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#0072BC\"/>\n");
        sb.append("    <Border ss:Position=\"Left\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#0072BC\"/>\n");
        sb.append("    <Border ss:Position=\"Right\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#0072BC\"/>\n");
        sb.append("    <Border ss:Position=\"Top\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#0072BC\"/>\n");
        sb.append("   </Borders>\n");
        sb.append("   <Font ss:FontName=\"Calibri\" x:Family=\"Swiss\" ss:Size=\"11\" ss:Color=\"#FFFFFF\" ss:Bold=\"1\"/>\n");
        sb.append("   <Interior ss:Color=\"#00ADEF\" ss:Pattern=\"Solid\"/>\n");
        sb.append("  </Style>\n");
        sb.append("  <Style ss:ID=\"DataStyle\">\n");
        sb.append("   <Alignment ss:Vertical=\"Center\"/>\n");
        sb.append("   <Borders>\n");
        sb.append("    <Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Left\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Right\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Top\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("   </Borders>\n");
        sb.append("   <Font ss:FontName=\"Calibri\" x:Family=\"Swiss\" ss:Size=\"10\" ss:Color=\"#1F2937\"/>\n");
        sb.append("  </Style>\n");
        sb.append("  <Style ss:ID=\"CodeStyle\">\n");
        sb.append("   <Alignment ss:Vertical=\"Center\" ss:Horizontal=\"Center\"/>\n");
        sb.append("   <Borders>\n");
        sb.append("    <Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Left\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Right\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("    <Border ss:Position=\"Top\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#E5E7EB\"/>\n");
        sb.append("   </Borders>\n");
        sb.append("   <Font ss:FontName=\"Consolas\" x:Family=\"Modern\" ss:Size=\"10\" ss:Color=\"#00ADEF\" ss:Bold=\"1\"/>\n");
        sb.append("  </Style>\n");
        sb.append(" </Styles>\n");

        sb.append(" <Worksheet ss:Name=\"Visitor &amp; Room Report\">\n");
        sb.append("  <Table>\n");
        int[] widths = {120, 180, 220, 150, 160, 120, 160, 160, 90, 150, 150, 150, 120, 160, 180, 140, 140, 140, 140, 90, 100, 180, 120, 90, 100, 140};
        for (int w : widths) {
            sb.append("   <Column ss:Width=\"").append(w).append("\"/>\n");
        }

        String[] headers = {
            "Visit / Booking Code", "Meeting Name / Title", "Reason / Purpose / Agenda", "Engagement Type", "Visitor / Guest Name",
            "Visitor Phone", "Visitor Email", "Guest Organization", "Attendees", "Meeting Room / Facility",
            "Managing Department", "Host / Reserving Staff", "Host Phone", "Host Email", "Requested Amenities",
            "Scheduled Start Time", "Scheduled End Time", "Actual Check-In Time", "Actual Check-Out Time",
            "Duration", "Status", "Cancellation Reason", "Cancelled By", "Feedback Rating", "Pipeline ($ USD)", "Created Date"
        };
        sb.append("   <Row ss:Height=\"28\">\n");
        for (String h : headers) {
            sb.append("    <Cell ss:StyleID=\"HeaderStyle\"><Data ss:Type=\"String\">").append(escapeXml(h)).append("</Data></Cell>\n");
        }
        sb.append("   </Row>\n");

        for (VisitorReportItemDto item : items) {
            String engTypeDisplay = "INTERNAL".equalsIgnoreCase(item.getEngagementType()) ? "Internal (Staff Only)" : "External (Stakeholders)";
            sb.append("   <Row ss:Height=\"20\">\n");
            addXmlCell(sb, "CodeStyle", item.getVisitCode());
            addXmlCell(sb, "DataStyle", item.getMeetingTitle());
            addXmlCell(sb, "DataStyle", item.getPurpose());
            addXmlCell(sb, "DataStyle", engTypeDisplay);
            addXmlCell(sb, "DataStyle", item.getName());
            addXmlCell(sb, "DataStyle", item.getPhone());
            addXmlCell(sb, "DataStyle", item.getEmail());
            addXmlCell(sb, "DataStyle", item.getGuestOrganization());
            addXmlNumberCell(sb, "DataStyle", item.getVisitorCount() != null ? item.getVisitorCount() : 1);
            addXmlCell(sb, "DataStyle", item.getFloor());
            addXmlCell(sb, "DataStyle", item.getDepartment());
            addXmlCell(sb, "DataStyle", item.getMeetingWith());
            addXmlCell(sb, "DataStyle", item.getHostPhone());
            addXmlCell(sb, "DataStyle", item.getHostEmail());
            addXmlCell(sb, "DataStyle", item.getRequestedItems());
            addXmlCell(sb, "DataStyle", formatDateTime(item.getScheduledStartTime()));
            addXmlCell(sb, "DataStyle", formatDateTime(item.getScheduledEndTime()));
            addXmlCell(sb, "DataStyle", formatDateTime(item.getCheckInTime()));
            addXmlCell(sb, "DataStyle", formatDateTime(item.getCheckOutTime()));
            addXmlCell(sb, "DataStyle", item.getDuration());
            addXmlCell(sb, "DataStyle", item.getStatus());
            addXmlCell(sb, "DataStyle", item.getCancellationReason());
            addXmlCell(sb, "DataStyle", item.getCancelledBy());
            addXmlCell(sb, "DataStyle", item.getFeedback());
            addXmlNumberCell(sb, "DataStyle", item.getOpportunityValue() != null ? item.getOpportunityValue() : 0);
            addXmlCell(sb, "DataStyle", formatDateTime(item.getCreatedAt()));
            sb.append("   </Row>\n");
        }

        sb.append("  </Table>\n");
        sb.append(" </Worksheet>\n");
        sb.append("</Workbook>\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPdf(Instant startDate, Instant endDate, String department) {
        List<VisitorReportItemDto> items = getAllReportItems(startDate, endDate, department);
        ReportSummaryDto summary = getReportSummary(startDate, endDate, department);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            // Title & CoopBank Branding
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(0, 173, 239));
            Paragraph title = new Paragraph("Cooperative Bank of Oromia - Visitor Report & Analytics", titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            document.add(title);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph sub = new Paragraph("Executive & Innovation Hub | Exported on " + DATE_TIME_FORMATTER.format(Instant.now()), subFont);
            sub.setSpacingAfter(15);
            document.add(sub);

            // Summary Highlights Box Table
            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(15);

            addSummaryCell(summaryTable, "Total Visitors", String.valueOf(summary.getTotalVisitors()), new Color(0, 173, 239));
            addSummaryCell(summaryTable, "Top Department", summary.getTopDepartment(), new Color(138, 43, 226));
            addSummaryCell(summaryTable, "Active In-Lobby", String.valueOf(summary.getActiveVisitorsCount()), new Color(227, 133, 36));
            addSummaryCell(summaryTable, "Completed Visits", String.valueOf(summary.getCompletedVisitorsCount()), new Color(46, 139, 87));
            document.add(summaryTable);

            // Detailed Visitors Table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2.5f, 2.0f, 2.0f, 1.8f, 1.2f, 1.6f});

            // Table Headers
            String[] headers = {"Visit Code", "Visitor & Org", "Meeting Name / Purpose", "Room", "Host", "Check-In Time", "Duration", "Feedback"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                cell.setBackgroundColor(new Color(0, 173, 239));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Table Rows
            Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY);
            for (VisitorReportItemDto item : items) {
                table.addCell(createCell(item.getVisitCode(), rowFont));
                String visitorText = item.getName() + (item.getGuestOrganization() != null && !item.getGuestOrganization().isBlank() ? "\n(" + item.getGuestOrganization() + ")" : "") + (item.getPhone() != null && !item.getPhone().equals("—") ? "\n" + item.getPhone() : "");
                table.addCell(createCell(visitorText, rowFont));
                String meetingText = item.getMeetingTitle() + (item.getPurpose() != null && !item.getPurpose().isBlank() ? "\n" + item.getPurpose() : "") + (item.getRequestedItems() != null && !item.getRequestedItems().isBlank() ? "\nItems: " + item.getRequestedItems() : "");
                table.addCell(createCell(meetingText, rowFont));
                table.addCell(createCell(item.getFloor() != null && !item.getFloor().isBlank() ? item.getFloor() : "—", rowFont));
                table.addCell(createCell(item.getMeetingWith() != null && !item.getMeetingWith().isBlank() ? item.getMeetingWith() : "—", rowFont));
                table.addCell(createCell(item.getCheckInTime() != null ? DATE_TIME_FORMATTER.format(item.getCheckInTime()) : "—", rowFont));
                table.addCell(createCell(item.getDuration(), rowFont));
                table.addCell(createCell(item.getFeedback(), rowFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF report: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to generate PDF report: " + e.getMessage());
        }
    }

    private VisitorReportItemDto mapToReportItem(Visit visit) {
        String name = visit.getGuestDisplayName();
        String phone = visit.getVisitorPhone() != null ? visit.getVisitorPhone() : visit.getIndividualGuestPhone();
        String email = visit.getVisitorEmail() != null ? visit.getVisitorEmail() : visit.getIndividualGuestEmail();

        String host = "";
        String hostPhone = "";
        String hostEmail = "";
        String meetingTitle = visit.getTitle() != null && !visit.getTitle().isBlank() ? visit.getTitle().trim() : "Executive Session";
        String purpose = visit.getVisitObjective() != null && !visit.getVisitObjective().isBlank() ? visit.getVisitObjective().trim() : "";
        String requestedItems = "";
        String cancellationReason = visit.getDecisionNotes();
        String cancelledBy = null;

        Optional<com.example.coop_vsit_hub.room_booking_management.model.RoomBooking> linkedBooking =
                roomBookingRepository.findByLinkedVisitId(visit.getId());

        if (linkedBooking.isPresent()) {
            com.example.coop_vsit_hub.room_booking_management.model.RoomBooking rb = linkedBooking.get();
            if (rb.getBookedByName() != null && !rb.getBookedByName().isBlank()) {
                host = rb.getBookedByName().trim();
            } else if (rb.getBookedByEmail() != null && !rb.getBookedByEmail().isBlank()) {
                host = rb.getBookedByEmail().trim();
            }
            if (rb.getBookedByPhone() != null && !rb.getBookedByPhone().isBlank()) {
                hostPhone = rb.getBookedByPhone().trim();
            }
            if (rb.getBookedByEmail() != null && !rb.getBookedByEmail().isBlank()) {
                hostEmail = rb.getBookedByEmail().trim();
            }
            if (rb.getMeetingTitle() != null && !rb.getMeetingTitle().isBlank()) {
                meetingTitle = rb.getMeetingTitle().trim();
            }
            if (rb.getMeetingAgenda() != null && !rb.getMeetingAgenda().isBlank()) {
                purpose = rb.getMeetingAgenda().trim();
            }
            if (rb.getRequestedItems() != null && !rb.getRequestedItems().isBlank()) {
                requestedItems = rb.getRequestedItems().trim();
            }
            if (cancellationReason == null && rb.getCancellationReason() != null) {
                cancellationReason = rb.getCancellationReason();
            }
            if (cancelledBy == null && rb.getCancelledByName() != null) {
                cancelledBy = rb.getCancelledByName();
            }
        } else if (visit.getSponsor() != null) {
            if (visit.getSponsor().getFullName() != null && !visit.getSponsor().getFullName().isBlank()) {
                host = visit.getSponsor().getFullName().trim();
            }
            if (visit.getSponsor().getPhoneNumber() != null) {
                hostPhone = visit.getSponsor().getPhoneNumber().trim();
            }
            if (visit.getSponsor().getEmail() != null) {
                hostEmail = visit.getSponsor().getEmail().trim();
            }
        }

        String guestOrg = "";
        if (visit.getGuestOrganization() != null && visit.getGuestOrganization().getName() != null) {
            guestOrg = visit.getGuestOrganization().getName().trim();
        }

        String roomLocation = (visit.getLocationRoom() != null && !visit.getLocationRoom().isBlank())
                ? visit.getLocationRoom().trim()
                : "—";

        String duration = "—";
        if (visit.getActualCheckInTime() != null) {
            Instant end = visit.getActualCheckOutTime() != null ? visit.getActualCheckOutTime() : Instant.now();
            long mins = Math.max(1, Duration.between(visit.getActualCheckInTime(), end).toMinutes());
            if (mins < 60) {
                duration = mins + "m";
            } else {
                duration = (mins / 60) + "h " + (mins % 60) + "m";
            }
        }

        String feedback = "In Progress";
        Optional<VisitFeedback> fb = feedbackRepository.findByVisitId(visit.getId());
        if (fb.isPresent() && fb.get().isSubmitted()) {
            VisitFeedback f = fb.get();
            double avg = 0.0;
            int count = 0;
            if (f.getHospitalityRating() != null) { avg += f.getHospitalityRating(); count++; }
            if (f.getFacilityRating() != null) { avg += f.getFacilityRating(); count++; }
            if (f.getObjectiveRating() != null) { avg += f.getObjectiveRating(); count++; }
            if (count > 0) {
                feedback = String.format(Locale.US, "%.1f ★", avg / count);
            } else {
                feedback = "5.0 ★";
            }
        }

        return VisitorReportItemDto.builder()
                .id(visit.getId())
                .visitCode(visit.getVisitCode())
                .name(name != null ? name : "Visitor")
                .phone(phone != null ? phone : "—")
                .email(email != null ? email : "—")
                .guestOrganization(guestOrg)
                .meetingTitle(meetingTitle)
                .purpose(purpose)
                .department(visit.getRequestingDepartment())
                .floor(roomLocation)
                .meetingWith(host)
                .hostPhone(hostPhone)
                .hostEmail(hostEmail)
                .requestedItems(requestedItems)
                .scheduledStartTime(visit.getScheduledStartTime())
                .scheduledEndTime(visit.getScheduledEndTime())
                .checkInTime(visit.getActualCheckInTime())
                .checkOutTime(visit.getActualCheckOutTime())
                .visitorCount(visit.getVisitorCount())
                .duration(duration)
                .feedback(feedback)
                .status(visit.getStatus() != null ? visit.getStatus().name() : "SUBMITTED")
                .cancellationReason(cancellationReason)
                .cancelledBy(cancelledBy)
                .engagementType(visit.getVisitType() != null ? visit.getVisitType().name() : (linkedBooking.isPresent() && linkedBooking.get().getEngagementType() != null ? linkedBooking.get().getEngagementType().name() : "INTERNAL"))
                .opportunityValue(visit.getOpportunityValue())
                .createdAt(visit.getCreatedAt())
                .build();
    }

    private Specification<Visit> buildFilterSpec(Instant startDate, Instant endDate, String department) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (department != null && !department.isBlank() && !"All Departments".equalsIgnoreCase(department)) {
                predicates.add(cb.equal(root.get("requestingDepartment"), department.trim()));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private String formatDateTime(Instant instant) {
        if (instant == null) return "—";
        try {
            return DATE_TIME_FORMATTER.format(instant);
        } catch (Exception e) {
            return instant.toString();
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    private String escapeXml(String val) {
        if (val == null) return "";
        return val.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&apos;");
    }

    private void addXmlCell(StringBuilder sb, String styleId, String val) {
        String cleanVal = val != null ? val : "";
        sb.append("    <Cell ss:StyleID=\"").append(styleId).append("\"><Data ss:Type=\"String\">")
          .append(escapeXml(cleanVal)).append("</Data></Cell>\n");
    }

    private void addXmlNumberCell(StringBuilder sb, String styleId, Number num) {
        String val = num != null ? num.toString() : "0";
        sb.append("    <Cell ss:StyleID=\"").append(styleId).append("\"><Data ss:Type=\"Number\">")
          .append(val).append("</Data></Cell>\n");
    }

    private void addSummaryCell(PdfPTable table, String label, String value, Color color) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(245, 247, 250));
        cell.setPadding(8);
        cell.setBorderColor(new Color(220, 224, 230));

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, color);

        Paragraph p = new Paragraph();
        p.add(new Chunk(label + "\n", labelFont));
        p.add(new Chunk(value, valFont));
        cell.addElement(p);

        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(5);
        cell.setBorderColor(new Color(230, 233, 238));
        return cell;
    }
}
