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

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve upload dir to absolute path
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

        // Ensure the upload directory exists
        File dir = uploadPath.toFile();
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (created) {
                log.info("Created file upload directory: {}", uploadPath);
            } else {
                log.warn("Could not create upload directory: {}", uploadPath);
            }
        }

        // Map /api/v1/files/download/** → uploadDir so the controller's UrlResource works
        // Also expose /uploads/** as a direct static resource path for convenience
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + File.separator);

        log.info("File upload directory resolved to: {}", uploadPath);
    }
}
