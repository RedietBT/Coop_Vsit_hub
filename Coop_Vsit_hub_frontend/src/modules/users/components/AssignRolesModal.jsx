import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Check } from 'lucide-react';
import useUserStore from '../store/userStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

const AVAILABLE_ROLES = [
  { id: 'ROLE_EMPLOYEE', label: 'Employee', desc: 'Standard staff employee permissions' },
  { id: 'ROLE_RELATIONSHIP_MANAGER', label: 'Relationship Manager', desc: 'Can submit and host delegations' },
  { id: 'ROLE_APPROVER', label: 'Executive Approver', desc: 'Can approve, reject, or schedule visit requests' },
  { id: 'ROLE_SECURITY_DESK', label: 'Security Desk', desc: 'Front desk check-in, badges, check-out' },
  { id: 'ROLE_EXECUTIVE', label: 'Bank Executive', desc: 'Financial cockpit and partner intelligence' },
  { id: 'ROLE_ADMIN', label: 'Administrator', desc: 'Full system configuration & staff control' },
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
        currentRoleNames.length > 0 ? currentRoleNames : ['ROLE_EMPLOYEE']
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
        <p className="text-xs text-slate-500">
          Select all authorization roles granted to this staff member. Modifying roles will automatically refresh their navigation menu permissions.
        </p>

        <div className="space-y-2">
          {AVAILABLE_ROLES.map((role) => {
            const isChecked = selectedRoles.includes(role.id);
            return (
              <label
                key={role.id}
                onClick={() => handleToggle(role.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-sky-50/60 border-[#00adef] text-[#000000] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-[#00adef]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{role.label}</p>
                    {isChecked && <Check className="w-3.5 h-3.5 text-[#00adef]" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{role.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="w-1/2"
            onClick={closeRolesModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="cyan"
            className="w-1/2"
            icon={Shield}
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            Save Roles
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignRolesModal;
