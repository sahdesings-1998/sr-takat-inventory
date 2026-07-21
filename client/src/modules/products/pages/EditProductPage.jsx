import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductWizard from "../components/ProductWizard";
import { useProducts } from "../hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { Edit3, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import apiClient from "@/services/apiClient";

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateProduct } = useProducts();
  const { showSuccess, showError } = useToast();

  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}`);
      return res.data?.data?.product || res.data?.data || null;
    },
    enabled: Boolean(id),
  });

  const handleUpdateProduct = async (formData) => {
    try {
      await updateProduct({ id, data: formData });
      showSuccess("Product Updated", "Product changes updated successfully!");
      navigate("/products");
    } catch (err) {
      showError("Update Error", err.response?.data?.message || "Failed to update product.");
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-gray-500 mt-3">Loading product details...</p>
      </div>
    );
  }

  if (isError || !productData) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-red-600">Failed to load product details.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/products")} className="mt-4">
          Return to Products List
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container ">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/products")}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="text-gray-500 hover:text-gray-900"
          >
            Back to Products
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-primary" />
              Edit Product #{productData.stockNo || id}
            </h1>
            <p className="text-xs text-gray-500">
              Update specifications, pricing, inventory levels, and product media
            </p>
          </div>
        </div>
      </div>

      {/* Product Wizard Orchestrator in Edit Mode */}
      <ProductWizard
        initialData={productData}
        isEditing={true}
        onSubmitSuccess={handleUpdateProduct}
      />
    </div>
  );
}
