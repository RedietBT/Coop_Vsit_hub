package com.example.coop_vsit_hub.master_data.controller;

import com.example.coop_vsit_hub.master_data.dto.CreateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.dto.MeetingRoomDto;
import com.example.coop_vsit_hub.master_data.dto.UpdateMeetingRoomRequest;
import com.example.coop_vsit_hub.master_data.service.MasterDataService;
import com.example.coop_vsit_hub.user_and_auth.dto.UserDetailResponse;
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

    @org.springframework.beans.factory.annotation.Value("${coopbank.rooms.upload-dir:uploads/rooms/}")
    private String roomsUploadDir;

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

    @GetMapping("/custodians")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECRETARY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List Eligible Room Custodians", description = "Retrieves active staff users who can be assigned as custodians for meeting rooms.")
    public ResponseEntity<List<UserDetailResponse>> getEligibleCustodians(
            @RequestParam(required = false) String department
    ) {
        return ResponseEntity.ok(masterDataService.getEligibleCustodians(department));
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

            // Check primary configured upload directory
            String uploadBase = (roomsUploadDir != null && !roomsUploadDir.isBlank()) ? roomsUploadDir : "uploads/rooms/";
            java.nio.file.Path baseDir = java.nio.file.Paths.get(uploadBase).toAbsolutePath().normalize();
            java.nio.file.Path filePath = baseDir.resolve(safeFileName).normalize();

            File targetFile = filePath.toFile();

            // Fallback 1: check relative "uploads/rooms/"
            if (!targetFile.exists() || !targetFile.isFile()) {
                File relFile = java.nio.file.Paths.get("uploads/rooms").toAbsolutePath().resolve(safeFileName).toFile();
                if (relFile.exists() && relFile.isFile()) {
                    targetFile = relFile;
                }
            }

            // Fallback 2: check inside working directory or parent directory if running from subfolder
            if (!targetFile.exists() || !targetFile.isFile()) {
                File parentRelFile = java.nio.file.Paths.get("../uploads/rooms").toAbsolutePath().resolve(safeFileName).toFile();
                if (parentRelFile.exists() && parentRelFile.isFile()) {
                    targetFile = parentRelFile;
                }
            }

            if (!targetFile.exists() || !targetFile.isFile()) {
                log.warn("Meeting room image file not found on disk: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(targetFile);
            String contentType = resolveContentType(safeFileName, targetFile);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);
        } catch (Exception e) {
            log.warn("Could not serve room image '{}': {}", filename, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private String resolveContentType(String filename, File file) {
        if (file != null) {
            try {
                String probed = java.nio.file.Files.probeContentType(file.toPath());
                if (probed != null && !probed.isBlank()) return probed;
            } catch (Exception ignored) {}
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG_VALUE;
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        return MediaType.IMAGE_JPEG_VALUE;
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
