import { create } from 'zustand';
import { toast } from 'sonner';
import userApi from '../api/userApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useUserStore = create((set, get) => ({
  users: [],
  totalElements: 0,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
  userStats: null,
  rolesCatalog: [],
  isLoading: false,
  error: null,

  filters: {
    search: '',
    department: '',
    role: '',
    isEnabled: '',
  },

  selectedUser: null,
  isOnboardModalOpen: false,
  isRolesModalOpen: false,
  roleTargetUser: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 0,
    }));
    get().fetchUsers();
  },

  resetFilters: () => {
    set({
      filters: { search: '', department: '', role: '', isEnabled: '' },
      currentPage: 0,
    });
    get().fetchUsers();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchUsers();
  },

  openOnboardModal: () => set({ isOnboardModalOpen: true }),
  closeOnboardModal: () => set({ isOnboardModalOpen: false }),

  openRolesModal: (user) => set({ roleTargetUser: user, isRolesModalOpen: true }),
  closeRolesModal: () => set({ roleTargetUser: null, isRolesModalOpen: false }),

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, currentPage, pageSize } = get();
      const params = {
        page: currentPage,
        size: pageSize,
        ...(filters.search && { search: filters.search.trim() }),
        ...(filters.department && { department: filters.department }),
        ...(filters.role && { role: filters.role }),
        ...(filters.isEnabled !== '' && { isEnabled: filters.isEnabled === 'true' }),
      };

      const data = await userApi.getAllUsers(params);

      set({
        users: data.content || data || [],
        totalElements: data.totalElements || (data.content || data || []).length,
        totalPages: data.totalPages || 1,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to fetch staff users list.';
      set({ isLoading: false, error: errorMsg });
    }
  },

  fetchStatsAndRoles: async () => {
    try {
      const [stats, roles] = await Promise.all([
        userApi.getUserStats(),
        userApi.getAllRoles(),
      ]);
      set({ userStats: stats, rolesCatalog: roles });
    } catch (e) {
      console.warn('Failed to load user stats or roles catalog:', e);
    }
  },

  onboardUser: async (payload) => {
    try {
      const newUser = await userApi.onboardUser(payload);
      soundPlayer.playNotificationChime();
      toast.success(
        `Staff member "${newUser.username || payload.username}" successfully onboarded.`
      );
      get().closeOnboardModal();
      get().fetchUsers();
      get().fetchStatsAndRoles();
      return { success: true, user: newUser };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to onboard staff user.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  assignRoles: async (userId, roleNames) => {
    try {
      const updated = await userApi.updateUserRoles(userId, { roleNames });
      soundPlayer.playNotificationChime();
      toast.success('Authorization roles updated successfully.');
      get().closeRolesModal();
      get().fetchUsers();
      return { success: true, user: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to update roles.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  unlockAccount: async (user) => {
    try {
      await userApi.updateUserStatus(user.id, {
        isEnabled: user.isEnabled,
        isAccountNonLocked: true,
      });
      soundPlayer.playNotificationChime();
      toast.success(`Account for "${user.username}" unlocked. Login attempts reset.`);
      get().fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock account.');
    }
  },

  toggleEnableStatus: async (user) => {
    const nextStatus = !user.isEnabled;
    try {
      await userApi.updateUserStatus(user.id, {
        isEnabled: nextStatus,
        isAccountNonLocked: user.isAccountNonLocked,
      });
      toast.info(
        `User account "${user.username}" is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}.`
      );
      get().fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  },

  deleteUser: async (userId, username) => {
    try {
      await userApi.deleteUser(userId);
      toast.success(`User account "${username}" removed.`);
      get().fetchUsers();
      get().fetchStatsAndRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  },
}));

export default useUserStore;
