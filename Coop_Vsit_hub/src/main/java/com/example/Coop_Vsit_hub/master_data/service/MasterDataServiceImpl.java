package com.example.coop_vsit_hub.master_data.service;

import com.example.coop_vsit_hub.master_data.dto.*;
import com.example.coop_vsit_hub.master_data.entity.Department;
import com.example.coop_vsit_hub.master_data.entity.MeetingRoom;
import com.example.coop_vsit_hub.master_data.repository.DepartmentRepository;
import com.example.coop_vsit_hub.master_data.repository.MeetingRoomRepository;
import com.example.coop_vsit_hub.user_and_auth.dto.UserDetailResponse;
import com.example.coop_vsit_hub.user_and_auth.enums.RoleName;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import com.example.coop_vsit_hub.user_and_auth.repository.UserRepository;
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
    private final MeetingRoomRepository meetingRoomRepository;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Value("${coopbank.rooms.upload-dir:uploads/rooms/}")
    private String roomsUploadDir;

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
    // 2. MEETING ROOMS
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
    public List<MeetingRoomDto> getMeetingRoomsForUser(boolean activeOnly, User currentUser) {
        return getMeetingRooms(activeOnly, null, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeetingRoomDto> getMeetingRooms(boolean activeOnly, String department, User currentUser) {
        if (department != null && !department.isBlank()) {
            log.info("Filtering meeting rooms by department: '{}'", department);
            List<MeetingRoom> list = activeOnly
                    ? meetingRoomRepository.findByDepartmentIgnoreCaseAndIsActiveTrueOrderByNameAsc(department.trim())
                    : meetingRoomRepository.findByDepartmentIgnoreCaseOrderByNameAsc(department.trim());
            return list.stream().map(MeetingRoomDto::from).collect(Collectors.toList());
        }
        return getAllMeetingRooms(activeOnly);
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
        return createMeetingRoom(request, null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto createMeetingRoom(CreateMeetingRoomRequest request, User currentUser) {
        log.info("Creating meeting room: '{}' (by user: {})", request.getName(), currentUser != null ? currentUser.getUsername() : "system");

        if (currentUser != null && isSecretary(currentUser)) {
            String userDept = currentUser.getDepartment();
            if (userDept != null && !userDept.isBlank()) {
                request.setDepartment(userDept.trim());
            } else {
                throw new IllegalArgumentException("Secretary user does not have an assigned department in Visit Hub.");
            }
        }

        if (meetingRoomRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("A meeting room with name '" + request.getName() + "' already exists.");
        }

        UUID assignedUserId = request.getAssignedUserId();
        String assignedUserName = request.getAssignedUserName();
        String contactEmail = request.getContactEmail() != null && !request.getContactEmail().isBlank()
                ? request.getContactEmail().trim() : null;

        if (assignedUserId != null) {
            var userOpt = userRepository.findById(assignedUserId);
            if (userOpt.isPresent()) {
                var u = userOpt.get();
                if (assignedUserName == null || assignedUserName.isBlank()) {
                    assignedUserName = u.getFullName();
                }
                if (contactEmail == null || contactEmail.isBlank()) {
                    contactEmail = u.getEmail();
                }
            }
        } else if (contactEmail != null) {
            var userOpt = userRepository.findByEmailIgnoreCase(contactEmail);
            if (userOpt.isPresent()) {
                assignedUserId = userOpt.get().getId();
                assignedUserName = userOpt.get().getFullName();
            }
        }

        MeetingRoom room = MeetingRoom.builder()
                .name(request.getName().trim())
                .floorLocation(request.getFloorLocation())
                .department(request.getDepartment())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 10)
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .assignedUserId(assignedUserId)
                .assignedUserName(assignedUserName)
                .contactEmail(contactEmail)
                .isActive(true)
                .build();

        MeetingRoom saved = meetingRoomRepository.save(room);
        return MeetingRoomDto.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request) {
        return updateMeetingRoom(id, request, null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request, User currentUser) {
        log.info("Updating meeting room ID: {} (by user: {})", id, currentUser != null ? currentUser.getUsername() : "system");

        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));

        if (currentUser != null && isSecretary(currentUser)) {
            String userDept = currentUser.getDepartment();
            if (userDept != null && !userDept.isBlank()) {
                if (room.getDepartment() != null && !room.getDepartment().equalsIgnoreCase(userDept.trim())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: Secretaries can only update meeting rooms assigned to their department ('" + userDept + "').");
                }
                request.setDepartment(userDept.trim());
            }
        }

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

        // Handle assigned custodian & contact email
        if (request.getAssignedUserId() != null) {
            room.setAssignedUserId(request.getAssignedUserId());
            var userOpt = userRepository.findById(request.getAssignedUserId());
            if (userOpt.isPresent()) {
                var u = userOpt.get();
                room.setAssignedUserName(request.getAssignedUserName() != null && !request.getAssignedUserName().isBlank()
                        ? request.getAssignedUserName().trim() : u.getFullName());
                if (request.getContactEmail() == null || request.getContactEmail().isBlank()) {
                    room.setContactEmail(u.getEmail());
                } else {
                    room.setContactEmail(request.getContactEmail().trim());
                }
            } else if (request.getAssignedUserName() != null) {
                room.setAssignedUserName(request.getAssignedUserName().trim());
            }
        } else if (request.getAssignedUserName() != null && request.getAssignedUserName().isBlank()) {
            room.setAssignedUserId(null);
            room.setAssignedUserName(null);
        }

        if (request.getContactEmail() != null) {
            if (request.getContactEmail().isBlank()) {
                room.setContactEmail(null);
                if (request.getAssignedUserId() == null) {
                    room.setAssignedUserId(null);
                    room.setAssignedUserName(null);
                }
            } else {
                room.setContactEmail(request.getContactEmail().trim());
                if (room.getAssignedUserId() == null) {
                    userRepository.findByEmailIgnoreCase(request.getContactEmail().trim()).ifPresent(u -> {
                        room.setAssignedUserId(u.getId());
                        room.setAssignedUserName(u.getFullName());
                    });
                }
            }
        }

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
        return uploadRoomImage(id, file, null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public MeetingRoomDto uploadRoomImage(UUID id, org.springframework.web.multipart.MultipartFile file, User currentUser) {
        log.info("Uploading image for meeting room ID: {} (by user: {})", id, currentUser != null ? currentUser.getUsername() : "system");

        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));

        // Enforce department ownership for Secretaries
        if (currentUser != null && isSecretary(currentUser)) {
            String userDept = currentUser.getDepartment();
            if (userDept != null && !userDept.isBlank()) {
                if (room.getDepartment() != null && !room.getDepartment().equalsIgnoreCase(userDept.trim())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: Secretaries can only upload photos for meeting rooms assigned to their department ('" + userDept + "').");
                }
            }
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded image file cannot be empty.");
        }

        // Limit file size to 15MB (supports raw smartphone camera captures)
        if (file.getSize() > 15 * 1024 * 1024) {
            throw new IllegalArgumentException("Image file size exceeds 15MB limit. Please upload a photo smaller than 15MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        } else if (file.getContentType() != null) {
            if (file.getContentType().contains("png")) extension = "png";
            else if (file.getContentType().contains("webp")) extension = "webp";
            else extension = "jpg";
        }

        java.util.Set<String> allowedExtensions = java.util.Set.of("jpg", "jpeg", "png", "webp", "jfif", "heic", "heif", "svg");
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("Invalid image format '." + extension + "'. Allowed formats: JPG, JPEG, PNG, WEBP, JFIF, HEIC, SVG.");
        }

        try {
            // Save file in configurable uploads directory
            String uploadBase = (roomsUploadDir != null && !roomsUploadDir.isBlank()) ? roomsUploadDir : "uploads/rooms/";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadBase).toAbsolutePath().normalize();
            java.io.File directory = uploadPath.toFile();
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String filename = "room_" + id + "_" + System.currentTimeMillis() + "." + extension;
            java.nio.file.Path targetPath = uploadPath.resolve(filename).normalize();
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/v1/meeting-rooms/images/" + filename;
            room.setImageUrl(fileUrl);

            MeetingRoom saved = meetingRoomRepository.save(room);
            log.info("Room image saved successfully: {} -> {}", fileUrl, targetPath);
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
        deleteMeetingRoom(id, null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "meeting_rooms", allEntries = true)
    public void deleteMeetingRoom(UUID id, User currentUser) {
        log.info("Deleting meeting room ID: {} (by user: {})", id, currentUser != null ? currentUser.getUsername() : "system");
        MeetingRoom room = meetingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found with ID: " + id));

        if (currentUser != null && isSecretary(currentUser)) {
            String userDept = currentUser.getDepartment();
            if (userDept != null && !userDept.isBlank()) {
                if (room.getDepartment() != null && !room.getDepartment().equalsIgnoreCase(userDept.trim())) {
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Access Denied: Secretaries can only delete meeting rooms assigned to their department ('" + userDept + "').");
                }
            }
        }
        meetingRoomRepository.delete(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDetailResponse> getEligibleCustodians(String department) {
        log.info("Fetching eligible room custodians (department filter: '{}')", department);
        List<User> users = userRepository.findAll().stream()
                .filter(User::isEnabled)
                .sorted((a, b) -> {
                    String nameA = a.getFullName() != null ? a.getFullName() : a.getUsername();
                    String nameB = b.getFullName() != null ? b.getFullName() : b.getUsername();
                    return nameA.compareToIgnoreCase(nameB);
                })
                .toList();

        return users.stream().map(UserDetailResponse::from).toList();
    }

    private boolean isSecretary(User user) {
        return user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_SECRETARY);
    }
}
