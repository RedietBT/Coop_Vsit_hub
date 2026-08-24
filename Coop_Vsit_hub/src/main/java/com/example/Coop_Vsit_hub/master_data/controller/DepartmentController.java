package com.example.coop_vsit_hub.master_data.controller;

import com.example.coop_vsit_hub.master_data.dto.CreateDepartmentRequest;
import com.example.coop_vsit_hub.master_data.dto.DepartmentDto;
import com.example.coop_vsit_hub.master_data.dto.UpdateDepartmentRequest;
import com.example.coop_vsit_hub.master_data.service.MasterDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "6. Master Data - Departments", description = "Dynamic bank department management and dropdown registry")
@SecurityRequirement(name = "bearerAuth")
public class DepartmentController {

    private final MasterDataService masterDataService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List All Departments", description = "Retrieve all bank requesting/hosting departments for dropdowns and filters.")
    public ResponseEntity<List<DepartmentDto>> getAllDepartments(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        return ResponseEntity.ok(masterDataService.getAllDepartments(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Department by ID", description = "Fetch single department metadata.")
    public ResponseEntity<DepartmentDto> getDepartmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(masterDataService.getDepartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Create New Department (Admin)", description = "Admin creates a new bank department.")
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(masterDataService.createDepartment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Update Department (Admin)", description = "Admin updates department name, code, description, or active status.")
    public ResponseEntity<DepartmentDto> updateDepartment(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentRequest request
    ) {
        return ResponseEntity.ok(masterDataService.updateDepartment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.example.coop_vsit_hub.user_and_auth.enums.RoleName).ADMIN)")
    @Operation(summary = "Delete Department (Admin)", description = "Admin removes a department from the register.")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable UUID id) {
        masterDataService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of(
                "message", "Department successfully deleted.",
                "deletedId", id.toString()
        ));
    }
}
