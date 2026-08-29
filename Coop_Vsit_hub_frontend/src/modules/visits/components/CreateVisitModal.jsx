import React from 'react';
import useVisitStore from '../store/visitStore';
import NewVisitorBookingModal from '@/modules/security/components/NewVisitorBookingModal';

export const CreateVisitModal = () => {
  const { isCreateModalOpen, closeCreateModal, fetchVisits } = useVisitStore();

  return (
    <NewVisitorBookingModal
      isOpen={isCreateModalOpen}
      onClose={closeCreateModal}
      onSuccess={fetchVisits}
    />
  );
};

export default CreateVisitModal;
