import { create } from 'zustand';
import { toast } from 'sonner';
import masterDataApi from '../api/masterDataApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useMasterDataStore = create((set, get) => ({
  departments: [],
  categories: [],
  meetingRooms: [],
  isLoading: false,
  isMasterModalOpen: false,
  activeTab: 'departments', // 'departments' | 'categories' | 'rooms'

  openMasterModal: (tab = 'departments') =>
    set({ isMasterModalOpen: true, activeTab: tab }),
  closeMasterModal: () => set({ isMasterModalOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchAllMasterData: async () => {
    set({ isLoading: true });
    try {
      const [deptRes, catRes, roomRes] = await Promise.allSettled([
        masterDataApi.getDepartments(false),
        masterDataApi.getCategories(false),
        masterDataApi.getMeetingRooms(false),
      ]);

      set({
        departments: deptRes.status === 'fulfilled' ? deptRes.value : [],
        categories: catRes.status === 'fulfilled' ? catRes.value : [],
        meetingRooms: roomRes.status === 'fulfilled' ? roomRes.value : [],
        isLoading: false,
      });
    } catch (e) {
      console.warn('Failed to load master data:', e);
      set({ isLoading: false });
    }
  },

  fetchMeetingRooms: async (activeOnly = true) => {
    try {
      const rooms = await masterDataApi.getMeetingRooms(activeOnly);
      set({ meetingRooms: Array.isArray(rooms) ? rooms : [] });
      return rooms;
    } catch (e) {
      console.warn('Failed to fetch meeting rooms:', e);
      return [];
    }
  },

  fetchDepartments: async (activeOnly = true) => {
    try {
      const depts = await masterDataApi.getDepartments(activeOnly);
      set({ departments: Array.isArray(depts) ? depts : [] });
      return depts;
    } catch (e) {
      console.warn('Failed to fetch departments:', e);
      return [];
    }
  },

  fetchCategories: async (activeOnly = true) => {
    try {
      const cats = await masterDataApi.getCategories(activeOnly);
      set({ categories: Array.isArray(cats) ? cats : [] });
      return cats;
    } catch (e) {
      console.warn('Failed to fetch categories:', e);
      return [];
    }
  },

  // --- Departments Actions ---
  createDepartment: async (payload) => {
    try {
      const created = await masterDataApi.createDepartment(payload);
      soundPlayer.playNotificationChime();
      toast.success(`Department "${created.name}" created successfully.`);
      get().fetchAllMasterData();
      return { success: true, department: created };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to create department.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateDepartment: async (id, payload) => {
    try {
      const updated = await masterDataApi.updateDepartment(id, payload);
      toast.success(`Department "${updated.name}" updated.`);
      get().fetchAllMasterData();
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department.');
      return { success: false };
    }
  },

  deleteDepartment: async (id, name) => {
    try {
      await masterDataApi.deleteDepartment(id);
      toast.success(`Department "${name}" deleted.`);
      get().fetchAllMasterData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department.');
    }
  },

  // --- Partnership Categories Actions ---
  createCategory: async (payload) => {
    try {
      const created = await masterDataApi.createCategory(payload);
      soundPlayer.playNotificationChime();
      toast.success(`Category "${created.name}" created successfully.`);
      get().fetchAllMasterData();
      return { success: true, category: created };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to create category.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateCategory: async (id, payload) => {
    try {
      const updated = await masterDataApi.updateCategory(id, payload);
      toast.success(`Category "${updated.name}" updated.`);
      get().fetchAllMasterData();
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category.');
      return { success: false };
    }
  },

  deleteCategory: async (id, name) => {
    try {
      await masterDataApi.deleteCategory(id);
      toast.success(`Category "${name}" deleted.`);
      get().fetchAllMasterData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    }
  },

  // --- Meeting Rooms Actions ---
  createMeetingRoom: async (payload) => {
    try {
      const created = await masterDataApi.createMeetingRoom(payload);
      soundPlayer.playNotificationChime();
      toast.success(`Meeting Room "${created.name}" created.`);
      get().fetchAllMasterData();
      return { success: true, room: created };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to create meeting room.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateMeetingRoom: async (id, payload) => {
    try {
      const updated = await masterDataApi.updateMeetingRoom(id, payload);
      toast.success(`Meeting Room "${updated.name}" updated.`);
      get().fetchAllMasterData();
      return { success: true };
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update meeting room.'
      );
      return { success: false };
    }
  },

  deleteMeetingRoom: async (id, name) => {
    try {
      await masterDataApi.deleteMeetingRoom(id);
      toast.success(`Meeting Room "${name}" deleted.`);
      get().fetchAllMasterData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to delete meeting room.'
      );
    }
  },
}));

export default useMasterDataStore;
