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
  DoorOpen,
  Check,
  Crown,
  Award,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import visitApi from '@/modules/visits/api/visitApi';
import roomBookingApi from '@/modules/booking/api/roomBookingApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const NewVisitorBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { departments, meetingRooms, fetchAllMasterData } = useMasterDataStore();

  const [existingOrgs, setExistingOrgs] = useState([]);
  const [isAffiliatedOrg, setIsAffiliatedOrg] = useState(false);
  const [orgSearchInput, setOrgSearchInput] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [orgDetails, setOrgDetails] = useState({
    contactPerson: '',
    phone: '',
    email: '',
    sector: '',
  });
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
    guestTier: 'Normal Guest', // 'Normal Guest', 'VIP', 'VVIP'
    priorityLevel: 'MEDIUM', // 'MEDIUM', 'HIGH', 'LOW'

    // Visit Parameters
    title: '',
    locationRoom: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    visitorCount: 1,
    visitObjective: '',
    linkedBookingId: null,
  });

  const [bookedRoomsForDate, setBookedRoomsForDate] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchAllMasterData();
      loadOrganizations();
      loadBookedRooms(formData.scheduledDate);
    }
  }, [isOpen, fetchAllMasterData, formData.scheduledDate]);

  const loadOrganizations = async () => {
    try {
      const orgs = await visitApi.getOrganizations();
      setExistingOrgs(Array.isArray(orgs) ? orgs : []);
    } catch (e) {
      console.warn('Failed to load organizations:', e);
    }
  };

  const loadBookedRooms = async (dateStr) => {
    if (!dateStr) return;
    try {
      const fromDate = `${dateStr}T00:00:00Z`;
      const toDate = `${dateStr}T23:59:59Z`;
      const bookings = await roomBookingApi.getActiveBookingsForDate(fromDate, toDate);
      setBookedRoomsForDate(Array.isArray(bookings) ? bookings : []);
    } catch (e) {
      console.warn('Failed to load active room bookings for date:', e);
      setBookedRoomsForDate([]);
    }
  };

  // Smart match strictly based on Organization Name, Guest Name, and Date
  const matchingBookings = (() => {
    if (!bookedRoomsForDate.length) return [];
    const normOrg = orgSearchInput?.toLowerCase().trim();
    const normFirst = formData.firstName?.toLowerCase().trim();
    const normMiddle = formData.middleName?.toLowerCase().trim();
    const normSurname = formData.surname?.toLowerCase().trim();
    const fullName = `${normFirst} ${normSurname}`.trim();

    return bookedRoomsForDate.filter((b) => {
      const bOrg = b.guestOrganizationName?.toLowerCase() || '';
      const bGuest = b.guestName?.toLowerCase() || '';
      const bTitle = b.meetingTitle?.toLowerCase() || '';

      if (isAffiliatedOrg && normOrg && normOrg.length >= 2) {
        if (bOrg.includes(normOrg) || normOrg.includes(bOrg)) return true;
        if (bTitle.includes(normOrg)) return true;
      }
      if (!isAffiliatedOrg) {
        if (fullName.length >= 3 && (bGuest.includes(fullName) || bTitle.includes(fullName))) return true;
        if (normFirst && normFirst.length >= 3 && (bGuest.includes(normFirst) || bTitle.includes(normFirst))) return true;
        if (normSurname && normSurname.length >= 3 && (bGuest.includes(normSurname) || bTitle.includes(normSurname))) return true;
        if (normMiddle && normMiddle.length >= 3 && (bGuest.includes(normMiddle) || bTitle.includes(normMiddle))) return true;
      }
      return false;
    });
  })();

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
    setOrgDetails({
      contactPerson: org.contactPersonName || '',
      phone: org.contactPhone || '',
      email: org.contactEmail || '',
      sector: org.industrySector || '',
    });
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
        locationRoom: formData.locationRoom || undefined,
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        visitorCount: parseInt(formData.visitorCount, 10) || 1,
        visitObjective: formData.visitObjective.trim() || undefined,
        visitType: 'EXTERNAL',
        priorityLevel: formData.priorityLevel || 'MEDIUM',
        guestTier: !isAffiliatedOrg ? (formData.guestTier || 'Normal Guest') : null,
        linkedBookingId: formData.linkedBookingId || null,

        // Organization link & details (priority given to explicit org fields, fallbacks to visitor details in backend)
        guestCategory: isAffiliatedOrg ? 'ORGANIZATION' : 'INDIVIDUAL',
        guestOrganizationId: isAffiliatedOrg && selectedOrgId ? selectedOrgId : null,
        organizationName: isAffiliatedOrg && orgSearchInput.trim() ? orgSearchInput.trim() : null,
        organizationContactPerson: isAffiliatedOrg && orgDetails.contactPerson.trim() ? orgDetails.contactPerson.trim() : null,
        organizationPhone: isAffiliatedOrg && orgDetails.phone.trim() ? orgDetails.phone.trim() : null,
        organizationEmail: isAffiliatedOrg && orgDetails.email.trim() ? orgDetails.email.trim() : null,
        organizationSector: isAffiliatedOrg && orgDetails.sector.trim() ? orgDetails.sector.trim() : null,

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

                {/* Optional Organization Contact & Sector Details Block */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00adef]" />
                      Organization Contact & Sector Information (Optional)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Falls back to visitor info if left blank
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Industry Sector
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Telecommunications, Banking, Agro"
                        value={orgDetails.sector}
                        onChange={(e) => setOrgDetails((prev) => ({ ...prev, sector: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Organization Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +251115510000"
                        value={orgDetails.phone}
                        onChange={(e) => setOrgDetails((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Organization Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. info@organization.et"
                        value={orgDetails.email}
                        onChange={(e) => setOrgDetails((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00adef]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium border-t border-slate-100">
                    <User className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                    <span>Contact person for this organization will automatically be set as the visitor registered below.</span>
                  </div>
                </div>
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

            {/* Guest Classification Tier & Priority Level (All Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-[#e38524]" />
                  <span>Guest Classification Tier</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.guestTier}
                  onChange={(e) => handleChange('guestTier', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="Normal Guest">Normal Guest (Standard)</option>
                  <option value="VIP">VIP (Priority Host Escort)</option>
                  <option value="VVIP">VVIP (Executive & Diplomatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#00adef]" />
                  <span>Visit Priority Level</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.priorityLevel}
                  onChange={(e) => handleChange('priorityLevel', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="MEDIUM">Medium (Default)</option>
                  <option value="HIGH">High Priority</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Assigned Room</label>
                  {bookedRoomsForDate.length > 0 && (
                    <span className="text-[10px] text-[#00adef] font-bold">
                      {bookedRoomsForDate.length} Booked Room(s)
                    </span>
                  )}
                </div>
                <select
                  value={formData.locationRoom}
                  onChange={(e) => {
                    const roomVal = e.target.value;
                    handleChange('locationRoom', roomVal);
                    const matched = bookedRoomsForDate.find((b) => b.locationRoom === roomVal);
                    if (matched) {
                      if (!formData.title || formData.title === 'Executive Visit') {
                        handleChange('title', matched.title);
                      }
                      if (matched.scheduledStartTime && matched.scheduledEndTime) {
                        const s = matched.scheduledStartTime.split('T')[1]?.substring(0, 5);
                        const en = matched.scheduledEndTime.split('T')[1]?.substring(0, 5);
                        if (s) handleChange('startTime', s);
                        if (en) handleChange('endTime', en);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="">None (Lobby / Floor Visit)</option>
                  {meetingRooms.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name} {r.department ? `(${r.department})` : ''}
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

            {/* 🎯 Smart Matching Room Reservation Spotlight */}
            {matchingBookings.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-300/90 shadow-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span className="text-xs font-bold text-amber-900">
                      Matching Room Reservation Detected!
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase">
                    Suggested Link
                  </span>
                </div>

                <p className="text-[11px] text-amber-800 leading-normal">
                  Found an active boardroom reservation matching{' '}
                  <span className="font-bold">
                    {isAffiliatedOrg ? `"${orgSearchInput}"` : `${formData.firstName} ${formData.surname}`}
                  </span>{' '}
                  for today. Link this visit directly with 1 click:
                </p>

                <div className="space-y-2">
                  {matchingBookings.map((b) => {
                    const isLinked = formData.locationRoom === b.roomName || formData.linkedBookingId === b.id;
                    const sTime = b.scheduledStartTime
                      ? new Date(b.scheduledStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const eTime = b.scheduledEndTime
                      ? new Date(b.scheduledEndTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isLinked
                            ? 'bg-[#00adef] text-white border-[#00adef] shadow-sm'
                            : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <DoorOpen className={`w-4 h-4 ${isLinked ? 'text-white' : 'text-[#e38524]'}`} />
                            <span>{b.roomName}</span>
                            <span className="font-mono text-[10px] opacity-80">({b.bookingCode})</span>
                          </div>
                          <p className={`text-xs font-semibold mt-0.5 truncate ${isLinked ? 'text-sky-100' : 'text-slate-700'}`}>
                            {b.meetingTitle}
                          </p>
                          <div className={`flex flex-wrap items-center gap-2 text-[10px] mt-1 ${isLinked ? 'text-sky-100' : 'text-slate-500'}`}>
                            <span>⏰ {sTime} - {eTime}</span>
                            <span>•</span>
                            <span>Booked By: {b.bookedByName} ({b.hostDepartment})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isLinked) {
                              handleChange('locationRoom', '');
                              handleChange('linkedBookingId', null);
                            } else {
                              handleChange('locationRoom', b.roomName);
                              handleChange('linkedBookingId', b.id);
                              if (!formData.title || formData.title === 'Executive Visit') {
                                handleChange('title', b.meetingTitle);
                              }
                              if (b.scheduledStartTime && b.scheduledEndTime) {
                                const s = b.scheduledStartTime.split('T')[1]?.substring(0, 5);
                                const en = b.scheduledEndTime.split('T')[1]?.substring(0, 5);
                                if (s) handleChange('startTime', s);
                                if (en) handleChange('endTime', en);
                              }
                              toast.success(`Linked to room "${b.roomName}" (${b.bookingCode})!`);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                            isLinked
                              ? 'bg-white text-[#00adef] border-white shadow-xs'
                              : 'bg-[#00adef] text-white border-[#00adef] hover:bg-[#0096ce]'
                          }`}
                        >
                          {isLinked ? 'Linked to Reservation ✓' : 'Link to this Reservation'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
