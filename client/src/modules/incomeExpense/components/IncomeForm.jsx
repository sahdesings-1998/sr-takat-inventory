import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { incomeValidationSchema } from "../validation/schemas.js";
import { INCOME_CATEGORIES, PAYMENT_METHODS, STATUS_OPTIONS } from "../constants/index.js";

function formatDateField(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

export function IncomeForm({ initialData, onSubmit, isLoading }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(incomeValidationSchema),
    defaultValues: {
      date: formatDateField(initialData?.date),
      category: initialData?.category || "Sales",
      description: initialData?.description || "",
      amount: initialData?.amount ?? "",
      paymentMethod: initialData?.paymentMethod || "Cash",
      notes: initialData?.notes || "",
      status: initialData?.status || "Completed",
      reference: initialData?.reference || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        date: formatDateField(initialData.date),
        category: initialData.category || "Sales",
        description: initialData.description || "",
        amount: initialData.amount ?? "",
        paymentMethod: initialData.paymentMethod || "Cash",
        notes: initialData.notes || "",
        status: initialData.status || "Completed",
        reference: initialData.reference || "",
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
            <DatePicker
              {...field}
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
              options={INCOME_CATEGORIES}
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
              placeholder="Invoice, check number, etc."
              error={errors.reference?.message}
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
            placeholder="Enter income description"
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
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Update Income" : "Create Income"}
        </Button>
      </div>
    </form>
  );
}

export default IncomeForm;
