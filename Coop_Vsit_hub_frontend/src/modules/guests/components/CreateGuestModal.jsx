import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, IdCard, Mail, Phone, Crown, Globe, Building2 } from 'lucide-react';
import useGuestStore from '../store/guestStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const guestSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  titlePosition: z.string().optional(),
  affiliation: z.string().optional(),
  vipTier: z.enum(['VIP_TIER_1', 'VIP_TIER_2', 'STANDARD', 'DIPLOMAT', 'TIER_1', 'TIER_2']),
  identityDocumentType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'DIPLOMATIC_ID']),
  identityDocumentNumber: z.string().optional(),
  nationalityCountry: z.string().min(1, 'Country is required'),
  relationshipScore: z.number().min(0).max(100).default(90),
  profileNotes: z.string().optional(),
});

export const CreateGuestModal = () => {
  const { isCreateModalOpen, closeCreateModal, createGuest } = useGuestStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      titlePosition: '',
      affiliation: '',
      vipTier: 'VIP_TIER_1',
      identityDocumentType: 'PASSPORT',
      identityDocumentNumber: '',
      nationalityCountry: 'Ethiopia',
      relationshipScore: 90,
      profileNotes: '',
    },
  });

  const handleClose = () => {
    reset();
    closeCreateModal();
  };

  const onSubmit = async (data) => {
    await createGuest({
      ...data,
      relationshipScore: Number(data.relationshipScore) || 90,
    });
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleClose}
      title="Register VIP Individual Delegate"
      subtitle="Profile an executive guest, dignitary, or independent corporate advisor."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="First Name"
            placeholder="Dawit"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Middle Name"
            placeholder="Tadesse"
            {...register('middleName')}
          />
          <Input
            label="Last Name"
            placeholder="Alemu"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Official Contact Email"
            type="email"
            placeholder="dawit.alemu@advisory.et"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Mobile Phone Number"
            placeholder="+251 91 122 3344"
            {...register('phone')}
          />
        </div>

        {/* Title & Affiliation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title / Official Position"
            placeholder="Senior Strategic Advisor / Board Member"
            {...register('titlePosition')}
          />
          <Input
            label="Corporate / Institutional Affiliation"
            placeholder="National Bank / FinTech Alliance"
            {...register('affiliation')}
          />
        </div>

        {/* VIP Tier & Identity Document */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              VIP Classification Tier <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('vipTier')}
            >
              <option value="VIP_TIER_1">👑 Tier 1 (C-Level & Dignitaries)</option>
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
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID / Kebele</option>
              <option value="DIPLOMATIC_ID">Diplomatic ID</option>
              <option value="DRIVER_LICENSE">Driver's License</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ID / Passport Document Number"
            placeholder="e.g. EP2948194"
            icon={IdCard}
            {...register('identityDocumentNumber')}
          />
          <Input
            label="Nationality / Market Country"
            placeholder="Ethiopia"
            error={errors.nationalityCountry?.message}
            required
            {...register('nationalityCountry')}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            VIP Profile Notes & Protocol Preferences
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Frequent keynote speaker on Digital Peering. Requires executive lounge reception."
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('profileNotes')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
            icon={User}
            isLoading={isSubmitting}
          >
            Register VIP Delegate
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGuestModal;
