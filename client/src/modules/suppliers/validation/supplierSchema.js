import { z } from "zod";

export const supplierSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name is too long"),
  contactName: z
    .string()
    .trim()
    .max(100, "Contact name is too long")
    .optional()
    .or(z.literal("")),
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
  whatsApp: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  supplierType: z
    .enum(["Gemstone Supplier", "Metal Dealer", "Component Supplier", "Artisan / Workshop", "Other"])
    .default("Gemstone Supplier"),
  address: z
    .string()
    .trim()
    .max(250, "Address is too long")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export default supplierSchema;
