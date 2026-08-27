package com.example.coop_vsit_hub.master_data.controller;

import com.example.coop_vsit_hub.master_data.dto.CreateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.dto.MeetingRoomDto;
import com.example.coop_vsit_hub.master_data.dto.UpdateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.service.MasterDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meeting-rooms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "6.2 Master Data - Meeting Rooms & Spaces", description = "Dynamic meeting room and facility management for visit bookings")
public class MeetingRoomController {

    private final MasterDataService masterDataService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List All Meeting Rooms", description = "Retrieve all active meeting rooms and executive spaces for booking dropdowns and calendar schedule.")
    public ResponseEntity<List<MeetingRoomDto>> getAllMeetingRooms(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        return ResponseEntity.ok(masterDataService.getAllMeetingRooms(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Meeting Room by ID", description = "Fetch single meeting room metadata.")
    public ResponseEntity<MeetingRoomDto> getMeetingRoomById(@PathVariable UUID id) {
        return ResponseEntity.ok(masterDataService.getMeetingRoomById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create Meeting Room (Admin)", description = "Admin registers a new meeting room or presentation space.")
    public ResponseEntity<MeetingRoomDto> createMeetingRoom(@Valid @RequestBody CreateMeetingRoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.createMeetingRoom(request));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload Meeting Room Photo (Admin)", description = "Uploads a photo for a meeting room facility.")
    public ResponseEntity<MeetingRoomDto> uploadRoomImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(masterDataService.uploadRoomImage(id, file));
    }

    @GetMapping("/images/{filename:.+}")
    @Operation(summary = "Serve Uploaded Room Image (Public)", description = "Streams uploaded room photo file.")
    public ResponseEntity<Resource> serveRoomImage(@PathVariable String filename) {
        File file = new File("uploads/rooms/" + filename);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        String contentType = filename.toLowerCase().endsWith(".png") ? MediaType.IMAGE_PNG_VALUE : MediaType.IMAGE_JPEG_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update Meeting Room (Admin)", description = "Admin updates meeting room name, floor location, capacity, image URL, or active status.")
    public ResponseEntity<MeetingRoomDto> updateMeetingRoom(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMeetingRoomRequest request
    ) {
        return ResponseEntity.ok(masterDataService.updateMeetingRoom(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete Meeting Room (Admin)", description = "Admin removes a meeting room.")
    public ResponseEntity<Map<String, String>> deleteMeetingRoom(@PathVariable UUID id) {
        masterDataService.deleteMeetingRoom(id);
        return ResponseEntity.ok(Map.of(
                "message", "Meeting room successfully deleted.",
                "deletedId", id.toString()
        ));
    }
}
