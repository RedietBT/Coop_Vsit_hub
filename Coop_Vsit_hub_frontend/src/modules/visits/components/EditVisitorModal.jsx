import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { visitApi } from '../api/visitApi';
import { toast } from 'sonner';

export const EditVisitorModal = ({ isOpen, onClose, visit, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
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
    idPhotoUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visit) {
      setFormData({
        firstName: visit.visitorFirstName || visit.individualGuestFirstName || '',
        middleName: visit.visitorMiddleName || visit.individualGuestMiddleName || '',
        surname: visit.visitorSurname || visit.individualGuestLastName || '',
        idNumber: visit.visitorIdNumber || visit.individualGuestIdNumber || '',
        phone: visit.visitorPhone || visit.individualGuestPhone || '',
        email: visit.visitorEmail || visit.individualGuestEmail || '',
        dateOfBirth: visit.visitorDateOfBirth || '',
        issuedDate: visit.visitorIssuedDate || '',
        expiredDate: visit.visitorExpiredDate || '',
        gender: visit.visitorGender || 'Male',
        citizenship: visit.visitorCitizenship || 'Ethiopian',
        region: visit.visitorRegion || '',
        zone: visit.visitorZone || '',
        woreda: visit.visitorWoreda || '',
        idType: visit.visitorIdType || 'National ID',
        idPhotoUrl: visit.visitorIdPhotoUrl || '',
      });
    }
  }, [visit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIdCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, idPhotoUrl: reader.result }));
      toast.success('ID Card photo captured successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visit?.id) return;

    setIsLoading(true);
    try {
      await visitApi.updateVisitorDetails(visit.id, formData);
      toast.success('Visitor details saved successfully!');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update visitor details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Visitor Information"
      subtitle={`Front Desk registration & demographics for visit ${visit?.visitCode || ''}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Name Fields: First Name, Middle Name, Surname */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="First Name"
            placeholder="e.g. Yusuf"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
          <Input
            label="Middle Name"
            placeholder="e.g. Hassen"
            value={formData.middleName}
            onChange={(e) => handleChange('middleName', e.target.value)}
          />
          <Input
            label="Surname (Last Name)"
            placeholder="e.g. Hassen"
            value={formData.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
          />
        </div>

        {/* Identity & Contact: ID Number, Phone, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="ID Number"
            placeholder="e.g. ET-ID-887722"
            value={formData.idNumber}
            onChange={(e) => handleChange('idNumber', e.target.value)}
          />
          <Input
            label="Phone"
            placeholder="e.g. 0910149192"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="e.g. visitor@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        {/* Dates & Demographics: Date of Birth, Issued Date, Expired Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          />
          <Input
            label="Issued Date"
            type="date"
            value={formData.issuedDate}
            onChange={(e) => handleChange('issuedDate', e.target.value)}
          />
          <Input
            label="Expired Date"
            type="date"
            value={formData.expiredDate}
            onChange={(e) => handleChange('expiredDate', e.target.value)}
          />
        </div>

        {/* Gender, Citizenship, ID Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00adef]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <Input
            label="Citizenship"
            placeholder="e.g. Ethiopian"
            value={formData.citizenship}
            onChange={(e) => handleChange('citizenship', e.target.value)}
          />

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ID Type
            </label>
            <select
              value={formData.idType}
              onChange={(e) => handleChange('idType', e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00adef]"
            >
              <option value="National ID">National ID (Fayda / Kebele)</option>
              <option value="Passport">International Passport</option>
              <option value="Driver License">Driver's License</option>
              <option value="Employee Badge">Corporate Staff Badge</option>
            </select>
          </div>
        </div>

        {/* Address: Region, Zone, Woreda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Region"
            placeholder="e.g. Oromia"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
          />
          <Input
            label="Zone"
            placeholder="e.g. Finfinnee Special Zone"
            value={formData.zone}
            onChange={(e) => handleChange('zone', e.target.value)}
          />
          <Input
            label="Woreda"
            placeholder="e.g. Bole"
            value={formData.woreda}
            onChange={(e) => handleChange('woreda', e.target.value)}
          />
        </div>

        {/* ID Photo Capture / Upload Section */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {formData.idPhotoUrl ? (
              <img
                src={formData.idPhotoUrl}
                alt="ID Snapshot"
                className="w-16 h-12 object-cover rounded-lg border border-slate-300 shadow-xs"
              />
            ) : (
              <div className="w-16 h-12 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-800">
                Visitor Photo / ID Document Capture
              </p>
              <p className="text-[10px] text-slate-500">
                Optional photo or ID document snapshot for high-security check-in.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 rounded-xl cursor-pointer shadow-xs transition-all shrink-0">
            <Camera className="w-4 h-4 text-[#00adef]" />
            <span>ID Capture</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleIdCapture}
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="orange"
            size="md"
            isLoading={isLoading}
            icon={CheckCircle2}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitorModal;
