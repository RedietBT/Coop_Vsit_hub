import React, { useEffect, useState } from 'react';
import { Edit3, User, Mail, Phone, Building2, X } from 'lucide-react';
import useUserStore from '../store/userStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  department: '',
  phoneNumber: '',
};

export const EditUserModal = () => {
  const { userToEdit, isEditModalOpen, closeEditModal, updateUserProfile } = useUserStore();
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.firstName || '',
        middleName: userToEdit.middleName || '',
        lastName: userToEdit.lastName || '',
        email: userToEdit.email || '',
        department: userToEdit.department || '',
        phoneNumber: userToEdit.phoneNumber || userToEdit.phone || '',
      });
    }
  }, [userToEdit]);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    const result = await updateUserProfile(userToEdit.id, {
      ...formData,
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim() || null,
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      department: formData.department.trim() || null,
      phoneNumber: formData.phoneNumber.trim() || null,
    });
    setIsSaving(false);
    if (result?.success) closeEditModal();
  };

  return (
    <Modal
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      title="Edit Staff Profile"
      subtitle={userToEdit ? `Update details for @${userToEdit.username}` : 'Update staff details'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" icon={User} value={formData.firstName} onChange={handleChange('firstName')} required />
          <Field label="Middle Name" icon={User} value={formData.middleName} onChange={handleChange('middleName')} />
          <Field label="Last Name" icon={User} value={formData.lastName} onChange={handleChange('lastName')} required />
          <Field label="Email" icon={Mail} type="email" value={formData.email} onChange={handleChange('email')} required />
          <Field label="Phone Number" icon={Phone} value={formData.phoneNumber} onChange={handleChange('phoneNumber')} placeholder="+251911223344" />
          <Field label="Department" icon={Building2} value={formData.department} onChange={handleChange('department')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={closeEditModal}>Cancel</Button>
          <Button type="submit" variant="cyan" icon={Edit3} isLoading={isSaving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

const Field = ({ label, icon: Icon, type = 'text', required, ...props }) => (
  <label className="block text-left">
    <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    <span className="relative block">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type={type}
        required={required}
        {...props}
        className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#00adef] focus:ring-2 focus:ring-[#00adef]/25"
      />
    </span>
  </label>
);

export default EditUserModal;