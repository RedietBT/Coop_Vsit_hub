package com.example.coop_vsit_hub.master_data.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMeetingRoomRequest {

    @NotBlank(message = "Meeting room name is required.")
    @Size(min = 2, max = 150, message = "Room name must be between 2 and 150 characters.")
    private String name;

    @Size(max = 100, message = "Floor location cannot exceed 100 characters.")
    private String floorLocation;

    @Size(max = 100, message = "Department cannot exceed 100 characters.")
    private String department;

    @Min(value = 1, message = "Room capacity must be at least 1 person.")
    @Builder.Default
    private Integer capacity = 10;

    private String imageUrl;

    private String description;
}
