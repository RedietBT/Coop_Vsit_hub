import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Phone, Lock, Sparkles, Check } from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const orgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required'),
  industrySector: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().optional(),
  contactPhone: z.string().optional(),
  primaryContactPerson: z.string().optional(),
  marketCountry: z.string().default('Ethiopia'),
  relationshipScore: z.number().min(0).max(100).default(85),
  overviewNotes: z.string().optional(),
});

const DEFAULT_SECTOR_SUGGESTIONS = [
  'Telecommunications & Digital Payments',
  'Banking & Financial Services',
  'FinTech & Mobile Money',
  'Government & Public Policy',
  'Agriculture & Microfinance',
  'Technology & Cloud Infrastructure',
  'Health & Pharmaceuticals',
  'Energy & Utilities',
  'Education & Research',
  'Manufacturing & Industry',
  'Transport & Logistics',
  'Hospitality & Tourism',
  'Non-Governmental & Development',
];

export const CreateOrganizationModal = () => {
  const { isCreateModalOpen, closeCreateModal, createOrganization, organizations } =
    useOrganizationStore();

  const [sectorInput, setSectorInput] = useState('');
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const sectorDropdownRef = useRef(null);

  // Combine default suggestions with existing sectors from organizations
  const allKnownSectors = useMemo(() => {
    const existing = (organizations || [])
      .map((o) => o.industrySector)
      .filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_SECTOR_SUGGESTIONS, ...existing]));
    return combined;
  }, [organizations]);

  // Filtered matching suggestions while typing
  const filteredSectors = useMemo(() => {
    if (!sectorInput || !sectorInput.trim()) {
      return allKnownSectors.slice(0, 6);
    }
    const query = sectorInput.toLowerCase().trim();
    return allKnownSectors
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 6);
  }, [allKnownSectors, sectorInput]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      industrySector: '',
      contactEmail: '',
      password: '',
      contactPhone: '',
      primaryContactPerson: '',
      marketCountry: 'Ethiopia',
      relationshipScore: 85,
      overviewNotes: '',
    },
  });

  // Handle clicking outside the sector autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(e.target)) {
        setShowSectorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    reset();
    setSectorInput('');
    setShowSectorDropdown(false);
    closeCreateModal();
  };

  const handleSelectSector = (sector) => {
    setSectorInput(sector);
    setValue('industrySector', sector, { shouldValidate: true });
    setShowSectorDropdown(false);
  };

  const handleSectorChange = (e) => {
    const val = e.target.value;
    setSectorInput(val);
    setValue('industrySector', val, { shouldValidate: true });
    setShowSectorDropdown(true);
  };

  const onSubmit = async (data) => {
    await createOrganization({
      ...data,
      industrySector: sectorInput.trim() || undefined,
      relationshipScore: Number(data.relationshipScore) || 85,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleClose}
      title="Register Partner Organization"
      subtitle="Add a corporate partner or institutional entity to the bank intelligence portfolio."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Organization Name */}
        <Input
          label="Organization Entity Name"
          placeholder="e.g. Ethio Telecom, Visa Inc., Safaricom Ethiopia"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        {/* Industry Sector (Optional with Smart Autocomplete) */}
        <div className="relative" ref={sectorDropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Industry Sector</span>
            <span className="text-[10px] text-slate-400 font-normal lowercase">(optional - suggestions show as you type)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sectorInput}
              onChange={handleSectorChange}
              onFocus={() => setShowSectorDropdown(true)}
              placeholder="Type or select sector (e.g. Telecommunications, FinTech, Agriculture...)"
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
            />
            {sectorInput && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#00adef]" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSectorDropdown && filteredSectors.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 max-h-48 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Suggestions
              </div>
              {filteredSectors.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSelectSector(sector)}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-[#00adef] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{sector}</span>
                  {sectorInput.trim().toLowerCase() === sector.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-[#00adef]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Credentials & Access: Email & Password */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3">
          <span className="text-xs font-bold text-[#00adef] uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Organization Contact & Credentials</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Organization Email Address"
              type="email"
              placeholder="e.g. corporate@partner.et"
              error={errors.contactEmail?.message}
              {...register('contactEmail')}
            />
            <Input
              label="Portal Password"
              type="password"
              placeholder="e.g. CoopPartner#2026"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Organization Phone Number"
              type="tel"
              placeholder="e.g. +251 11 550 0000 or 0911000000"
              error={errors.contactPhone?.message}
              {...register('contactPhone')}
            />
            <Input
              label="Primary Contact Person"
              placeholder="e.g. Frehiwot Tamru"
              error={errors.primaryContactPerson?.message}
              {...register('primaryContactPerson')}
            />
          </div>
        </div>

        {/* Country & Relationship Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Market Country of Origin"
            placeholder="Ethiopia"
            error={errors.marketCountry?.message}
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

        {/* Strategic Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Strategic Notes & Relationship Context
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Strategic MoU signed. Primary sponsor is Digital Banking division."
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
