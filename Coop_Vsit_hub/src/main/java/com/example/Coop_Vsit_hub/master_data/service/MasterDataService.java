package com.example.coop_vsit_hub.master_data.service;

import com.example.coop_vsit_hub.master_data.dto.*;

import java.util.List;
import java.util.UUID;

public interface MasterDataService {

    // --- Departments ---
    List<DepartmentDto> getAllDepartments(boolean activeOnly);
    DepartmentDto getDepartmentById(UUID id);
    DepartmentDto createDepartment(CreateDepartmentRequest request);
    DepartmentDto updateDepartment(UUID id, UpdateDepartmentRequest request);
    void deleteDepartment(UUID id);

    // --- Partnership Categories ---
    List<PartnershipCategoryDto> getAllCategories(boolean activeOnly);
    PartnershipCategoryDto getCategoryById(UUID id);
    PartnershipCategoryDto createCategory(CreatePartnershipCategoryRequest request);
    PartnershipCategoryDto updateCategory(UUID id, UpdatePartnershipCategoryRequest request);
    void deleteCategory(UUID id);

    // --- Meeting Rooms ---
    List<MeetingRoomDto> getAllMeetingRooms(boolean activeOnly);
    MeetingRoomDto getMeetingRoomById(UUID id);
    MeetingRoomDto createMeetingRoom(CreateMeetingRoomRequest request);
    MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request);
    void deleteMeetingRoom(UUID id);
}
