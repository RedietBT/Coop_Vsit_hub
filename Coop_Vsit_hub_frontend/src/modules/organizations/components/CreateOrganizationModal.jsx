import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Globe, User, Mail, Phone, Award } from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const orgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required'),
  category: z.string().min(1, 'Category is required'),
  industrySector: z.string().min(1, 'Industry sector is required'),
  marketCountry: z.string().min(1, 'Country is required'),
  primaryContactPerson: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  relationshipScore: z.number().min(0).max(100).default(85),
  overviewNotes: z.string().optional(),
});

const CATEGORIES = [
  'Strategic Partner',
  'FinTech Peer',
  'Regulator / Government Body',
  'Commercial Enterprise',
  'NGO / Development Agency',
];

const SECTORS = [
  'Telecommunications & Digital Payments',
  'Banking & Financial Services',
  'Government & Public Policy',
  'Agriculture & Microfinance',
  'Technology & Cloud Infrastructure',
];

export const CreateOrganizationModal = () => {
  const { isCreateModalOpen, closeCreateModal, createOrganization } =
    useOrganizationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      category: CATEGORIES[0],
      industrySector: SECTORS[0],
      marketCountry: 'Ethiopia',
      primaryContactPerson: '',
      contactEmail: '',
      contactPhone: '',
      relationshipScore: 85,
      overviewNotes: '',
    },
  });

  const handleClose = () => {
    reset();
    closeCreateModal();
  };

  const onSubmit = async (data) => {
    await createOrganization({
      ...data,
      relationshipScore: Number(data.relationshipScore) || 85,
    });
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleClose}
      title="Register Partner Organization"
      subtitle="Add a corporate partner or government entity to the bank intelligence portfolio."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Organization Entity Name"
          placeholder="e.g. Ethio Telecom, Visa Inc., Safaricom Ethiopia"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Partnership Category <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('category')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Industry Sector <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('industrySector')}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Primary Contact Person"
            placeholder="e.g. Dawit Alemu"
            error={errors.primaryContactPerson?.message}
            {...register('primaryContactPerson')}
          />
          <Input
            label="Contact Email Address"
            type="email"
            placeholder="e.g. liaison@ethiotelecom.et"
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Market Country of Origin"
            placeholder="Ethiopia"
            error={errors.marketCountry?.message}
            required
            {...register('marketCountry')}
          />
          <Input
            label="Initial Relationship Score (0-100)"
            type="number"
            placeholder="85"
            min="0"
            max="100"
            error={errors.relationshipScore?.message}
            {...register('relationshipScore', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Strategic Notes & Relationship Context
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Strategic Peering MoU signed. Primary sponsor is Digital Banking division."
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('overviewNotes')}
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
            icon={Building2}
            isLoading={isSubmitting}
          >
            Register Partner Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateOrganizationModal;
