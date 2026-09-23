import React, { useState } from 'react';
import { AlertTriangle, Trash2, DoorOpen, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import masterDataApi, { handleRoomApiError } from '@/modules/master_data/api/masterDataApi';

export const DeleteRoomConfirmModal = ({ isOpen, onClose, room, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!room) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await masterDataApi.deleteMeetingRoom(room.id);
      toast.success(`Meeting room "${room.name}" deleted successfully.`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = handleRoomApiError(err, 'Failed to delete meeting room.');
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Meeting Room"
      subtitle="Are you sure you want to permanently remove this facility?"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-left">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Permanent Removal Action</p>
            <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
              Deleting this meeting room will remove it from the booking scheduler. Existing historical visit records referencing this room may be impacted.
            </p>
          </div>
        </div>

        {/* Room Info Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-[#00adef]" />
            <span className="font-bold text-slate-900 text-sm">{room.name}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{room.floorLocation || room.location || 'Location not specified'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Department: <strong className="text-slate-800">{room.department || 'General'}</strong></span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            Delete Room
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteRoomConfirmModal;
