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
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import ImageUploader from "@/components/ui/ImageUploader";

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

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch products.");
    }
  }, [isError, showError]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stockNo: "",
      category: "Other",
      name: "",
      description: "",
      sellingPrice: 0,
      costPrice: 0,
      status: "In Stock",
      imageUrls: [],
    },
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    reset({
      stockNo: "",
      category: "Other",
      name: "",
      description: "",
      sellingPrice: 0,
      costPrice: 0,
      status: "In Stock",
      imageUrls: [],
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    reset({
      stockNo: prod.stockNo,
      category: prod.category || "Other",
      name: prod.name,
      description: prod.description || "",
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      status: prod.status || "In Stock",
      imageUrls: prod.imageUrls || [],
    });
    setIsOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct._id, data });
        showSuccess("Product Updated", "Product information updated successfully!");
      } else {
        await createProduct(data);
        showSuccess("Product Created", "New product catalog created successfully!");
      }
      setIsOpen(false);
      reset();
    } catch (err) {
      showError("Action Failed", err?.response?.data?.message || "Something went wrong.");
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Reserved":
      case "On Memo":
        return "warning";
      case "Sold":
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
          options={[
            { value: "Ring", label: "Ring" },
            { value: "Necklace", label: "Necklace" },
            { value: "Earrings", label: "Earrings" },
            { value: "Bracelet", label: "Bracelet" },
            { value: "Pendant", label: "Pendant" },
            { value: "Watch", label: "Watch" },
            { value: "Other", label: "Other" },
          ]}
        />
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-full sm:w-48"
          options={[
            { value: "In Stock", label: "In Stock" },
            { value: "Reserved", label: "Reserved" },
            { value: "On Memo", label: "On Memo" },
            { value: "Sold", label: "Sold" },
            { value: "Missing", label: "Missing" },
            { value: "Damaged", label: "Damaged" },
          ]}
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
          <tr
            key={prod._id}
            className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-sm"
          >
            <td className="px-6 py-4 font-semibold text-primary">
              <div className="flex items-center gap-3">
                {prod.imageUrls && prod.imageUrls[0] ? (
                  <img
                    src={prod.imageUrls[0]}
                    alt={prod.productCode}
                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(prod.imageUrls[0]);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100 text-gray-400">
                    <ImageIcon className="h-4.5 w-4.5" />
                  </div>
                )}
                <span>{prod.productCode}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-gray-600">{prod.stockNo}</td>
            <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
            <td className="px-6 py-4 text-gray-600">{prod.category}</td>
            <td className="px-6 py-4 text-gray-600">${prod.costPrice.toLocaleString()}</td>
            <td className="px-6 py-4 text-gray-900 font-semibold">
              ${prod.sellingPrice.toLocaleString()}
            </td>
            <td className="px-6 py-4 font-semibold text-emerald-600">
              ${(prod.netProfit || 0).toLocaleString()}
            </td>
            <td className="px-6 py-4">
              <Badge variant={getStatusVariant(prod.status)}>{prod.status}</Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <Link
                  to={`/products/${prod._id}`}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        className="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          noValidate
        >

          <Input label="Stock No *" error={errors.stockNo?.message} {...register("stockNo")} />
          <Select
            label="Category *"
            error={errors.category?.message}
            options={[
              { value: "Ring", label: "Ring" },
              { value: "Necklace", label: "Necklace" },
              { value: "Earrings", label: "Earrings" },
              { value: "Bracelet", label: "Bracelet" },
              { value: "Pendant", label: "Pendant" },
              { value: "Watch", label: "Watch" },
              { value: "Other", label: "Other" },
            ]}
            {...register("category")}
          />
          <Input
            label="Product Name *"
            containerClassName="md:col-span-2"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Cost Price *"
            type="number"
            step="0.01"
            error={errors.costPrice?.message}
            {...register("costPrice")}
          />
          <Input
            label="Selling Price *"
            type="number"
            step="0.01"
            error={errors.sellingPrice?.message}
            {...register("sellingPrice")}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: "In Stock", label: "In Stock" },
              { value: "Reserved", label: "Reserved" },
              { value: "On Memo", label: "On Memo" },
              { value: "Sold", label: "Sold" },
              { value: "Missing", label: "Missing" },
              { value: "Damaged", label: "Damaged" },
            ]}
            {...register("status")}
            containerClassName="md:col-span-2"
          />
          <Textarea
            label="Description"
            containerClassName="md:col-span-2"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="md:col-span-2">
            <Controller
              control={control}
              name="imageUrls"
              render={({ field }) => (
                <ImageUploader
                  label="Product Images"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrls?.message}
                />
              )}
            />
          </div>

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

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Image Preview"
      >
        <div className="flex items-center justify-center w-full max-h-[70vh] md:max-h-[60vh] overflow-auto">
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-100"
          />
        </div>
      </Modal>
    </div>
  );
}
