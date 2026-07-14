import { z } from "zod";

export const productSchema = z.object({
  stockNo: z.string().trim().min(1, "Stock number is required"),
  category: z
    .enum(["Ring", "Necklace", "Earrings", "Bracelet", "Pendant", "Watch", "Other"])
    .default("Other"),
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().optional().or(z.literal("")),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  status: z
    .enum(["In Stock", "Reserved", "On Memo", "Sold", "Missing", "Damaged"])
    .default("In Stock"),
  imageUrls: z.array(z.string()).optional().default([]),
});

export const componentSchema = z.object({
  sourceType: z.enum(["Gemstone", "GemstoneLot", "Material"]),
  sourceId: z.string().min(1, "Source item is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  weight: z.coerce.number().min(0, "Weight must be positive"),
  remarks: z.string().trim().optional().or(z.literal("")),
});
