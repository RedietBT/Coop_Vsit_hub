package com.example.coop_vsit_hub.staff_tracking.service;

import com.example.coop_vsit_hub.feedback_management.model.VisitFeedback;
import com.example.coop_vsit_hub.feedback_management.repository.VisitFeedbackRepository;
import com.example.coop_vsit_hub.individual_guest_management.dto.IndividualGuestSummaryResponse;
import com.example.coop_vsit_hub.individual_guest_management.model.IndividualGuest;
import com.example.coop_vsit_hub.organization_management.dto.OrganizationSummaryResponse;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import com.example.coop_vsit_hub.room_booking_management.repository.RoomBookingRepository;
import com.example.coop_vsit_hub.staff_tracking.dto.TrackedStaffOverviewResponse;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
import com.example.coop_vsit_hub.visit_management.dto.VisitSummaryResponse;
import com.example.coop_vsit_hub.visit_management.model.Organization;
import com.example.coop_vsit_hub.visit_management.model.Visit;
import com.example.coop_vsit_hub.visit_management.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffTrackingServiceImpl implements StaffTrackingService {

    private final UserRepository userRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final VisitRepository visitRepository;
    private final VisitFeedbackRepository feedbackRepository;

    @Override
    @Transactional(readOnly = true)
    public TrackedStaffOverviewResponse getStaffTrackedOverview(String staffIdentifier) {
        log.info("Generating staff tracking overview for: {}", staffIdentifier);
        User staffUser = findStaffUser(staffIdentifier);

        List<Visit> matchedVisits = resolveMatchedVisits(staffUser, staffIdentifier);
        List<VisitSummaryResponse> visitDtos = mapVisitsToDto(matchedVisits);

        List<OrganizationSummaryResponse> orgDtos = extractMatchedOrganizations(matchedVisits);
        List<IndividualGuestSummaryResponse> guestDtos = extractMatchedGuests(matchedVisits);

        List<RoomBooking> bookings = resolveStaffBookings(staffUser, staffIdentifier);

        return TrackedStaffOverviewResponse.builder()
                .staffUsername(staffUser != null ? staffUser.getUsername() : staffIdentifier)
                .staffFullName(staffUser != null ? staffUser.getFullName() : staffIdentifier)
                .staffEmail(staffUser != null ? staffUser.getEmail() : null)
                .totalTrackedVisits(visitDtos.size())
                .totalTrackedOrganizations(orgDtos.size())
                .totalTrackedGuests(guestDtos.size())
                .activeReservationsCount(bookings.size())
                .visits(visitDtos)
                .organizations(orgDtos)
                .individualGuests(guestDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitSummaryResponse> getStaffTrackedVisits(String staffIdentifier) {
        User staffUser = findStaffUser(staffIdentifier);
        List<Visit> matchedVisits = resolveMatchedVisits(staffUser, staffIdentifier);
        return mapVisitsToDto(matchedVisits);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationSummaryResponse> getStaffTrackedOrganizations(String staffIdentifier) {
        User staffUser = findStaffUser(staffIdentifier);
        List<Visit> matchedVisits = resolveMatchedVisits(staffUser, staffIdentifier);
        return extractMatchedOrganizations(matchedVisits);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IndividualGuestSummaryResponse> getStaffTrackedGuests(String staffIdentifier) {
        User staffUser = findStaffUser(staffIdentifier);
        List<Visit> matchedVisits = resolveMatchedVisits(staffUser, staffIdentifier);
        return extractMatchedGuests(matchedVisits);
    }

    @Override
    @Transactional
    public boolean linkBookingToVisit(UUID bookingId, UUID visitId, String staffIdentifier) {
        log.info("Staff '{}' linking room booking '{}' to visit '{}'", staffIdentifier, bookingId, visitId);
        RoomBooking booking = roomBookingRepository.findById(bookingId).orElse(null);
        Visit visit = visitRepository.findById(visitId).orElse(null);

        if (booking != null && visit != null) {
            booking.setLinkedVisitId(visit.getId());
            roomBookingRepository.save(booking);
            return true;
        }
        return false;
    }

    private User findStaffUser(String identifier) {
        if (!StringUtils.hasText(identifier)) return null;
        return userRepository.findByUsernameOrEmail(identifier.trim()).orElse(null);
    }

    private List<RoomBooking> resolveStaffBookings(User staffUser, String identifier) {
        Set<RoomBooking> bookingsSet = new LinkedHashSet<>();
        if (staffUser != null) {
            if (staffUser.getId() != null) {
                bookingsSet.addAll(roomBookingRepository.findByBookedByUserId(staffUser.getId()));
            }
            if (StringUtils.hasText(staffUser.getUsername())) {
                bookingsSet.addAll(roomBookingRepository.findByBookedByUsernameIgnoreCaseOrBookedByEmailIgnoreCase(
                        staffUser.getUsername(), staffUser.getEmail()));
            }
        }
        if (StringUtils.hasText(identifier)) {
            bookingsSet.addAll(roomBookingRepository.findByBookedByUsernameIgnoreCaseOrBookedByEmailIgnoreCase(identifier, identifier));
        }
        return new ArrayList<>(bookingsSet);
    }

    private List<Visit> resolveMatchedVisits(User staffUser, String identifier) {
        Map<UUID, Visit> matchedMap = new LinkedHashMap<>();

        // 1. Direct Ownership Visits (Requester or Sponsor)
        if (staffUser != null) {
            if (staffUser.getId() != null) {
                List<Visit> direct = visitRepository.findByRequester_IdOrSponsor_Id(staffUser.getId(), staffUser.getId());
                direct.forEach(v -> matchedMap.put(v.getId(), v));
            }
            if (StringUtils.hasText(staffUser.getUsername())) {
                List<Visit> directByUsername = visitRepository.findByRequester_UsernameIgnoreCaseOrSponsor_UsernameIgnoreCase(
                        staffUser.getUsername(), staffUser.getUsername());
                directByUsername.forEach(v -> matchedMap.put(v.getId(), v));
            }
        }

        // 2. Room Booking Smart Matching Engine
        List<RoomBooking> bookings = resolveStaffBookings(staffUser, identifier);

        for (RoomBooking booking : bookings) {
            if (booking.getScheduledStartTime() == null) continue;

            // Mandatory Date Match: Same calendar day (local / UTC)
            LocalDate bDate = booking.getScheduledStartTime().atZone(ZoneId.systemDefault()).toLocalDate();
            Instant startOfDay = bDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant endOfDay = bDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

            List<Visit> candidateVisits = visitRepository.findVisitsInTimeWindow(startOfDay, endOfDay);

            for (Visit v : candidateVisits) {
                // Rule 1: Explicit Linked ID Match
                if (booking.getLinkedVisitId() != null && booking.getLinkedVisitId().equals(v.getId())) {
                    matchedMap.put(v.getId(), v);
                    continue;
                }

                // Rule 2: Mandatory Date + (Name OR Email OR Phone Match)
                boolean matchesIdentifier = isBookingVisitMatch(booking, v);
                if (matchesIdentifier) {
                    matchedMap.put(v.getId(), v);
                }
            }
        }

        List<Visit> results = new ArrayList<>(matchedMap.values());
        results.sort((a, b) -> {
            Instant tA = a.getScheduledStartTime() != null ? a.getScheduledStartTime() : a.getCreatedAt();
            Instant tB = b.getScheduledStartTime() != null ? b.getScheduledStartTime() : b.getCreatedAt();
            if (tA == null && tB == null) return 0;
            if (tA == null) return 1;
            if (tB == null) return -1;
            return tB.compareTo(tA); // Latest first
        });
        return results;
    }

    private boolean isBookingVisitMatch(RoomBooking booking, Visit visit) {
        // A. Name Matching (Guest Name, Organization Name, or Title)
        String bGuest = booking.getGuestName();
        String bOrg = booking.getGuestOrganizationName();
        String bTitle = booking.getMeetingTitle();

        String vGuest = visit.getGuestDisplayName();
        String vFirst = visit.getVisitorFirstName();
        String vSurname = visit.getVisitorSurname();
        String vOrg = visit.getGuestOrganization() != null ? visit.getGuestOrganization().getName() : null;
        String vTitle = visit.getTitle();

        if (fuzzyNameMatch(bGuest, vGuest) || fuzzyNameMatch(bGuest, vFirst) || fuzzyNameMatch(bGuest, vSurname)) {
            return true;
        }
        if (fuzzyNameMatch(bOrg, vOrg) || fuzzyNameMatch(bOrg, vGuest)) {
            return true;
        }
        if (fuzzyNameMatch(bTitle, vTitle)) {
            return true;
        }

        // B. Email Matching
        String bEmail = booking.getBookedByEmail();
        String vEmail = visit.getVisitorEmail();
        String vIndEmail = visit.getIndividualGuestEmail();

        if (exactEmailMatch(bEmail, vEmail) || exactEmailMatch(bEmail, vIndEmail)) {
            return true;
        }

        // C. Phone Matching
        String vPhone = visit.getVisitorPhone();
        String vIndPhone = visit.getIndividualGuestPhone();
        if (exactPhoneMatch(vPhone, booking.getBookingCode()) || exactPhoneMatch(vIndPhone, booking.getBookingCode())) {
            return true;
        }

        return false;
    }

    private boolean fuzzyNameMatch(String s1, String s2) {
        if (!StringUtils.hasText(s1) || !StringUtils.hasText(s2)) return false;
        String n1 = s1.trim().toLowerCase();
        String n2 = s2.trim().toLowerCase();
        if (n1.equals(n2)) return true;
        if (n1.length() >= 3 && n2.contains(n1)) return true;
        if (n2.length() >= 3 && n1.contains(n2)) return true;
        return false;
    }

    private boolean exactEmailMatch(String e1, String e2) {
        if (!StringUtils.hasText(e1) || !StringUtils.hasText(e2)) return false;
        return e1.trim().equalsIgnoreCase(e2.trim());
    }

    private boolean exactPhoneMatch(String p1, String p2) {
        if (!StringUtils.hasText(p1) || !StringUtils.hasText(p2)) return false;
        String d1 = p1.replaceAll("\\D", "");
        String d2 = p2.replaceAll("\\D", "");
        if (d1.length() >= 7 && d2.length() >= 7) {
            return d1.endsWith(d2) || d2.endsWith(d1);
        }
        return false;
    }

    private List<VisitSummaryResponse> mapVisitsToDto(List<Visit> visits) {
        return visits.stream().map(v -> {
            VisitSummaryResponse dto = VisitSummaryResponse.from(v);
            feedbackRepository.findByVisitId(v.getId()).ifPresent(fb -> {
                if (fb.isSubmitted()) {
                    dto.setFeedbackSubmitted(true);
                    int count = 0;
                    int sum = 0;
                    if (fb.getHospitalityRating() != null && fb.getHospitalityRating() > 0) { sum += fb.getHospitalityRating(); count++; }
                    if (fb.getFacilityRating() != null && fb.getFacilityRating() > 0) { sum += fb.getFacilityRating(); count++; }
                    if (fb.getObjectiveRating() != null && fb.getObjectiveRating() > 0) { sum += fb.getObjectiveRating(); count++; }
                    double avg = count > 0 ? Math.round((sum / (double) count) * 10.0) / 10.0 : 5.0;
                    dto.setGuestRating(avg);
                    dto.setFeedbackComments(fb.getComments());
                } else {
                    dto.setFeedbackSubmitted(false);
                }
            });
            if (dto.getFeedbackSubmitted() == null) {
                dto.setFeedbackSubmitted(false);
            }
            return dto;
        }).collect(Collectors.toList());
    }

    private List<OrganizationSummaryResponse> extractMatchedOrganizations(List<Visit> visits) {
        Map<UUID, Organization> orgMap = new LinkedHashMap<>();
        Map<UUID, Long> visitCountMap = new HashMap<>();

        for (Visit v : visits) {
            if (v.getGuestOrganization() != null && v.getGuestOrganization().getId() != null) {
                Organization org = v.getGuestOrganization();
                orgMap.put(org.getId(), org);
                visitCountMap.put(org.getId(), visitCountMap.getOrDefault(org.getId(), 0L) + 1L);
            }
        }

        return orgMap.values().stream().map(org -> {
            long total = visitCountMap.getOrDefault(org.getId(), 1L);
            return OrganizationSummaryResponse.from(org, total);
        }).collect(Collectors.toList());
    }

    private List<IndividualGuestSummaryResponse> extractMatchedGuests(List<Visit> visits) {
        Map<UUID, IndividualGuest> guestMap = new LinkedHashMap<>();
        Map<UUID, Long> visitCountMap = new HashMap<>();

        for (Visit v : visits) {
            if (v.getMasterIndividualGuest() != null && v.getMasterIndividualGuest().getId() != null) {
                IndividualGuest g = v.getMasterIndividualGuest();
                guestMap.put(g.getId(), g);
                visitCountMap.put(g.getId(), visitCountMap.getOrDefault(g.getId(), 0L) + 1L);
            }
        }

        return guestMap.values().stream().map(g -> {
            long total = visitCountMap.getOrDefault(g.getId(), 1L);
            return IndividualGuestSummaryResponse.from(g, total);
        }).collect(Collectors.toList());
    }
}
