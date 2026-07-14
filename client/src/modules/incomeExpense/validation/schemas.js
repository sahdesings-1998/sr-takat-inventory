import { z } from "zod";

export const incomeValidationSchema = z.object({
  date: z
    .date({ message: "Date is required" })
    .or(z.string().transform((val) => new Date(val)))
    .refine((date) => date <= new Date(), {
      message: "Date cannot be in the future",
    }),
  category: z.string({ message: "Category is required" }).min(1, "Category is required"),
  description: z
    .string({ message: "Description is required" })
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description cannot exceed 500 characters"),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a valid positive number",
    }),
  paymentMethod: z.string({ message: "Payment method is required" }).min(1),
  notes: z.string().optional().default(""),
  status: z.string({ message: "Status is required" }).min(1),
  reference: z.string().optional().default(""),
});

export const expenseValidationSchema = z.object({
  date: z
    .date({ message: "Date is required" })
    .or(z.string().transform((val) => new Date(val)))
    .refine((date) => date <= new Date(), {
      message: "Date cannot be in the future",
    }),
  category: z.string({ message: "Category is required" }).min(1, "Category is required"),
  description: z
    .string({ message: "Description is required" })
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description cannot exceed 500 characters"),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Amount must be a valid positive number",
    }),
  paymentMethod: z.string({ message: "Payment method is required" }).min(1),
  notes: z.string().optional().default(""),
  status: z.string({ message: "Status is required" }).min(1),
  reference: z.string().optional().default(""),
  vendor: z.string().optional().default(""),
});
