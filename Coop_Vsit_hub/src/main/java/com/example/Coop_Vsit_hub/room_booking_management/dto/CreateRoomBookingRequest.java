package com.example.coop_vsit_hub.room_booking_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomBookingRequest {

    private String roomName;
    private String meetingTitle;
    private String hostDepartment;
    private String guestOrganizationName;
    private String guestName;
    private Integer expectedAttendees;
    private String meetingAgenda;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private String bookedByName;
    private String bookedByEmail;
    private String bookedByUsername;
    private String bookedByPhone;
    private String requestedItems;
    private String engagementType;
    /** Guests (name + email) who receive the reservation / cancellation emails. */
    private List<BookingGuestDto> guests;
    /** When false, guests are recorded but never emailed. Defaults to true. */
    private Boolean notifyGuests;
}
