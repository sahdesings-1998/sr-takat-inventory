import { z } from "zod";

export const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name is too long"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long"),
  address: z
    .string()
    .trim()
    .max(250, "Address is too long")
    .optional()
    .or(z.literal("")),
  companyName: z
    .string()
    .trim()
    .max(100, "Company name is too long")
    .optional()
    .or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  whatsApp: z.string().trim().optional().or(z.literal("")),
  customerType: z
    .enum(["Private Client", "Dealer", "Wholesaler", "VIP", "Other"])
    .default("Private Client"),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export default customerSchema;
