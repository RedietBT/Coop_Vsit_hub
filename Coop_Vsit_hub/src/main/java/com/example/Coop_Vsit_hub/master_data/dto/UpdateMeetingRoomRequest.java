package com.example.coop_vsit_hub.master_data.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMeetingRoomRequest {

    @NotBlank(message = "Meeting room name is required.")
    @Size(min = 2, max = 150, message = "Room name must be between 2 and 150 characters.")
    private String name;

    @Size(max = 100, message = "Floor location cannot exceed 100 characters.")
    private String floorLocation;

    @Size(max = 100, message = "Department cannot exceed 100 characters.")
    private String department;

    @Min(value = 1, message = "Room capacity must be at least 1 person.")
    private Integer capacity;

    private String imageUrl;

    private String description;

    private UUID assignedUserId;

    private String assignedUserName;

    @jakarta.validation.constraints.Email(message = "Contact email must be a valid email address.")
    @jakarta.validation.constraints.Size(max = 200, message = "Contact email cannot exceed 200 characters.")
    private String contactEmail;

    private Boolean isActive;
}
