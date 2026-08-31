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

        // 1. Dynamic Department Distribution
        List<ReportSummaryDto.DepartmentActivityDto> deptDist = new ArrayList<>();
        long grandTotalVisits = visits.size();
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

        // 2. Dynamic Department Average Dwell Duration
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

        // 3. Dynamic Financial Pipeline & Valuation
        List<Visit> dealsWithOpp = visits.stream()
                .filter(v -> v.getOpportunityValue() != null && v.getOpportunityValue().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        long dealsCount = dealsWithOpp.size();
        BigDecimal avgDeal = BigDecimal.ZERO;
        if (dealsCount > 0) {
            avgDeal = totalOpportunity.divide(BigDecimal.valueOf(dealsCount), 2, java.math.RoundingMode.HALF_UP);
        }

        double convRate = grandTotalVisits > 0 ? (completedCount / (double) grandTotalVisits) * 100.0 : 0.0;

        return ReportSummaryDto.builder()
                .totalVisitors(totalVisitors)
                .topDepartment(topDept)
                .topDepartmentVisitorsCount(topDeptCount)
                .totalOpportunityUSD(totalOpportunity)
                .activeVisitorsCount(activeCount)
                .completedVisitorsCount(completedCount)
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

        // CSV Header - Meeting Room and Meeting With
        sb.append("Visit Code,Visitor Name,Phone,Email,Meeting Room,Meeting With,Check-In Time,Check-Out Time,Duration,Feedback,Status,Pipeline ($ USD)\n");

        for (VisitorReportItemDto item : items) {
            sb.append(escapeCsv(item.getVisitCode())).append(",");
            sb.append(escapeCsv(item.getName())).append(",");
            sb.append(escapeCsv(item.getPhone())).append(",");
            sb.append(escapeCsv(item.getEmail())).append(",");
            sb.append(escapeCsv(item.getFloor() != null && !item.getFloor().isBlank() ? item.getFloor() : "—")).append(",");
            sb.append(escapeCsv(item.getMeetingWith() != null ? item.getMeetingWith() : "")).append(",");
            sb.append(escapeCsv(item.getCheckInTime() != null ? DATE_TIME_FORMATTER.format(item.getCheckInTime()) : "—")).append(",");
            sb.append(escapeCsv(item.getCheckOutTime() != null ? DATE_TIME_FORMATTER.format(item.getCheckOutTime()) : "—")).append(",");
            sb.append(escapeCsv(item.getDuration())).append(",");
            sb.append(escapeCsv(item.getFeedback())).append(",");
            sb.append(escapeCsv(item.getStatus())).append(",");
            sb.append(item.getOpportunityValue() != null ? item.getOpportunityValue().toString() : "0").append("\n");
        }

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
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2.5f, 2.0f, 2.2f, 1.2f, 1.8f});

            // Table Headers
            String[] headers = {"Visit Code", "Visitor Name & Phone", "Meeting Room", "Meeting With", "Check-In Time", "Duration", "Feedback"};
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
                table.addCell(createCell(item.getName() + (item.getPhone() != null && !item.getPhone().equals("—") ? "\n" + item.getPhone() : ""), rowFont));
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

        // 1. Host / Meeting With: Check linked Room Booking from Active Directory
        String host = "";
        Optional<com.example.coop_vsit_hub.room_booking_management.model.RoomBooking> linkedBooking =
                roomBookingRepository.findByLinkedVisitId(visit.getId());

        if (linkedBooking.isPresent()) {
            com.example.coop_vsit_hub.room_booking_management.model.RoomBooking rb = linkedBooking.get();
            if (rb.getBookedByName() != null && !rb.getBookedByName().isBlank()) {
                host = rb.getBookedByName().trim();
            } else if (rb.getBookedByEmail() != null && !rb.getBookedByEmail().isBlank()) {
                host = rb.getBookedByEmail().trim();
            }
        } else if (visit.getSponsor() != null && visit.getSponsor().getFullName() != null && !visit.getSponsor().getFullName().isBlank()) {
            host = visit.getSponsor().getFullName().trim();
        }

        // 2. Real Room Location where meeting took place
        String roomLocation = (visit.getLocationRoom() != null && !visit.getLocationRoom().isBlank())
                ? visit.getLocationRoom().trim()
                : "—";

        // Duration calculation
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

        // Feedback calculation
        String feedback = "Satisfied";
        Optional<VisitFeedback> fb = feedbackRepository.findByVisitId(visit.getId());
        if (fb.isPresent() && fb.get().isSubmitted()) {
            VisitFeedback f = fb.get();
            int h = f.getHospitalityRating() != null ? f.getHospitalityRating() : 5;
            int fac = f.getFacilityRating() != null ? f.getFacilityRating() : 5;
            int obj = f.getObjectiveRating() != null ? f.getObjectiveRating() : 5;
            double avg = (h + fac + obj) / 3.0;
            if (avg >= 4.5) feedback = "Exceptional";
            else if (avg >= 3.5) feedback = "Satisfied";
            else feedback = "Fair";
        } else if (visit.getStatus() != VisitStatus.COMPLETED) {
            feedback = "In Progress";
        }

        return VisitorReportItemDto.builder()
                .id(visit.getId())
                .visitCode(visit.getVisitCode())
                .name(name)
                .phone(phone != null ? phone : "—")
                .email(email != null ? email : "—")
                .department(visit.getRequestingDepartment())
                .floor(roomLocation)
                .meetingWith(host)
                .checkInTime(visit.getActualCheckInTime())
                .checkOutTime(visit.getActualCheckOutTime())
                .duration(duration)
                .feedback(feedback)
                .status(visit.getStatus().name())
                .opportunityValue(visit.getOpportunityValue())
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

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
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
