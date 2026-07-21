import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductWizard from "../components/ProductWizard";
import { useProducts } from "../hooks/useProducts";
import { useToast } from "@/contexts/ToastContext";
import { PackagePlus, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AddProductPage() {
  const navigate = useNavigate();
  const { createProduct } = useProducts();
  const { showSuccess, showError } = useToast();

  const handleCreateProduct = async (formData) => {
    try {
      await createProduct(formData);
      showSuccess("Product Created", "New product created and published successfully!");
      navigate("/products");
    } catch (err) {
      showError("Creation Error", err.response?.data?.message || "Failed to create product.");
      throw err;
    }
  };

  return (
    <div className="page-container">
      {/* Top Page Header */}
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
              <PackagePlus className="h-6 w-6 text-primary" />
              Product Creation Wizard
            </h1>
            <p className="text-xs text-gray-500">
              Enterprise dynamic product engine for gemstones, jewellery, watches, and accessories
            </p>
          </div>
        </div>
      </div>

      {/* Product Wizard Orchestrator */}
      <ProductWizard
        isEditing={false}
        onSubmitSuccess={handleCreateProduct}
      />
    </div>
  );
}
