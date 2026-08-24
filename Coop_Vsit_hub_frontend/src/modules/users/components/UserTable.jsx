import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Shield,
  Unlock,
  Lock,
  UserX,
  UserCheck,
  Trash2,
  Building2,
  Mail,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import useUserStore from '../store/userStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const UserTable = () => {
  const {
    users,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    setPage,
    openRolesModal,
    unlockAccount,
    toggleEnableStatus,
    deleteUser,
  } = useUserStore();

  const { user: currentAuthUser } = useAuthStore();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return (username || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Staff Member</th>
              <th className="py-3.5 px-4">Department & Role</th>
              <th className="py-3.5 px-4">Authorization Roles</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-bold text-slate-500">Loading staff users directory...</p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Staff Users Found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filters.</p>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isCurrentUser = currentAuthUser?.username === u.username;
                const isLocked = u.isAccountNonLocked === false;
                const isEnabled = u.isEnabled !== false;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* User Profile Info */}
                    <td className="py-4 pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-[#00adef] to-[#e38524] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                          {getInitials(u.firstName, u.lastName, u.username)}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <p className="font-bold text-[#000000] truncate">
                            {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                            {isCurrentUser && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-50 text-[#00adef] border border-sky-200">
                                YOU
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Job Title */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <p className="text-[#000000] truncate max-w-[170px]">
                        {u.department || 'Digital Banking'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal truncate max-w-[170px]">
                        {u.jobTitle || 'Bank Officer'}
                      </p>
                    </td>

                    {/* Authorization Roles */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(u.roles || ['ROLE_EMPLOYEE']).map((r) => {
                          const roleName = typeof r === 'string' ? r : r.name;
                          return (
                            <span
                              key={roleName}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase"
                            >
                              {roleName.replace('ROLE_', '')}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Account Status Badge */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Locked (3 Attempts)</span>
                          </span>
                        ) : isEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold">
                            <span>Deactivated</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-[11px] text-slate-500 font-medium">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Active Member'}
                    </td>

                    {/* Actions Dropdown Button */}
                    <td
                      className="py-4 pr-6 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left" ref={openDropdownId === u.id ? dropdownRef : null}>
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(u.id, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            openDropdownId === u.id
                              ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openDropdownId === u.id ? 'rotate-180 text-white' : 'text-slate-400'
                          }`} />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === u.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                            {/* 1. Assign Roles */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openRolesModal(u);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Shield className="w-4 h-4 text-[#00adef]" />
                              <span>Assign Roles</span>
                            </button>

                            {/* 2. Unlock Account (if locked) */}
                            {isLocked && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  unlockAccount(u);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Unlock className="w-4 h-4 text-emerald-600" />
                                <span>Unlock Account</span>
                              </button>
                            )}

                            {/* 3. Enable / Disable Status */}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  toggleEnableStatus(u);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                {isEnabled ? (
                                  <>
                                    <UserX className="w-4 h-4 text-amber-600" />
                                    <span>Deactivate Access</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Activate Access</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* 4. Delete Account (Admin only, not self) */}
                            {!isCurrentUser && (
                              <div className="pt-1 mt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    if (
                                      window.confirm(
                                        `Are you sure you want to permanently delete user "${u.username}"?`
                                      )
                                    ) {
                                      deleteUser(u.id, u.username);
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  <span>Delete User</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing page <span className="font-bold text-[#000000]">{currentPage + 1}</span> of{' '}
          <span className="font-bold text-[#000000]">{totalPages || 1}</span> ({totalElements} staff members)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
