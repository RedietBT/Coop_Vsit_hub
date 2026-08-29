package com.example.coop_vsit_hub.master_data.service;

import com.example.coop_vsit_hub.master_data.dto.*;
import com.example.coop_vsit_hub.master_data.entity.Department;
import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import com.example.coop_vsit_hub.master_data.entity.PartnershipCategory;
import com.example.coop_vsit_hub.master_data.repository.DepartmentRepository;
import com.example.coop_vsit_hub.master_data.repository.MeetingRoomRepository;
import com.example.coop_vsit_hub.master_data.repository.PartnershipCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataServiceImpl implements MasterDataService {

    private final DepartmentRepository departmentRepository;
    private final PartnershipCategoryRepository categoryRepository;
    private final MeetingRoomRepository meetingRoomRepository;

    // =========================================================================
    // 1. DEPARTMENTS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "departments", key = "#activeOnly")
    public List<DepartmentDto> getAllDepartments(boolean activeOnly) {
        log.info("Fetching all departments (activeOnly={})", activeOnly);
        List<Department> list = activeOnly
                ? departmentRepository.findByIsActiveTrueOrderByNameAsc()
                : departmentRepository.findAllByOrderByNameAsc();
        return list.stream().map(DepartmentDto::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(UUID id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));
        return DepartmentDto.from(dept);
    }

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentDto createDepartment(CreateDepartmentRequest request) {
        log.info("Creating department: '{}'", request.getName());

        if (departmentRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("A department with name '" + request.getName() + "' already exists.");
        }

        Department department = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode() != null ? request.getCode().trim().toUpperCase() : null)
                .description(request.getDescription())
                .isActive(true)
                .build();

        Department saved = departmentRepository.save(department);
        return DepartmentDto.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public DepartmentDto updateDepartment(UUID id, UpdateDepartmentRequest request) {
        log.info("Updating department ID: {}", id);

        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));

        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new IllegalArgumentException("Another department with name '" + request.getName() + "' already exists.");
        }

        dept.setName(request.getName().trim());
        if (request.getCode() != null) {
            dept.setCode(request.getCode().trim().toUpperCase());
        }
        dept.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            dept.setIsActive(request.getIsActive());
        }

        Department updated = departmentRepository.save(dept);
        return DepartmentDto.from(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void deleteDepartment(UUID id) {
        log.info("Deleting department ID: {}", id);
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));

        boolean isAssignedToRoom = meetingRoomRepository.existsByDepartmentIgnoreCase(dept.getName());
        if (isAssignedToRoom) {
            throw new IllegalStateException("Cannot delete department '" + dept.getName() + "' because it is currently assigned to one or more meeting rooms. Please reassign the meeting rooms before deleting.");
        }
        departmentRepository.delete(dept);
    }

    // =========================================================================
    // 2. PARTNERSHIP CATEGORIES
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "partnership_categories", key = "#activeOnly")
    public List<PartnershipCategoryDto> getAllCategories(boolean activeOnly) {
        log.info("Fetching all partnership categories (activeOnly={})", activeOnly);
        List<PartnershipCategory> list = activeOnly
                ? categoryRepository.findByIsActiveTrueOrderByNameAsc()
                : categoryRepository.findAllByOrderByNameAsc();
        return list.stream().map(PartnershipCategoryDto::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PartnershipCategoryDto getCategoryById(UUID id) {
        PartnershipCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partnership category not found with ID: " + id));
        return PartnershipCategoryDto.from(cat);
    }

    @Override
    @Transactional
    @CacheEvict(value = "partnership_categories", allEntries = true)
    public PartnershipCategoryDto createCategory(CreatePartnershipCategoryRequest request) {
        log.info("Creating partnership category: '{}'", request.getName());

        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("A category with name '" + request.getName() + "' already exists.");
        }

        PartnershipCategory category = PartnershipCategory.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isActive(true)
                .build();

        PartnershipCategory saved = categoryRepository.save(category);
        return PartnershipCategoryDto.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "partnership_categories", allEntries = true)
    public PartnershipCategoryDto updateCategory(UUID id, UpdatePartnershipCategoryRequest request) {
        log.info("Updating partnership category ID: {}", id);

        PartnershipCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partnership category not found with ID: " + id));

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new IllegalArgumentException("Another category with name '" + request.getName() + "' already exists.");
        }

        cat.setName(request.getName().trim());
        cat.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            cat.setIsActive(request.getIsActive());
        }

        PartnershipCategory updated = categoryRepository.save(cat);
        return PartnershipCategoryDto.from(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "partnership_categories", allEntries = true)
    public void deleteCategory(UUID id) {
        log.info("Deleting partnership category ID: {}", id);
        PartnershipCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partnership category not found with ID: " + id));
        categoryRepository.delete(cat);
    }

    // =========================================================================
    // 3. MEETING ROOMS
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "meeting_rooms", key = "#activeOnly")
    public List<MeetingRoomDto> getAllMeetingRooms(boolean activeOnly) {
        log.info("Fetching all meeting rooms (activeOnly={})", activeOnly);
        List<MeetingRoom> list = activeOnly
                ? meetingRoomRepository.findByIsActiveTrueOrderByNameAsc()
                : meetingRoomRepository.findAllByOrderByNameAsc();
        return list.stream().map(MeetingRoomDto::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MeetingRoomDto getMeetingRoomById(UUID id) {
        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));
        return MeetingRoomDto.from(room);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto createMeetingRoom(CreateMeetingRoomRequest request) {
        log.info("Creating meeting room: '{}'", request.getName());

        if (meetingRoomRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("A meeting room with name '" + request.getName() + "' already exists.");
        }

        MeetingRoom room = MeetingRoom.builder()
                .name(request.getName().trim())
                .floorLocation(request.getFloorLocation())
                .department(request.getDepartment())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 10)
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .isActive(true)
                .build();

        MeetingRoom saved = meetingRoomRepository.save(room);
        return MeetingRoomDto.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request) {
        log.info("Updating meeting room ID: {}", id);

        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));

        if (meetingRoomRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new IllegalArgumentException("Another meeting room with name '" + request.getName() + "' already exists.");
        }

        room.setName(request.getName().trim());
        room.setFloorLocation(request.getFloorLocation());
        if (request.getDepartment() != null) {
            room.setDepartment(request.getDepartment());
        }
        if (request.getCapacity() != null) {
            room.setCapacity(request.getCapacity());
        }
        if (request.getImageUrl() != null) {
            room.setImageUrl(request.getImageUrl());
        }
        room.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            room.setIsActive(request.getIsActive());
        }

        MeetingRoom updated = meetingRoomRepository.save(room);
        return MeetingRoomDto.from(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto uploadRoomImage(UUID id, org.springframework.web.multipart.MultipartFile file) {
        log.info("Uploading image for meeting room ID: {}", id);

        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded image file cannot be empty.");
        }

        try {
            // Save file in static uploads directory
            String uploadsDir = "uploads/rooms/";
            java.io.File directory = new java.io.File(uploadsDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";

            String filename = "room_" + id + "_" + System.currentTimeMillis() + extension;
            java.nio.file.Path targetPath = java.nio.file.Paths.get(uploadsDir + filename);
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/v1/meeting-rooms/images/" + filename;
            room.setImageUrl(fileUrl);

            MeetingRoom saved = meetingRoomRepository.save(room);
            log.info("Room image saved successfully: {}", fileUrl);
            return MeetingRoomDto.from(saved);
        } catch (Exception e) {
            log.error("Failed to upload room image: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to store room image: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public void deleteMeetingRoom(UUID id) {
        log.info("Deleting meeting room ID: {}", id);
        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));
        meetingRoomRepository.delete(room);
    }
}
