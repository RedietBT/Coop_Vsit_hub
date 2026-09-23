import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCheck, Building2, Mail, Phone, Briefcase, User } from 'lucide-react';
import useUserStore from '../store/userStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const editUserSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().trim().email('Invalid email address format'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  jobTitle: z.string().optional(),
});

export const EditUserModal = () => {
  const { isEditModalOpen, editTargetUser, closeEditModal, updateUser } = useUserStore();
  const { departments, fetchDepartments } = useMasterDataStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      jobTitle: '',
    },
  });

  useEffect(() => {
    if (isEditModalOpen) {
      fetchDepartments(true);
    }
  }, [isEditModalOpen, fetchDepartments]);

  useEffect(() => {
    if (editTargetUser) {
      reset({
        firstName: editTargetUser.firstName || '',
        lastName: editTargetUser.lastName || '',
        email: editTargetUser.email || '',
        phone: editTargetUser.phone || editTargetUser.phoneNumber || '',
        department: editTargetUser.department || '',
        jobTitle: editTargetUser.jobTitle || editTargetUser.title || '',
      });
    }
  }, [editTargetUser, reset]);

  const handleClose = () => {
    reset();
    closeEditModal();
  };

  const onSubmit = async (data) => {
    if (!editTargetUser?.id) return;

    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      department: data.department,
      phone: data.phone?.trim() || '',
      jobTitle: data.jobTitle?.trim() || '',
    };

    const res = await updateUser(editTargetUser.id, payload);
    if (res?.success) {
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isEditModalOpen}
      onClose={handleClose}
      title="Edit Staff Member Profile"
      subtitle={`Update user details and assigned department for ${editTargetUser?.username || 'Staff Member'}.`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            icon={User}
            placeholder="Dawit"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            icon={User}
            placeholder="Alemu"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Corporate Email Address"
            type="email"
            icon={Mail}
            placeholder="dalemu@coopbankoromiasc.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />
          <Input
            label="Phone Number"
            icon={Phone}
            placeholder="+251 91 123 4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        {/* Department & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Assigned Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                {...register('department')}
              >
                <option value="">Select a Department</option>
                {editTargetUser?.department &&
                  !departments.some((d) => (d.name || d) === editTargetUser.department) && (
                    <option value={editTargetUser.department}>
                      {editTargetUser.department} (Current)
                    </option>
                  )}
                {departments.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name} {d.code ? `(${d.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.department && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">
                {errors.department.message}
              </p>
            )}
          </div>

          <Input
            label="Job Title / Position"
            icon={Briefcase}
            placeholder="e.g. Department Secretary"
            error={errors.jobTitle?.message}
            {...register('jobTitle')}
          />
        </div>

        {/* Secretary Notice */}
        {editTargetUser?.roles?.some?.((r) =>
          typeof r === 'string'
            ? r.includes('SECRETARY')
            : (r.name || r.role || '').includes('SECRETARY')
        ) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#e38524] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Secretary Role Detected:</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                The assigned department dictates which meeting rooms and facility reservations this secretary will manage in the Secretary Portal.
              </p>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="orange"
            icon={UserCheck}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
