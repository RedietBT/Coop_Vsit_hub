package com.example.coop_vsit_hub.room_booking_management.repository;

import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class RoomBookingSpecification {

    public static Specification<RoomBooking> filterBookings(
            String roomName,
            String search,
            RoomBookingStatus status
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(roomName)) {
                predicates.add(cb.equal(cb.lower(root.get("roomName")), roomName.toLowerCase().trim()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("meetingTitle")), pattern);
                Predicate bookerMatch = cb.like(cb.lower(root.get("bookedByName")), pattern);
                Predicate orgMatch = cb.like(cb.lower(root.get("guestOrganizationName")), pattern);
                Predicate guestMatch = cb.like(cb.lower(root.get("guestName")), pattern);
                Predicate codeMatch = cb.like(cb.lower(root.get("bookingCode")), pattern);

                predicates.add(cb.or(titleMatch, bookerMatch, orgMatch, guestMatch, codeMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
