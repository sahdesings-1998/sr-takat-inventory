import React from "react";
import { Modal } from "../../../components/ui/Modal";
import ExpenseForm from "./ExpenseForm.jsx";

export function ExpenseModal({ isOpen, onClose, initialData, onSubmit, isLoading }) {
  const handleSubmit = async (formData) => {
    await onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Expense" : "Add Expense"}
      size="lg"
    >
      <ExpenseForm initialData={initialData} onSubmit={handleSubmit} isLoading={isLoading} />
    </Modal>
  );
}

export default ExpenseModal;
