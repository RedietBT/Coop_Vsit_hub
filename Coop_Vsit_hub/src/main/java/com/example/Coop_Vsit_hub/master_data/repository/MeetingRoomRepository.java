package com.example.coop_vsit_hub.master_data.repository;

import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, UUID> {
    List<MeetingRoom> findByIsActiveTrueOrderByNameAsc();
    List<MeetingRoom> findAllByOrderByNameAsc();
    Optional<MeetingRoom> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
