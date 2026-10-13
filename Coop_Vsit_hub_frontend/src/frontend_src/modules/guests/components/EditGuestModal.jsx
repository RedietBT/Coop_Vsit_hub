import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Globe, IdCard, Crown, Edit3 } from 'lucide-react';
import useGuestStore from '../store/guestStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const editGuestSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  vipTier: z.enum(['VIP_TIER_1', 'VIP_TIER_2', 'STANDARD', 'DIPLOMAT', 'TIER_1', 'TIER_2']),
  identityDocumentType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'DIPLOMATIC_ID']),
  idNumber: z.string().optional(),
  countryOfResidence: z.string().min(1, 'Country is required'),
  relationshipScore: z.coerce.number().min(0).max(100).default(85),
  notes: z.string().optional(),
});

export const EditGuestModal = () => {
  const { editTarget, isEditModalOpen, closeEditModal, updateGuest } = useGuestStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editGuestSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      vipTier: 'VIP_TIER_1',
      identityDocumentType: 'NATIONAL_ID',
      idNumber: '',
      countryOfResidence: 'Ethiopia',
      relationshipScore: 85,
      notes: '',
    },
  });

  useEffect(() => {
    if (editTarget) {
      let tier = editTarget.vipTier || 'STANDARD';
      if (tier === 'TIER_1') tier = 'VIP_TIER_1';
      if (tier === 'TIER_2') tier = 'VIP_TIER_2';

      reset({
        firstName: editTarget.firstName || editTarget.fullName?.split(' ')[0] || '',
        middleName: editTarget.middleName || '',
        lastName: editTarget.lastName || editTarget.fullName?.split(' ').slice(1).join(' ') || '',
        email: editTarget.email || '',
        phoneNumber: editTarget.phoneNumber || '',
        vipTier: tier,
        identityDocumentType: editTarget.idType || editTarget.identityDocumentType || 'NATIONAL_ID',
        idNumber: editTarget.idNumber || '',
        countryOfResidence: editTarget.countryOfResidence || editTarget.nationalityCountry || 'Ethiopia',
        relationshipScore: editTarget.relationshipScore || 85,
        notes: editTarget.notes || editTarget.profileNotes || '',
      });
    }
  }, [editTarget, reset]);

  if (!editTarget) return null;

  const onSubmit = async (data) => {
    await updateGuest(editTarget.id, data);
  };

  return (
    <Modal
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      title="Edit Individual Guest"
      subtitle={`Updating profile records for ${editTarget.fullName || 'Guest'}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="First Name"
            placeholder="First name"
            icon={User}
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Middle Name"
            placeholder="Middle name"
            {...register('middleName')}
          />
          <Input
            label="Last Name / Surname"
            placeholder="Last name"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            placeholder="guest@example.et"
            type="email"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone Number"
            placeholder="+251911000000"
            icon={Phone}
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />
        </div>

        {/* Classification Tier & ID Doc Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Guest Classification Tier <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('vipTier')}
            >
              <option value="VIP_TIER_1">👑 Tier 1 (C-Level & Ministers)</option>
              <option value="VIP_TIER_2">⭐ Tier 2 (Directors & Advisors)</option>
              <option value="STANDARD">Standard Individual Guest</option>
              <option value="DIPLOMAT">Diplomat</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Government Identity Doc Type <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('identityDocumentType')}
            >
              <option value="NATIONAL_ID">National ID / Kebele</option>
              <option value="PASSPORT">Passport</option>
              <option value="DIPLOMATIC_ID">Diplomatic ID</option>
              <option value="DRIVER_LICENSE">Driver's License</option>
            </select>
          </div>
        </div>

        {/* ID Number & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ID / Passport Document Number"
            placeholder="e.g. EP2948194"
            icon={IdCard}
            {...register('idNumber')}
          />
          <Input
            label="Country of Residence"
            placeholder="Ethiopia"
            icon={Globe}
            error={errors.countryOfResidence?.message}
            required
            {...register('countryOfResidence')}
          />
        </div>

        {/* Relationship Health Score */}
        <div>
          <Input
            label="Relationship Health Score (0 - 100)"
            type="number"
            min="0"
            max="100"
            error={errors.relationshipScore?.message}
            {...register('relationshipScore')}
          />
        </div>

        {/* Profile Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Profile Notes & Protocol Preferences
          </label>
          <textarea
            rows="2"
            placeholder="Add executive hospitality notes, language preferences, dietary or security requirements..."
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={closeEditModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={Edit3}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditGuestModal;
