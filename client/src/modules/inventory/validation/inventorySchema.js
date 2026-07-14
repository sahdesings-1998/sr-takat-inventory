import { z } from "zod";

export const gemstoneSchema = z.object({
  stockNo: z.string().trim().min(1, "Stock number is required"),
  gemstone: z.string().trim().min(1, "Gemstone type is required"),
  variety: z.string().trim().optional().or(z.literal("")),
  origin: z.string().trim().optional().or(z.literal("")),
  shape: z.string().trim().optional().or(z.literal("")),
  carat: z.coerce.number().gt(0, "Carat weight must be greater than zero"),
  pieces: z.coerce.number().int().min(1, "Pieces must be at least 1"),
  color: z.string().trim().optional().or(z.literal("")),
  clarity: z.string().trim().optional().or(z.literal("")),
  treatment: z.string().trim().default("None"),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive"),
  supplierId: z.string().min(1, "Supplier is required"),
  location: z.string().trim().default("Vault"),
  status: z
    .enum(["In Stock", "Reserved", "In Production", "On Memo", "Sold", "Damaged", "Missing"])
    .default("In Stock"),
  certificateId: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  images: z.array(z.string()).optional().default([]),
});

export const lotSchema = z.object({
  gemstone: z.string().trim().min(1, "Gemstone type is required"),
  totalCarat: z.coerce.number().gt(0, "Total carat weight must be greater than zero"),
  estimatedPieces: z.coerce.number().int().min(0, "Estimated pieces must be positive"),
  purchaseCost: z.coerce.number().min(0, "Purchase cost must be positive"),
  supplierId: z.string().min(1, "Supplier is required"),
  location: z.string().trim().default("Vault"),
  status: z.enum(["In Stock", "Active", "Depleted", "Missing"]).default("In Stock"),
});

export const materialSchema = z.object({
  materialCode: z.string().trim().min(1, "Material code is required"),
  category: z
    .enum(["Gold", "Silver", "Platinum", "Setting", "Findings", "Packaging", "Other"])
    .default("Other"),
  materialName: z.string().trim().min(1, "Material name is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  cost: z.coerce.number().min(0, "Unit cost must be positive"),
  location: z.string().trim().default("Workshop Vault"),
  status: z.enum(["active", "inactive"]).default("active"),
});
