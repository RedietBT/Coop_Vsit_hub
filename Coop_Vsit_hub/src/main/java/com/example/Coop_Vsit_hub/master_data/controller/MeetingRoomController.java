package com.example.coop_vsit_hub.master_data.controller;

import com.example.coop_vsit_hub.master_data.dto.CreateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.dto.MeetingRoomDto;
import com.example.coop_vsit_hub.master_data.dto.UpdateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.service.MasterDataService;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
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
import java.security.Principal;
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
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List All Meeting Rooms", description = "Retrieve meeting rooms. Can optionally filter by department or active status.")
    public ResponseEntity<List<MeetingRoomDto>> getAllMeetingRooms(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(required = false) String department,
            Principal principal
    ) {
        User currentUser = resolveCurrentUser(principal);
        return ResponseEntity.ok(masterDataService.getMeetingRooms(activeOnly, department, currentUser));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get Meeting Room by ID", description = "Fetch single meeting room metadata.")
    public ResponseEntity<MeetingRoomDto> getMeetingRoomById(@PathVariable UUID id) {
        return ResponseEntity.ok(masterDataService.getMeetingRoomById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECRETARY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create Meeting Room (Admin & Secretary)", description = "Admin or Department Secretary registers a new meeting room.")
    public ResponseEntity<MeetingRoomDto> createMeetingRoom(
            @Valid @RequestBody CreateMeetingRoomRequest request,
            Principal principal
    ) {
        User currentUser = resolveCurrentUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.createMeetingRoom(request, currentUser));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECRETARY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload Meeting Room Photo (Admin & Secretary)", description = "Uploads a photo for a meeting room facility.")
    public ResponseEntity<MeetingRoomDto> uploadRoomImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Principal principal
    ) {
        User currentUser = resolveCurrentUser(principal);
        return ResponseEntity.ok(masterDataService.uploadRoomImage(id, file, currentUser));
    }

    @GetMapping("/images/{filename:.+}")
    @Operation(summary = "Serve Uploaded Room Image (Public)", description = "Streams uploaded room photo file securely.")
    public ResponseEntity<Resource> serveRoomImage(@PathVariable String filename) {
        try {
            // Prevent directory traversal attacks
            String safeFileName = java.nio.file.Paths.get(filename).getFileName().toString();
            java.nio.file.Path baseDir = java.nio.file.Paths.get("uploads/rooms").toAbsolutePath().normalize();
            java.nio.file.Path filePath = baseDir.resolve(safeFileName).normalize();

            if (!filePath.startsWith(baseDir)) {
                return ResponseEntity.badRequest().build();
            }

            File file = filePath.toFile();
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            String contentType = filename.toLowerCase().endsWith(".png") ? MediaType.IMAGE_PNG_VALUE : MediaType.IMAGE_JPEG_VALUE;
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECRETARY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update Meeting Room (Admin & Secretary)", description = "Admin or Department Secretary updates meeting room details.")
    public ResponseEntity<MeetingRoomDto> updateMeetingRoom(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMeetingRoomRequest request,
            Principal principal
    ) {
        User currentUser = resolveCurrentUser(principal);
        return ResponseEntity.ok(masterDataService.updateMeetingRoom(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECRETARY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete Meeting Room (Admin & Secretary)", description = "Admin or Department Secretary removes a meeting room.")
    public ResponseEntity<Map<String, String>> deleteMeetingRoom(
            @PathVariable UUID id,
            Principal principal
    ) {
        User currentUser = resolveCurrentUser(principal);
        masterDataService.deleteMeetingRoom(id, currentUser);
        return ResponseEntity.ok(Map.of(
                "message", "Meeting room successfully deleted.",
                "deletedId", id.toString()
        ));
    }

    private User resolveCurrentUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }
}
