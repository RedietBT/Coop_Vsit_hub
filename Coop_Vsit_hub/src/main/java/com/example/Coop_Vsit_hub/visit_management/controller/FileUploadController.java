package com.example.coop_vsit_hub.visit_management.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "File Uploads & Documents", description = "Secure file upload and download service for visits, organizations, and guests")
@Slf4j
public class FileUploadController {

    @Value("${coopbank.files.upload-dir:uploads/attachments/}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx", "txt", "csv"
    );

    @PostConstruct
    public void init() {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        File dir = uploadPath.toFile();
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (created) {
                log.info("File upload directory created: {}", uploadPath);
            } else {
                log.warn("Could not create upload directory: {}", uploadPath);
            }
        }
        log.info("File upload service initialized. Storage path: {}", uploadPath);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload Supporting Document (Max 5MB)",
               description = "Uploads an optional attachment (PDF, Word, Excel, Image) for visits, organizations, or individual guests.")
    public ResponseEntity<?> uploadFile(
            @Parameter(description = "File to upload (max 5MB)")
            @RequestParam("file") MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty or not provided."));
        }

        // File size restriction: 5MB
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of(
                    "error", "File size exceeds 5MB limit. Please upload a file smaller than 5MB.",
                    "maxSizeBytes", MAX_FILE_SIZE_BYTES,
                    "actualSizeBytes", file.getSize()
            ));
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "document";
        String extension = "";
        if (originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".") + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "File type '." + extension + "' is not supported. Allowed formats: PDF, PNG, JPG, DOCX, XLSX, TXT.",
                    "allowedTypes", ALLOWED_EXTENSIONS
            ));
        }

        try {
            String sanitizedOriginal = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID() + "_" + sanitizedOriginal;
            Path targetPath = Paths.get(uploadDir).toAbsolutePath().resolve(storedFileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/v1/files/download/" + storedFileName;
            log.info("File uploaded successfully: {} -> {}", originalName, fileUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("fileName", originalName);
            response.put("fileSize", file.getSize());
            response.put("contentType", file.getContentType());
            response.put("message", "File uploaded successfully");

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store uploaded file: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{fileName}")
    @Operation(summary = "Download or View Uploaded Document",
               description = "Streams the uploaded document with appropriate Content-Type.")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            // Prevent directory traversal attacks
            String safeFileName = Paths.get(fileName).getFileName().toString();
            Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(safeFileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
