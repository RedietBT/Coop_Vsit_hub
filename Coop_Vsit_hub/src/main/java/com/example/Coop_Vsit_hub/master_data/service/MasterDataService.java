package com.example.coop_vsit_hub.master_data.service;

import com.example.coop_vsit_hub.master_data.dto.*;
import com.example.coop_vsit_hub.user_and_auth.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface MasterDataService {

    // --- Departments ---
    List<DepartmentDto> getAllDepartments(boolean activeOnly);
    DepartmentDto getDepartmentById(UUID id);
    DepartmentDto createDepartment(CreateDepartmentRequest request);
    DepartmentDto updateDepartment(UUID id, UpdateDepartmentRequest request);
    void deleteDepartment(UUID id);

    // --- Meeting Rooms ---
    List<MeetingRoomDto> getAllMeetingRooms(boolean activeOnly);
    List<MeetingRoomDto> getMeetingRoomsForUser(boolean activeOnly, User currentUser);
    MeetingRoomDto getMeetingRoomById(UUID id);
    MeetingRoomDto createMeetingRoom(CreateMeetingRoomRequest request);
    MeetingRoomDto createMeetingRoom(CreateMeetingRoomRequest request, User currentUser);
    MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request);
    MeetingRoomDto updateMeetingRoom(UUID id, UpdateMeetingRoomRequest request, User currentUser);
    MeetingRoomDto uploadRoomImage(UUID id, MultipartFile file);
    void deleteMeetingRoom(UUID id);
    void deleteMeetingRoom(UUID id, User currentUser);
}
