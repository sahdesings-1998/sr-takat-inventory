import { z } from "zod";

export const settingsSchema = z.object({
  charityPercentage: z.coerce
    .number()
    .min(0, "Percentage must be positive")
    .max(100, "Percentage cannot exceed 100"),
  currency: z.string().min(1, "Currency is required"),
  prefixes: z.object({
    gemstone: z.string().min(1, "Prefix is required"),
    lot: z.string().min(1, "Prefix is required"),
    product: z.string().min(1, "Prefix is required"),
    invoice: z.string().min(1, "Prefix is required"),
    memo: z.string().min(1, "Prefix is required"),
    jobCard: z.string().min(1, "Prefix is required"),
  }),
  certificateLabs: z.array(z.string()).min(1, "At least one lab must be specified"),
  exchangeRate: z.coerce.number().min(0, "Exchange rate must be positive"),
  companyInfo: z.object({
    name: z.string().min(1, "Company name is required"),
    address: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),
  }),
});

export default settingsSchema;
