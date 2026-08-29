import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import visitApi from '@/modules/visits/api/visitApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const NewVisitorBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { departments, meetingRooms, fetchAllMasterData } = useMasterDataStore();

  // Organizations lookup for autocomplete
  const [existingOrgs, setExistingOrgs] = useState([]);
  const [isAffiliatedOrg, setIsAffiliatedOrg] = useState(false);
  const [orgSearchInput, setOrgSearchInput] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const orgDropdownRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  // Form State - ALL FIELDS OPTIONAL
  const [formData, setFormData] = useState({
    // Demographics matching reference image
    firstName: '',
    middleName: '',
    surname: '',
    idNumber: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    issuedDate: '',
    expiredDate: '',
    gender: 'Male',
    citizenship: 'Ethiopian',
    region: '',
    zone: '',
    woreda: '',
    idType: 'National ID',

    // Visit Parameters
    title: '',
    requestingDepartment: user?.department || 'Executive Office',
    locationRoom: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    visitorCount: 1,
    visitObjective: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchAllMasterData();
      loadOrganizations();
    }
  }, [isOpen, fetchAllMasterData]);

  const loadOrganizations = async () => {
    try {
      const orgs = await visitApi.getOrganizations();
      setExistingOrgs(Array.isArray(orgs) ? orgs : []);
    } catch (e) {
      console.warn('Failed to load organizations:', e);
    }
  };

  // Close org dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filtered organizations matching search input
  const matchingOrgs = existingOrgs.filter((o) =>
    o.name?.toLowerCase().includes(orgSearchInput.toLowerCase().trim())
  );

  const handleSelectOrg = (org) => {
    setSelectedOrgId(org.id);
    setOrgSearchInput(org.name);
    setShowOrgDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const startIso = `${formData.scheduledDate}T${formData.startTime}:00Z`;
      const endIso = `${formData.scheduledDate}T${formData.endTime}:00Z`;

      const payload = {
        title: formData.title.trim() || undefined,
        requestingDepartment: formData.requestingDepartment || undefined,
        locationRoom: formData.locationRoom || undefined,
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        visitorCount: parseInt(formData.visitorCount, 10) || 1,
        visitObjective: formData.visitObjective.trim() || undefined,
        visitType: 'EXTERNAL',
        priorityLevel: 'MEDIUM',

        // Organization link
        guestCategory: isAffiliatedOrg ? 'ORGANIZATION' : 'INDIVIDUAL',
        guestOrganizationId: isAffiliatedOrg && selectedOrgId ? selectedOrgId : null,
        organizationName: isAffiliatedOrg && orgSearchInput.trim() ? orgSearchInput.trim() : null,

        // Visitor Demographics (All Optional)
        individualGuestFirstName: formData.firstName.trim() || null,
        individualGuestMiddleName: formData.middleName.trim() || null,
        individualGuestLastName: formData.surname.trim() || null,
        individualGuestSurname: formData.surname.trim() || null,
        individualGuestPhone: formData.phone.trim() || null,
        individualGuestEmail: formData.email.trim() || null,
        individualGuestIdNumber: formData.idNumber.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        issuedDate: formData.issuedDate || null,
        expiredDate: formData.expiredDate || null,
        gender: formData.gender || 'Male',
        citizenship: formData.citizenship || 'Ethiopian',
        region: formData.region.trim() || null,
        zone: formData.zone.trim() || null,
        woreda: formData.woreda.trim() || null,
        idType: formData.idType || 'National ID',
        isDraft: false,
      };

      await visitApi.createVisit(payload);
      soundPlayer.playNotificationChime();
      toast.success('🎉 Visitor registration completed! Instantly scheduled on Front Desk.');

      if (onSuccess) onSuccess();
      onClose();

      // Reset
      setFormData({
        firstName: '',
        middleName: '',
        surname: '',
        idNumber: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        issuedDate: '',
        expiredDate: '',
        gender: 'Male',
        citizenship: 'Ethiopian',
        region: '',
        zone: '',
        woreda: '',
        idType: 'National ID',
        title: '',
        requestingDepartment: user?.department || 'Executive Office',
        locationRoom: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        visitorCount: 1,
        visitObjective: '',
      });
      setOrgSearchInput('');
      setSelectedOrgId(null);
      setIsAffiliatedOrg(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register visitor.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200 flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                Front Desk Visitor & Delegation Registration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register arriving guests. All demographic fields are optional. No approval wait required.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: ORGANIZATION AFFILIATION (Toggle + Smart Autocomplete)         */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <Building2 className="w-4 h-4 text-[#00adef]" />
                <span>Affiliated with an Organization?</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsAffiliatedOrg(!isAffiliatedOrg);
                  if (isAffiliatedOrg) {
                    setOrgSearchInput('');
                    setSelectedOrgId(null);
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAffiliatedOrg ? 'bg-[#00adef]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isAffiliatedOrg ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAffiliatedOrg && (
              <div className="relative pt-1" ref={orgDropdownRef}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Organization Name (Select from registry or type a new one)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search existing organization or write a new one..."
                    value={orgSearchInput}
                    onChange={(e) => {
                      setOrgSearchInput(e.target.value);
                      setSelectedOrgId(null);
                      setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef]"
                  />
                </div>

                {/* Dropdown Suggestions */}
                {showOrgDropdown && matchingOrgs.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {matchingOrgs.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => handleSelectOrg(org)}
                        className="px-4 py-2.5 hover:bg-sky-50 text-xs font-semibold text-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#00adef]" />
                          <span>{org.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {org.category || 'Partner'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-500 mt-1">
                  💡 If this organization is new, simply type its name and it will be automatically saved to your Partner Organizations registry.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: VISITOR DEMOGRAPHICS (Exact Format from Image - All Optional)  */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00adef]" />
                Visitor Demographic Profile (Optional)
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                All Fields Optional
              </span>
            </div>

            {/* Row 1: First Name & Middle Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="e.g. Yusuf"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hassen"
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>
            </div>

            {/* Row 2: Surname & ID Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Surname</label>
                <input
                  type="text"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={(e) => handleChange('surname', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number</label>
                <input
                  type="text"
                  placeholder="ID Number"
                  value={formData.idNumber}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>
            </div>

            {/* Row 3: Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="0910149192"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                />
              </div>
            </div>

            {/* Row 4: Date of Birth & Issued Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issued Date</label>
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => handleChange('issuedDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Expired Date & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expired Date</label>
                <input
                  type="date"
                  value={formData.expiredDate}
                  onChange={(e) => handleChange('expiredDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Row 6: Citizenship & Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Citizenship</label>
                <input
                  type="text"
                  placeholder="Citizenship"
                  value={formData.citizenship}
                  onChange={(e) => handleChange('citizenship', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  placeholder="Region"
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Row 7: Zone & Woreda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Zone</label>
                <input
                  type="text"
                  placeholder="Zone"
                  value={formData.zone}
                  onChange={(e) => handleChange('zone', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Woreda</label>
                <input
                  type="text"
                  placeholder="Woreda"
                  value={formData.woreda}
                  onChange={(e) => handleChange('woreda', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Row 8: ID Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Type</label>
              <select
                value={formData.idType}
                onChange={(e) => handleChange('idType', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="National ID">National ID (Fayda / Digital)</option>
                <option value="Kebele ID">Kebele Resident ID</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Employee ID">Employee Corporate ID</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: VISIT SCHEDULE & PARAMETERS                                    */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#e38524]" />
              Visit Schedule & Meeting Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting / Visit Title</label>
              <input
                type="text"
                placeholder="e.g. Executive Discussion & Strategic Review"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Date</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Host Department</label>
                <select
                  value={formData.requestingDepartment}
                  onChange={(e) => handleChange('requestingDepartment', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  <option value="Lobby & Front Desk">Lobby & Front Desk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Room</label>
                <select
                  value={formData.locationRoom}
                  onChange={(e) => handleChange('locationRoom', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="">None (Lobby / Floor Visit)</option>
                  {meetingRooms.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attendee Count</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.visitorCount}
                  onChange={(e) => handleChange('visitorCount', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Notes</label>
              <textarea
                rows={2}
                placeholder="Briefly state meeting purpose or reception instructions..."
                value={formData.visitObjective}
                onChange={(e) => handleChange('visitObjective', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Instant Schedule Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Instant Front Desk Clearance:</strong> This visit will be immediately scheduled and visible for reception check-in.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cyan"
              size="md"
              disabled={isLoading}
              className="font-bold px-6 shadow-md"
            >
              {isLoading ? 'Registering...' : 'Save & Schedule Visit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVisitorBookingModal;
