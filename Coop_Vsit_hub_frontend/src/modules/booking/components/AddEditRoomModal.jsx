import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DoorOpen,
  Building2,
  Users,
  MapPin,
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import masterDataApi, { handleRoomApiError } from '@/modules/master_data/api/masterDataApi';
import soundPlayer from '@/core/utils/soundPlayer';

const roomSchema = z.object({
  name: z.string().trim().min(2, 'Room name is required (min 2 characters)'),
  floorLocation: z.string().trim().min(1, 'Floor location is required'),
  department: z.string().min(1, 'Department is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 person'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const AddEditRoomModal = ({ isOpen, onClose, roomToEdit = null, onSuccess }) => {
  const { user, hasRole } = useAuthStore();
  const { departments, fetchDepartments } = useMasterDataStore();

  const isAdmin = hasRole('ROLE_ADMIN');
  const isSecretary = hasRole('ROLE_SECRETARY');
  const secretaryDept = user?.department || '';

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      floorLocation: '',
      department: isSecretary ? secretaryDept : '',
      capacity: 10,
      description: '',
      isActive: true,
    },
  });

  const isActiveValue = watch('isActive', true);

  // Load active departments
  useEffect(() => {
    if (isOpen) {
      fetchDepartments(true);
    }
  }, [isOpen, fetchDepartments]);

  // Populate form on edit or create
  useEffect(() => {
    if (isOpen) {
      if (roomToEdit) {
        reset({
          name: roomToEdit.name || '',
          floorLocation: roomToEdit.floorLocation || roomToEdit.location || '',
          department: roomToEdit.department || '',
          capacity: roomToEdit.capacity || 10,
          description: roomToEdit.description || '',
          isActive: roomToEdit.isActive !== false,
        });
        setImagePreview(roomToEdit.imageUrl || null);
      } else {
        reset({
          name: '',
          floorLocation: '',
          department: isSecretary && secretaryDept ? secretaryDept : '',
          capacity: 10,
          description: '',
          isActive: true,
        });
        setImagePreview(null);
      }
      setSelectedFile(null);
    }
  }, [isOpen, roomToEdit, isSecretary, secretaryDept, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB) and type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(roomToEdit?.imageUrl || null);
  };

  const handleModalClose = () => {
    reset();
    setSelectedFile(null);
    setImagePreview(null);
    onClose();
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        floorLocation: data.floorLocation.trim(),
        department: isSecretary && secretaryDept ? secretaryDept : data.department,
        capacity: Number(data.capacity),
        description: data.description?.trim() || '',
        isActive: Boolean(data.isActive),
      };

      let savedRoom;
      if (roomToEdit?.id) {
        // Update existing room
        savedRoom = await masterDataApi.updateMeetingRoom(roomToEdit.id, payload);
        toast.success(`Meeting room "${savedRoom?.name || payload.name}" updated successfully.`);
      } else {
        // Create new room
        savedRoom = await masterDataApi.createMeetingRoom(payload);
        soundPlayer.playNotificationChime();
        toast.success(`Meeting room "${savedRoom?.name || payload.name}" created successfully.`);
      }

      // If photo was selected, upload image
      const targetRoomId = savedRoom?.id || roomToEdit?.id;
      if (selectedFile && targetRoomId) {
        try {
          await masterDataApi.uploadRoomImage(targetRoomId, selectedFile);
          toast.success('Room photo updated.');
        } catch (imgErr) {
          const imgErrMsg = handleRoomApiError(imgErr, 'Room saved, but image upload failed.');
          toast.error(imgErrMsg);
        }
      }

      handleModalClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = handleRoomApiError(
        err,
        roomToEdit ? 'Failed to update meeting room.' : 'Failed to create meeting room.'
      );
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={roomToEdit ? 'Edit Meeting Room' : 'Add New Meeting Room'}
      subtitle={
        roomToEdit
          ? `Update facility configuration and capacity for ${roomToEdit.name}.`
          : 'Configure a conference room or executive meeting facility.'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Secretary Notice */}
        {isSecretary && secretaryDept && (
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00adef] shrink-0" />
              <span>
                Managing for assigned department: <strong className="font-bold">{secretaryDept}</strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-[#00adef] border border-sky-300">
              Department Locked
            </span>
          </div>
        )}

        {/* Room Name & Floor Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Room Name"
            icon={DoorOpen}
            placeholder="e.g. Abba Gada Boardroom"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Input
            label="Floor Location"
            icon={MapPin}
            placeholder="e.g. 4th Floor - Wing B"
            error={errors.floorLocation?.message}
            required
            {...register('floorLocation')}
          />
        </div>

        {/* Department & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Assigned Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                disabled={isSecretary && Boolean(secretaryDept)}
                className={`w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl border transition-all ${
                  isSecretary && Boolean(secretaryDept)
                    ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]'
                }`}
                {...register('department')}
              >
                {isSecretary && secretaryDept ? (
                  <option value={secretaryDept}>{secretaryDept}</option>
                ) : (
                  <>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {errors.department && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">
                {errors.department.message}
              </p>
            )}
          </div>

          <Input
            label="Seating Capacity (Persons)"
            type="number"
            icon={Users}
            placeholder="18"
            min={1}
            max={500}
            error={errors.capacity?.message}
            required
            {...register('capacity')}
          />
        </div>

        {/* Description Field */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Description & Amenities
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Equipped with 85-inch 4K video conferencing display, high-speed Wi-Fi, and soundproof glass..."
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00adef] transition-all"
            {...register('description')}
          />
        </div>

        {/* Photo Upload with Instant Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#00adef]" />
              <span>Room Photography</span>
            </span>
            {selectedFile && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                New file ready
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Thumbnail Preview */}
            <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center group shadow-xs">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Room Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <DoorOpen className="w-6 h-6 mb-1" />
                  <span className="text-[9px] font-bold">No Image</span>
                </div>
              )}
              {selectedFile && (
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove selected file"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-1.5 text-left w-full">
              <label
                htmlFor="room-photo-upload"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-[#00adef] hover:text-[#00adef] shadow-xs cursor-pointer transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{imagePreview ? 'Change Photo' : 'Upload Room Photo'}</span>
              </label>
              <input
                id="room-photo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Supports JPG, PNG, WEBP up to 5MB. Preview appears immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Active Status Toggle */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">Room Booking Status</p>
            <p className="text-[11px] text-slate-500">
              {isActiveValue
                ? 'Active — Room is available for reservations in the calendar.'
                : 'Inactive — Room is hidden from booking rosters (maintenance or closed).'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('isActive')}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00adef]"></div>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handleModalClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="orange"
            icon={CheckCircle2}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {roomToEdit ? 'Save Room Changes' : 'Create Meeting Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditRoomModal;
