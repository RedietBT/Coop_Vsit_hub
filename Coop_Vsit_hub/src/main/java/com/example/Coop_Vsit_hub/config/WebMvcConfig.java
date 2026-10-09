package com.example.coop_vsit_hub.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC Configuration for serving uploaded attachment files as static resources
 * (CORS is configured in {@link SecurityConfig}.)
 * Configured upload directory is created on startup if it does not exist.
 */
@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${coopbank.files.upload-dir:uploads/attachments/}")
    private String uploadDir;

    @Value("${coopbank.rooms.upload-dir:uploads/rooms/}")
    private String roomsUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Attachments upload directory
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        File dir = uploadPath.toFile();
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (created) {
                log.info("Created file upload directory: {}", uploadPath);
            } else {
                log.warn("Could not create upload directory: {}", uploadPath);
            }
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath.toUri().toString());

        // 2. Room images upload directory & static fallback
        Path roomsPath = Paths.get(roomsUploadDir).toAbsolutePath();
        File roomsDir = roomsPath.toFile();
        if (!roomsDir.exists()) {
            roomsDir.mkdirs();
        }

        java.util.List<String> roomLocations = new java.util.ArrayList<>();
        roomLocations.add(roomsPath.toUri().toString());

        // Add cross-folder fallbacks for local dev / workspace subfolders
        for (String fallbackPath : java.util.List.of(
                "uploads/rooms/",
                "../uploads/rooms/",
                "Coop_Vsit_hub/uploads/rooms/",
                "../Coop_Vsit_hub/uploads/rooms/",
                "Coop_Vsit_hub_frontend/public/rooms/",
                "../Coop_Vsit_hub_frontend/public/rooms/"
        )) {
            File fbFile = Paths.get(fallbackPath).toAbsolutePath().toFile();
            if (fbFile.exists()) {
                roomLocations.add(fbFile.toPath().toUri().toString());
            }
        }

        roomLocations.add("classpath:/static/rooms/");
        roomLocations.add("classpath:/static/");

        registry.addResourceHandler("/rooms/**", "/uploads/rooms/**")
                .addResourceLocations(roomLocations.toArray(new String[0]));

        log.info("File upload directory resolved to: {}", uploadPath);
        log.info("Room photos locations resolved to: {}", roomLocations);
    }
}
