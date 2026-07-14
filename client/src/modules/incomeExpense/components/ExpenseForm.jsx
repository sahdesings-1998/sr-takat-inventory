import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { expenseValidationSchema } from "../validation/schemas.js";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, STATUS_OPTIONS } from "../constants/index.js";

function formatDateField(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

export function ExpenseForm({ initialData, onSubmit, isLoading }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(expenseValidationSchema),
    defaultValues: {
      date: formatDateField(initialData?.date),
      category: initialData?.category || "Other",
      description: initialData?.description || "",
      amount: initialData?.amount ?? "",
      paymentMethod: initialData?.paymentMethod || "Cash",
      notes: initialData?.notes || "",
      status: initialData?.status || "Completed",
      reference: initialData?.reference || "",
      vendor: initialData?.vendor || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        date: formatDateField(initialData.date),
        category: initialData.category || "Other",
        description: initialData.description || "",
        amount: initialData.amount ?? "",
        paymentMethod: initialData.paymentMethod || "Cash",
        notes: initialData.notes || "",
        status: initialData.status || "Completed",
        reference: initialData.reference || "",
        vendor: initialData.vendor || "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              label="Date"
              error={errors.date?.message}
            />
          )}
        />

        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              label="Amount *"
              placeholder="0.00"
              step="0.01"
              min="0"
              error={errors.amount?.message}
            />
          )}
        />

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Category *"
              options={EXPENSE_CATEGORIES}
              error={errors.category?.message}
            />
          )}
        />

        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Payment Method *"
              options={PAYMENT_METHODS}
              error={errors.paymentMethod?.message}
            />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Status *"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
            />
          )}
        />

        <Controller
          name="reference"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Reference"
              placeholder="Invoice, receipt number, etc."
              error={errors.reference?.message}
            />
          )}
        />

        <Controller
          name="vendor"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Vendor"
              placeholder="Vendor name"
              error={errors.vendor?.message}
            />
          )}
        />
      </div>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type="text"
            label="Description *"
            placeholder="Enter expense description"
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="Notes"
            placeholder="Additional notes (optional)"
            rows={3}
            error={errors.notes?.message}
          />
        )}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Expense" : "Create Expense"}
        </Button>
      </div>
    </form>
  );
}

export default ExpenseForm;
