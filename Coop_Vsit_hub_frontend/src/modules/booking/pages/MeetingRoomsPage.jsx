import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DoorOpen,
  Plus,
  Search,
  Building2,
  Users,
  MapPin,
  Edit2,
  Trash2,
  Camera,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
  Layers,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import masterDataApi from '@/modules/master_data/api/masterDataApi';
import AddEditRoomModal from '../components/AddEditRoomModal';
import DeleteRoomConfirmModal from '../components/DeleteRoomConfirmModal';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';

export const MeetingRoomsPage = () => {
  const { user, hasRole } = useAuthStore();
  const { departments, fetchDepartments } = useMasterDataStore();

  const isAdmin = hasRole('ROLE_ADMIN');
  const isSecretary = hasRole('ROLE_SECRETARY');
  const secretaryDept = user?.department || '';

  // Room list & loading state
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(
    isSecretary && secretaryDept ? secretaryDept : ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch all meeting rooms
  const loadMeetingRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all rooms (including active & inactive) for management view
      const data = await masterDataApi.getMeetingRooms(false);
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load meeting rooms:', e);
      toast.error('Failed to load meeting rooms list.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDepartments(true);
    loadMeetingRooms();
  }, [fetchDepartments, loadMeetingRooms]);

  // Set default department filter once user loads
  useEffect(() => {
    if (isSecretary && secretaryDept && !selectedDeptFilter) {
      setSelectedDeptFilter(secretaryDept);
    }
  }, [isSecretary, secretaryDept, selectedDeptFilter]);

  // Permission helper: does current user have rights to manage this room?
  const canManageRoom = useCallback(
    (room) => {
      if (isAdmin) return true;
      if (!isSecretary || !secretaryDept || !room?.department) return false;
      return room.department.trim().toLowerCase() === secretaryDept.trim().toLowerCase();
    },
    [isAdmin, isSecretary, secretaryDept]
  );

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Department filter
      if (selectedDeptFilter) {
        const roomDept = (room.department || '').trim().toLowerCase();
        const filterDept = selectedDeptFilter.trim().toLowerCase();
        if (roomDept !== filterDept) return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && room.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && room.isActive !== false) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = (room.name || '').toLowerCase().includes(query);
        const matchLocation = (room.floorLocation || room.location || '')
          .toLowerCase()
          .includes(query);
        const matchDept = (room.department || '').toLowerCase().includes(query);
        const matchDesc = (room.description || '').toLowerCase().includes(query);
        if (!matchName && !matchLocation && !matchDept && !matchDesc) return false;
      }

      return true;
    });
  }, [rooms, selectedDeptFilter, statusFilter, searchTerm]);

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setRoomToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    if (!canManageRoom(room)) {
      toast.error('You are only authorized to manage meeting rooms for your department.');
      return;
    }
    setRoomToEdit(room);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDeleteModal = (room) => {
    if (!canManageRoom(room)) {
      toast.error('You are only authorized to manage meeting rooms for your department.');
      return;
    }
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* 1. Page Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider">
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Facility & Room Management</span>
            </span>

            {isSecretary && secretaryDept && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assigned: {secretaryDept}</span>
              </span>
            )}

            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-[#e38524] border border-amber-200 text-xs font-bold">
                <span>All Facilities Admin</span>
              </span>
            )}
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Meeting Rooms Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure conference rooms, manage seating capacities, upload facility photos, and oversee department room availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMeetingRooms}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>

          {/* Add Room Button: Enabled for Admin, or for Secretary if they have a department */}
          {(isAdmin || (isSecretary && secretaryDept)) && (
            <Button
              variant="orange"
              size="sm"
              onClick={handleOpenAddModal}
              icon={Plus}
            >
              Add Meeting Room
            </Button>
          )}
        </div>
      </div>

      {/* Secretary Warning if no department assigned */}
      {isSecretary && !secretaryDept && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No Department Assigned</p>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Your secretary account does not currently have a linked department. Please contact a system administrator to update your user profile with an assigned department before you can add or manage meeting rooms.
            </p>
          </div>
        </div>
      )}

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rooms by name, floor location, or amenities..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00adef] focus:bg-white transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs font-semibold py-2.5 px-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold py-2.5 px-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedDeptFilter || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDeptFilter(isSecretary && secretaryDept ? secretaryDept : '');
                setStatusFilter('ALL');
              }}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Room Cards Grid */}
      {isLoading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200/90 p-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Spinner size="lg" color="orange" />
            <p className="text-xs font-bold text-slate-500">Loading meeting rooms directory...</p>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/90 p-8 space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <DoorOpen className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900">
            No Meeting Rooms Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {selectedDeptFilter
              ? `No rooms matched for department "${selectedDeptFilter}".`
              : 'No facilities match your search criteria.'}
          </p>
          {(isAdmin || (isSecretary && secretaryDept)) && (
            <div className="pt-2">
              <Button
                variant="orange"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddModal}
              >
                Create Room for {secretaryDept || 'Facilities'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const hasPermission = canManageRoom(room);
            const isActive = room.isActive !== false;

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <DoorOpen className="w-10 h-10 mb-1 opacity-40 text-slate-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          CoopBank Facility
                        </span>
                      </div>
                    )}

                    {/* Active/Inactive Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                          isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Capacity Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs border border-white">
                        <Users className="w-3 h-3 text-[#00adef]" />
                        <span>{room.capacity || 10} Seats</span>
                      </span>
                    </div>

                    {/* Floor Location Strip at Bottom of Image */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-3 pt-6 flex items-center gap-1.5 text-white text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                      <span className="truncate">
                        {room.floorLocation || room.location || 'Location Unspecified'}
                      </span>
                    </div>
                  </div>

                  {/* Room Details Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-heading font-black text-lg text-slate-900 group-hover:text-[#00adef] transition-colors truncate">
                        {room.name}
                      </h3>

                      {/* Department Tag */}
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                        <span className="font-semibold truncate">
                          {room.department || 'General Facility'}
                        </span>
                      </div>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[36px]">
                      {room.description ||
                        'Standard CoopBank meeting room facility equipped with presentation board and conference connectivity.'}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  {hasPermission ? (
                    <>
                      <div className="flex items-center gap-1">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(room)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#00adef] hover:text-[#00adef] text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Quick Photo Upload Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(room)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#00adef] hover:text-[#00adef] text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Upload or update room photography"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#00adef]" />
                          <span className="hidden sm:inline">Photo</span>
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(room)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Meeting Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    /* Read-Only External Department Indicator */
                    <div className="w-full flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>External Dept Room</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                        Read Only
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddEditRoomModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        roomToEdit={roomToEdit}
        onSuccess={loadMeetingRooms}
      />

      <DeleteRoomConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        room={roomToDelete}
        onSuccess={loadMeetingRooms}
      />
    </div>
  );
};

export default MeetingRoomsPage;
