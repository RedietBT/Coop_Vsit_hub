import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Check } from 'lucide-react';
import useUserStore from '../store/userStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

const AVAILABLE_ROLES = [
  {
    id: 'ROLE_ADMIN',
    label: 'System Administrator',
    desc: 'Full system configuration, master data & staff user control',
  },
  {
    id: 'ROLE_RELATIONSHIP_MANAGER',
    label: 'Relationship Manager',
    desc: 'Can submit, manage, and host delegations & corporate partners',
  },
  {
    id: 'ROLE_APPROVER',
    label: 'Executive Approver',
    desc: 'Can approve, reject, or schedule delegation visit requests',
  },
  {
    id: 'ROLE_SECURITY_DESK',
    label: 'Front Desk Reception',
    desc: 'Front desk visitor badging (COOPV), ID verification, and check-out',
  },
];

export const AssignRolesModal = () => {
  const { roleTargetUser, isRolesModalOpen, closeRolesModal, assignRoles } =
    useUserStore();

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roleTargetUser) {
      const currentRoleNames = (roleTargetUser.roles || []).map((r) =>
        typeof r === 'string' ? r : r.name
      );
      setSelectedRoles(
        currentRoleNames.length > 0
          ? currentRoleNames
          : ['ROLE_RELATIONSHIP_MANAGER']
      );
    }
  }, [roleTargetUser]);

  const handleToggle = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSave = async () => {
    if (!roleTargetUser) return;
    setIsSubmitting(true);
    await assignRoles(roleTargetUser.id, selectedRoles);
    setIsSubmitting(false);
  };

  if (!roleTargetUser) return null;

  return (
    <Modal
      isOpen={isRolesModalOpen}
      onClose={closeRolesModal}
      title="Assign Authorization Roles"
      subtitle={`Staff Member: ${roleTargetUser.firstName || ''} ${roleTargetUser.lastName || ''} (@${roleTargetUser.username})`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left">
        <div className="space-y-2">
          {AVAILABLE_ROLES.map((role) => {
            const isSelected = selectedRoles.includes(role.id);
            return (
              <div
                key={role.id}
                onClick={() => handleToggle(role.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white border-[#00adef] shadow-xs ring-2 ring-[#00adef]/20'
                    : 'bg-white/80 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#00adef]' : 'text-slate-400'
                      }`}
                    />
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#00adef]' : 'text-slate-800'
                      }`}
                    >
                      {role.label}
                    </p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? 'bg-[#00adef] border-[#00adef] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-6">
                  {role.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={closeRolesModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="orange"
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            Save Role Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignRolesModal;
