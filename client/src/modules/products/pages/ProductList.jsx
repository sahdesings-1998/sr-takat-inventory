import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Eye, Image as ImageIcon } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { productSchema } from "../validation/productSchema";
import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import ImageUploader from "@/components/ui/ImageUploader";
import FileUploader from "@/components/ui/FileUploader";

const tabs = [
  { key: "general", label: "General" },
  { key: "images", label: "Images" },
  { key: "pricing", label: "Pricing" },
  { key: "specifications", label: "Specifications" },
  { key: "gemstones", label: "Gemstones" },
  { key: "components", label: "Components" },
  { key: "costs", label: "Cost Summary" },
  { key: "inventory", label: "Inventory" },
  { key: "supplier", label: "Supplier" },
  { key: "sales", label: "Sales" },
  { key: "certificates", label: "Certificates" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
];

const categoryOptions = [
  { value: "Gemstone", label: "Gemstone" },
  { value: "Jewellery", label: "Jewellery" },
  { value: "Watch", label: "Watch" },
  { value: "Custom Product", label: "Custom Product" },
  { value: "Accessory", label: "Accessory" },
  { value: "Ring", label: "Ring" },
  { value: "Necklace", label: "Necklace" },
  { value: "Earrings", label: "Earrings" },
  { value: "Bracelet", label: "Bracelet" },
  { value: "Pendant", label: "Pendant" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "On Consignment", label: "On Consignment" },
  { value: "On Memo", label: "On Memo" },
  { value: "In Production", label: "In Production" },
  { value: "Sold", label: "Sold" },
  { value: "Returned", label: "Returned" },
  { value: "Archived", label: "Archived" },
  { value: "In Stock", label: "In Stock" },
  { value: "Missing", label: "Missing" },
  { value: "Damaged", label: "Damaged" },
];

export default function ProductList() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { products, isLoading, isError, createProduct, updateProduct } = useProducts({
    search,
    category: categoryFilter,
    status: statusFilter,
  });
  const { showSuccess, showError } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products.");
    }
  }, [isError, showError]);

  const getDefaultValues = (product = null) => ({
    stockNo: product?.stockNo || "",
    category: product?.category || "Other",
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    qrCode: product?.qrCode || "",
    subCategory: product?.subCategory || "",
    collection: product?.collection || "",
    brand: product?.brand || "",
    model: product?.model || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    status: product?.status || "Draft",
    purchasePrice: product?.purchasePrice ?? product?.costPrice ?? 0,
    additionalCost: product?.additionalCost ?? 0,
    totalCost: product?.totalCost ?? product?.costPrice ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    minimumSellingPrice: product?.minimumSellingPrice ?? 0,
    wholesalePrice: product?.wholesalePrice ?? 0,
    retailPrice: product?.retailPrice ?? 0,
    currency: product?.currency || "USD",
    discountAllowed: product?.discountAllowed ? "true" : "false",
    profit: product?.profit ?? 0,
    margin: product?.margin ?? 0,
    weight: product?.weight || "",
    dimensions: product?.dimensions || "",
    material: product?.material || "",
    metalType: product?.metalType || "",
    goldPurity: product?.goldPurity || "",
    countryOfOrigin: product?.countryOfOrigin || "",
    manufacturedBy: product?.manufacturedBy || "",
    manufacturedDate: product?.manufacturedDate ? product.manufacturedDate.slice(0, 10) : "",
    gemstoneType: product?.gemstoneType || "",
    variety: product?.variety || "",
    origin: product?.origin || "",
    shape: product?.shape || "",
    cut: product?.cut || "",
    colour: product?.colour || "",
    clarity: product?.clarity || "",
    treatment: product?.treatment || "",
    heatStatus: product?.heatStatus || "",
    oilLevel: product?.oilLevel || "",
    transparency: product?.transparency || "",
    qualityGrade: product?.qualityGrade || "",
    naturalSynthetic: product?.naturalSynthetic || "",
    pieces: product?.pieces ?? 0,
    totalCarat: product?.totalCarat ?? 0,
    averageCarat: product?.averageCarat ?? 0,
    costPerCarat: product?.costPerCarat ?? 0,
    sellingPricePerCarat: product?.sellingPricePerCarat ?? 0,
    certificateAvailable: product?.certificateAvailable ? "true" : "false",
    laboratory: product?.laboratory || "",
    certificateNumber: product?.certificateNumber || "",
    certificateDate: product?.certificateDate ? product.certificateDate.slice(0, 10) : "",
    certificateCost: product?.certificateCost ?? 0,
    certificatePdf: product?.certificatePdf || "",
    certificateImages: product?.certificateImages || "",
    certificateNotes: product?.certificateNotes || "",
    materialCost: product?.materialCost ?? 0,
    manufacturingCost: product?.manufacturingCost ?? 0,
    packagingCost: product?.packagingCost ?? 0,
    shippingCost: product?.shippingCost ?? 0,
    insuranceCost: product?.insuranceCost ?? 0,
    otherCosts: product?.otherCosts ?? 0,
    totalCostSummary: product?.totalCostSummary ?? 0,
    warehouse: product?.warehouse || "",
    location: product?.location || "",
    shelf: product?.shelf || "",
    quantity: product?.quantity ?? 0,
    availableQuantity: product?.availableQuantity ?? 0,
    reservedQuantity: product?.reservedQuantity ?? 0,
    minimumStock: product?.minimumStock ?? 0,
    maximumStock: product?.maximumStock ?? 0,
    reorderLevel: product?.reorderLevel ?? 0,
    supplier: product?.supplier || "",
    supplierReference: product?.supplierReference || "",
    purchaseDate: product?.purchaseDate ? product.purchaseDate.slice(0, 10) : "",
    purchaseInvoice: product?.purchaseInvoice || "",
    paymentStatus: product?.paymentStatus || "",
    outstandingAmount: product?.outstandingAmount ?? 0,
    supplierNotes: product?.supplierNotes || "",
    sellingStatus: product?.sellingStatus || "",
    lastSellingPrice: product?.lastSellingPrice ?? 0,
    customer: product?.customer || "",
    salesperson: product?.salesperson || "",
    lastSoldDate: product?.lastSoldDate ? product.lastSoldDate.slice(0, 10) : "",
    salesPaymentStatus: product?.salesPaymentStatus || "",
    consignmentStatus: product?.consignmentStatus || "",
    documents: product?.documents || "",
    warranty: product?.warranty || "",
    cadFiles: product?.cadFiles || "",
    videos: product?.videos || "",
    internalNotes: product?.internalNotes || "",
    customerNotes: product?.customerNotes || "",
    specialInstructions: product?.specialInstructions || "",
    tagsInput: Array.isArray(product?.tags) ? product.tags.join(", ") : "",
    components: Array.isArray(product?.components) && product.components.length > 0 ? product.components : [{ name: "", quantity: 1, unitCost: 0 }],
    imageUrls: product?.imageUrls || [],
    costPrice: product?.costPrice ?? 0,
    sellingPriceValue: product?.sellingPrice ?? 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(),
  });

  const categoryValue = watch("category") || "Other";
  const showGemstoneFields = ["Gemstone", "Jewellery", "Watch"].includes(categoryValue);
  const showComponentSection = ["Jewellery", "Watch", "Custom Product"].includes(categoryValue);
  const showMetalFields = ["Jewellery", "Watch"].includes(categoryValue);
  const components = watch("components") || [];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setActiveTab("general");
    reset(getDefaultValues());
    setIsOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setActiveTab("general");
    reset(getDefaultValues(prod));
    setIsOpen(true);
  };

  const updateComponentRow = (index, field, value) => {
    const next = [...components];
    next[index] = { ...next[index], [field]: value };
    setValue("components", next, { shouldDirty: true });
  };

  const addComponentRow = () => {
    setValue("components", [...components, { name: "", quantity: 1, unitCost: 0 }], { shouldDirty: true });
  };

  const removeComponentRow = (index) => {
    const next = components.filter((_, idx) => idx !== index);
    setValue("components", next, { shouldDirty: true });
  };

  const buildPayload = (data) => {
    const purchasePrice = Number(data.purchasePrice || 0);
    const additionalCost = Number(data.additionalCost || 0);
    const costPrice = purchasePrice + additionalCost;
    const sellingPrice = Number(data.sellingPrice || 0);
    const totalCost = Number(data.totalCost || 0) || costPrice;
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      ...data,
      costPrice,
      purchasePrice,
      additionalCost,
      totalCost,
      sellingPrice,
      profit,
      margin,
      discountAllowed: data.discountAllowed === "true",
      certificateAvailable: data.certificateAvailable === "true",
      components: (data.components || []).map((component) => ({
        name: component.name || "",
        quantity: Number(component.quantity || 0),
        unitCost: Number(component.unitCost || 0),
      })),
      tags: (data.tagsInput || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrls: data.imageUrls || [],
    };
  };

  const onSubmit = async (data) => {
    try {
      const payload = buildPayload(data);
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, data: payload });
        showSuccess("Product Updated", "Product information updated successfully!");
      } else {
        await createProduct(payload);
        showSuccess("Product Created", "New product catalog created successfully!");
      }
      setIsOpen(false);
      reset(getDefaultValues());
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Available":
      case "In Stock":
        return "success";
      case "Reserved":
      case "On Memo":
      case "On Consignment":
        return "warning";
      case "Sold":
      case "Archived":
        return "accent";
      default:
        return "neutral";
    }
  };

  const headers = [
    "Product Code",
    "Stock No",
    "Name",
    "Category",
    "Cost Price",
    "Selling Price",
    "Net Margin",
    "Status",
    "Actions",
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "images":
        return (
          <div className="md:col-span-2 space-y-4">
            <Controller
              control={control}
              name="videos"
              render={({ field }) => (
                <FileUploader
                  label="Attach Video"
                  buttonLabel="Attach Video"
                  accept="video/*"
                  helperText="MP4, MOV, or WebM files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="imageUrls"
              render={({ field }) => (
                <ImageUploader
                  label="Gallery Images"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrls?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="documents"
              render={({ field }) => (
                <FileUploader
                  label="Attach Document"
                  buttonLabel="Attach Document"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  helperText="PDF, Word, Excel, or other document files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        );
      case "pricing":
        return (
          <>
            <Input label="Purchase Price" type="number" step="0.01" {...register("purchasePrice")} />
            <Input label="Additional Cost" type="number" step="0.01" {...register("additionalCost")} />
            <Input label="Total Cost" type="number" step="0.01" {...register("totalCost")} />
            <Input label="Selling Price" type="number" step="0.01" {...register("sellingPrice")} />
            <Input label="Minimum Selling Price" type="number" step="0.01" {...register("minimumSellingPrice")} />
            <Input label="Wholesale Price" type="number" step="0.01" {...register("wholesalePrice")} />
            <Input label="Retail Price" type="number" step="0.01" {...register("retailPrice")} />
            <Select label="Currency" options={[{ value: "USD", label: "USD" }, { value: "AED", label: "AED" }, { value: "EUR", label: "EUR" }]} {...register("currency")} />
            <Select label="Discount Allowed" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} {...register("discountAllowed")} />
            <Input label="Profit" type="number" step="0.01" {...register("profit")} />
            <Input label="Margin" type="number" step="0.01" {...register("margin")} />
          </>
        );
      case "specifications":
        return (
          <>
            <Input label="Weight" {...register("weight")} />
            <Input label="Dimensions" {...register("dimensions")} />
            <Input label="Material" {...register("material")} />
            {showMetalFields ? <Input label="Metal Type" {...register("metalType")} /> : null}
            {showMetalFields ? <Input label="Gold Purity" {...register("goldPurity")} /> : null}
            <Input label="Country of Origin" {...register("countryOfOrigin")} />
            <Input label="Manufactured By" {...register("manufacturedBy")} />
            <DatePicker label="Manufactured Date" {...register("manufacturedDate")} />
          </>
        );
      case "gemstones":
        return showGemstoneFields ? (
          <>
            <Input label="Gemstone Type" {...register("gemstoneType")} />
            <Input label="Variety" {...register("variety")} />
            <Input label="Origin" {...register("origin")} />
            <Input label="Shape" {...register("shape")} />
            <Input label="Cut" {...register("cut")} />
            <Input label="Colour" {...register("colour")} />
            <Input label="Clarity" {...register("clarity")} />
            <Input label="Treatment" {...register("treatment")} />
            <Input label="Heat Status" {...register("heatStatus")} />
            <Input label="Oil Level" {...register("oilLevel")} />
            <Input label="Transparency" {...register("transparency")} />
            <Input label="Quality Grade" {...register("qualityGrade")} />
            <Input label="Natural / Synthetic" {...register("naturalSynthetic")} />
            <Input label="Pieces" type="number" {...register("pieces")} />
            <Input label="Total Carat" type="number" step="0.01" {...register("totalCarat")} />
            <Input label="Average Carat" type="number" step="0.01" {...register("averageCarat")} />
            <Input label="Cost Per Carat" type="number" step="0.01" {...register("costPerCarat")} />
            <Input label="Selling Price Per Carat" type="number" step="0.01" {...register("sellingPricePerCarat")} />
          </>
        ) : (
          <div className="md:col-span-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            Gemstone details appear automatically for gemstone, jewellery, and watch products.
          </div>
        );
      case "components":
        return showComponentSection ? (
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Dynamic Components</h3>
              <Button type="button" variant="outline" onClick={addComponentRow}>
                + Add Component
              </Button>
            </div>
            {components.map((component, index) => (
              <div key={`${component.name || "component"}-${index}`} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1.4fr_0.7fr_0.8fr_auto]">
                <Input label="Component" value={component.name || ""} onChange={(e) => updateComponentRow(index, "name", e.target.value)} />
                <Input label="Qty" type="number" value={component.quantity || 0} onChange={(e) => updateComponentRow(index, "quantity", Number(e.target.value))} />
                <Input label="Unit Cost" type="number" step="0.01" value={component.unitCost || 0} onChange={(e) => updateComponentRow(index, "unitCost", Number(e.target.value))} />
                <Button type="button" variant="outline" onClick={() => removeComponentRow(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="md:col-span-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            Components are shown for jewellery, watch, and custom products.
          </div>
        );
      case "costs":
        return (
          <>
            <Input label="Material Cost" type="number" step="0.01" {...register("materialCost")} />
            <Input label="Manufacturing Cost" type="number" step="0.01" {...register("manufacturingCost")} />
            <Input label="Packaging" type="number" step="0.01" {...register("packagingCost")} />
            <Input label="Certificate Cost" type="number" step="0.01" {...register("certificateCost")} />
            <Input label="Shipping" type="number" step="0.01" {...register("shippingCost")} />
            <Input label="Insurance" type="number" step="0.01" {...register("insuranceCost")} />
            <Input label="Other Costs" type="number" step="0.01" {...register("otherCosts")} />
            <Input label="Total Cost" type="number" step="0.01" {...register("totalCostSummary")} />
          </>
        );
      case "inventory":
        return (
          <>
            <Input label="Warehouse" {...register("warehouse")} />
            <Input label="Location" {...register("location")} />
            <Input label="Shelf" {...register("shelf")} />
            <Input label="Quantity" type="number" {...register("quantity")} />
            <Input label="Available Quantity" type="number" {...register("availableQuantity")} />
            <Input label="Reserved Quantity" type="number" {...register("reservedQuantity")} />
            <Input label="Minimum Stock" type="number" {...register("minimumStock")} />
            <Input label="Maximum Stock" type="number" {...register("maximumStock")} />
            <Input label="Reorder Level" type="number" {...register("reorderLevel")} />
          </>
        );
      case "supplier":
        return (
          <>
            <Input label="Supplier" {...register("supplier")} />
            <Input label="Supplier Reference" {...register("supplierReference")} />
            <DatePicker label="Purchase Date" {...register("purchaseDate")} />
            <Controller
              control={control}
              name="purchaseInvoice"
              render={({ field }) => (
                <FileUploader
                  label="Attach Purchase Invoice"
                  buttonLabel="Attach Invoice"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif"
                  helperText="PDF, Word, or Image file"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Input label="Payment Status" {...register("paymentStatus")} />
            <Input label="Outstanding Amount" type="number" step="0.01" {...register("outstandingAmount")} />
            <Textarea label="Supplier Notes" className="md:col-span-2" {...register("supplierNotes")} />
          </>
        );
      case "sales":
        return (
          <>
            <Input label="Selling Status" {...register("sellingStatus")} />
            <Input label="Last Selling Price" type="number" step="0.01" {...register("lastSellingPrice")} />
            <Input label="Customer" {...register("customer")} />
            <Input label="Salesperson" {...register("salesperson")} />
            <DatePicker label="Last Sold Date" {...register("lastSoldDate")} />
            <Input label="Payment Status" {...register("salesPaymentStatus")} />
            <Input label="Consignment Status" {...register("consignmentStatus")} />
          </>
        );
      case "certificates":
        return (
          <>
            <Select label="Certificate Available" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} {...register("certificateAvailable")} />
            <Select label="Laboratory" options={[{ value: "GIA", label: "GIA" }, { value: "GRS", label: "GRS" }, { value: "SSEF", label: "SSEF" }, { value: "Gübelin", label: "Gübelin" }, { value: "IGI", label: "IGI" }, { value: "Other", label: "Other" }]} {...register("laboratory")} />
            <Input label="Certificate Number" {...register("certificateNumber")} />
            <DatePicker label="Certificate Date" {...register("certificateDate")} />
            <Input label="Certificate Cost" type="number" step="0.01" {...register("certificateCost")} />
            <Controller
              control={control}
              name="certificatePdf"
              render={({ field }) => (
                <FileUploader
                  label="Attach PDF"
                  buttonLabel="Attach PDF"
                  accept=".pdf,application/pdf"
                  helperText="Upload a certificate or report PDF"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="certificateImages"
              render={({ field }) => (
                <FileUploader
                  label="Attach Image"
                  buttonLabel="Attach Image"
                  accept="image/*"
                  helperText="JPG, PNG, or WEBP image files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Textarea label="Certificate Notes" className="md:col-span-2" {...register("certificateNotes")} />
          </>
        );
      case "documents":
        return (
          <>
            <Controller
              control={control}
              name="warranty"
              render={({ field }) => (
                <FileUploader
                  label="Attach Warranty Document"
                  buttonLabel="Attach Warranty"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  helperText="PDF, Word, or Text file"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="cadFiles"
              render={({ field }) => (
                <FileUploader
                  label="Attach CAD / 3D File"
                  buttonLabel="Attach CAD / 3D File"
                  accept=".step,.stp,.dwg,.dxf,.obj,.zip,.pdf,application/pdf,application/octet-stream"
                  helperText="STEP, DWG, OBJ, ZIP, or PDF files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="videos"
              render={({ field }) => (
                <FileUploader
                  label="Attach Video"
                  buttonLabel="Attach Video"
                  accept="video/*"
                  helperText="MP4, MOV, or WebM files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="documents"
              render={({ field }) => (
                <FileUploader
                  label="Attach Document"
                  buttonLabel="Attach Document"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  helperText="PDF, Word, Excel, or other document files"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </>
        );
      case "notes":
        return (
          <>
            <Textarea label="Internal Notes" className="md:col-span-2" {...register("internalNotes")} />
            <Textarea label="Customer Notes" className="md:col-span-2" {...register("customerNotes")} />
            <Textarea label="Special Instructions" className="md:col-span-2" {...register("specialInstructions")} />
            <Input label="Tags" {...register("tagsInput")} />
          </>
        );
      case "general":
      default:
        return (
          <>
            <Input label="Stock No *" error={errors.stockNo?.message} {...register("stockNo")} />
            <Select label="Category *" error={errors.category?.message} options={categoryOptions} {...register("category")} />
            <Input label="Product Name *" containerClassName="md:col-span-2" error={errors.name?.message} {...register("name")} />
            <Input label="SKU" {...register("sku")} />
            <Input label="Barcode" {...register("barcode")} />
            <Input label="QR Code" {...register("qrCode")} />
            <Input label="Sub Category" {...register("subCategory")} />
            <Input label="Collection" {...register("collection")} />
            <Input label="Brand" {...register("brand")} />
            <Input label="Model / Series" {...register("model")} />
            <Select label="Status" error={errors.status?.message} options={statusOptions} {...register("status")} />
            <Textarea label="Description" containerClassName="md:col-span-2" error={errors.description?.message} {...register("description")} />
            <Textarea label="Short Description" containerClassName="md:col-span-2" {...register("shortDescription")} />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Jewellery & Watch Products</h1>
          <p className="text-sm text-gray-500">
            Finished items with full traceability back to source gemstones, lots, and raw materials
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="w-fit">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
        <SearchInput
          placeholder="Search by code, name, or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput("")}
          containerClassName="flex-1 w-full"
          id="products-search"
        />
        <Select
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          containerClassName="w-full sm:w-48"
          options={categoryOptions}
        />
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-full sm:w-48"
          options={statusOptions}
        />
        {(search || categoryFilter || statusFilter) && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {products.length} result{products.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        headers={headers}
        data={products}
        isLoading={isLoading}
        emptyMessage="No products found"
        renderRow={(prod) => (
          <tr key={prod._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm">
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-primary min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {prod.imageUrls && prod.imageUrls[0] ? (
                  <img
                    src={prod.imageUrls[0]}
                    alt={prod.productCode}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(prod.imageUrls[0]);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100 text-gray-400 flex-shrink-0">
                    <ImageIcon className="h-4.5 w-4.5" />
                  </div>
                )}
                <span className="truncate text-xs sm:text-sm">{prod.productCode}</span>
              </div>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 truncate text-xs sm:text-sm">{prod.stockNo}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-medium text-gray-900 truncate text-xs sm:text-sm">{prod.name}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm">{prod.category}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-600 text-xs sm:text-sm">${(prod.costPrice || 0).toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 text-gray-900 font-semibold text-xs sm:text-sm">${(prod.sellingPrice || 0).toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6 font-semibold text-emerald-600 text-xs sm:text-sm">${(prod.netProfit || 0).toLocaleString()}</td>
            <td className="px-3 py-4 sm:px-4 md:px-6">
              <Badge variant={getStatusVariant(prod.status)}>{prod.status}</Badge>
            </td>
            <td className="px-3 py-4 sm:px-4 md:px-6 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <Link to={`/products/${prod._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="View Details">
                  <Eye className="h-4 w-4" />
                </Link>
                <button onClick={() => handleOpenEdit(prod)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"} className="max-w-5xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderTabContent()}</div>

          <div className="flex justify-end gap-3 md:col-span-2 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(previewImage)} onClose={() => setPreviewImage(null)} title="Image Preview">
        <div className="flex items-center justify-center w-full max-h-[70vh] md:max-h-[60vh] overflow-auto">
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-100" />
        </div>
      </Modal>
    </div>
  );
}
