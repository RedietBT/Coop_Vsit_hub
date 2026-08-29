package com.example.coop_vsit_hub.room_booking_management.repository;

import com.example.coop_vsit_hub.room_booking_management.enums.RoomBookingStatus;
import com.example.coop_vsit_hub.room_booking_management.model.RoomBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomBookingRepository extends JpaRepository<RoomBooking, UUID>, JpaSpecificationExecutor<RoomBooking> {

    Optional<RoomBooking> findByBookingCode(String bookingCode);

    Optional<RoomBooking> findTopByOrderByCreatedAtDesc();

    @Query("SELECT b FROM RoomBooking b WHERE b.roomName = :roomName " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.scheduledStartTime < :endTime " +
           "AND b.scheduledEndTime > :startTime")
    List<RoomBooking> findOverlappingBookings(
            @Param("roomName") String roomName,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime
    );

    @Query("SELECT b FROM RoomBooking b WHERE b.roomName = :roomName " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.scheduledStartTime >= :fromDate " +
           "AND b.scheduledStartTime <= :toDate " +
           "ORDER BY b.scheduledStartTime ASC")
    List<RoomBooking> findActiveRoomSlots(
            @Param("roomName") String roomName,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate
    );

    @Query("SELECT b FROM RoomBooking b WHERE b.status = 'CONFIRMED' " +
           "AND b.scheduledStartTime >= :fromDate " +
           "AND b.scheduledStartTime <= :toDate " +
           "ORDER BY b.scheduledStartTime ASC")
    List<RoomBooking> findAllActiveForDateRange(
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate
    );

    @Query("SELECT b FROM RoomBooking b WHERE " +
           "(:roomName IS NULL OR LOWER(b.roomName) LIKE LOWER(CONCAT('%', :roomName, '%'))) AND " +
           "(:search IS NULL OR LOWER(b.meetingTitle) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(b.bookedByName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(b.guestOrganizationName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR b.status = :status)")
    Page<RoomBooking> findAllWithFilters(
            @Param("roomName") String roomName,
            @Param("search") String search,
            @Param("status") RoomBookingStatus status,
            Pageable pageable
    );
}
