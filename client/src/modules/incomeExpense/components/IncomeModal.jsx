import React from "react";
import { Modal } from "../../../components/ui/Modal";
import IncomeForm from "./IncomeForm.jsx";

export function IncomeModal({ isOpen, onClose, initialData, onSubmit, isLoading }) {
  const handleSubmit = async (formData) => {
    await onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Income" : "Add Income"}
      size="lg"
    >
      <IncomeForm initialData={initialData} onSubmit={handleSubmit} isLoading={isLoading} />
    </Modal>
  );
}

export default IncomeModal;
