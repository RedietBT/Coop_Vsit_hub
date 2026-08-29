package com.example.coop_vsit_hub.master_data.dto;

import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRoomDto {
    private UUID id;
    private String name;
    private String floorLocation;
    private String department;
    private Integer capacity;
    private String imageUrl;
    private String description;
    private Boolean isActive;
    private Instant createdAt;

    public static MeetingRoomDto from(MeetingRoom entity) {
        if (entity == null) return null;
        return MeetingRoomDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .floorLocation(entity.getFloorLocation())
                .department(entity.getDepartment())
                .capacity(entity.getCapacity())
                .imageUrl(entity.getImageUrl())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
