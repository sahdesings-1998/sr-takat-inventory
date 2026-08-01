import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { productSchema } from "../validation/productSchema";
import { useToast } from "@/contexts/ToastContext";
import WizardStepper from "./WizardStepper";
import WizardFooter from "./WizardFooter";
import ProductSidebar from "./ProductSidebar";
import DraftRestoreModal from "./DraftRestoreModal";
import StepBasicInfo from "./StepBasicInfo";
import StepCategoryDetails from "./StepCategoryDetails";
import StepPricing from "./StepPricing";
import StepInventorySupplier from "./StepInventorySupplier";
import StepReviewPublish from "./StepReviewPublish";

const DRAFT_STORAGE_KEY = "SR_TAKAT_ADD_PRODUCT_DRAFT";

export default function ProductWizard({ initialData = null, isEditing = false, onSubmitSuccess }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [autoSaveTime, setAutoSaveTime] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    stockNo: initialData?.stockNo || `STK-${Math.floor(10000 + Math.random() * 90000)}`,
    category: initialData?.category || "Jewellery",
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    barcode: initialData?.barcode || "",
    qrCode: initialData?.qrCode || "",
    subCategory: initialData?.subCategory || "",
    collection: initialData?.collection || "",
    brand: initialData?.brand || "",
    model: initialData?.model || "",
    description: initialData?.description || "",
    shortDescription: initialData?.shortDescription || "",
    status: initialData?.status || "Available",
    purchasePrice: initialData?.purchasePrice ?? initialData?.costPrice ?? 0,
    additionalCost: initialData?.additionalCost ?? 0,
    totalCost: initialData?.totalCost ?? initialData?.costPrice ?? 0,
    sellingPrice: initialData?.sellingPrice ?? 0,
    minimumSellingPrice: initialData?.minimumSellingPrice ?? 0,
    wholesalePrice: initialData?.wholesalePrice ?? 0,
    retailPrice: initialData?.retailPrice ?? 0,
    currency: initialData?.currency || "USD",
    discountAllowed: initialData?.discountAllowed ? "true" : "false",
    profit: initialData?.profit ?? 0,
    margin: initialData?.margin ?? 0,
    weight: initialData?.weight || "",
    dimensions: initialData?.dimensions || "",
    material: initialData?.material || "",
    metalType: initialData?.metalType || "",
    goldPurity: initialData?.goldPurity || "",
    countryOfOrigin: initialData?.countryOfOrigin || "",
    manufacturedBy: initialData?.manufacturedBy || "",
    manufacturedDate: initialData?.manufacturedDate ? initialData.manufacturedDate.slice(0, 10) : "",
    gemstoneType: initialData?.gemstoneType || "",
    variety: initialData?.variety || "",
    origin: initialData?.origin || "",
    shape: initialData?.shape || "",
    cut: initialData?.cut || "",
    colour: initialData?.colour || "",
    clarity: initialData?.clarity || "",
    treatment: initialData?.treatment || "",
    heatStatus: initialData?.heatStatus || "",
    oilLevel: initialData?.oilLevel || "",
    transparency: initialData?.transparency || "",
    qualityGrade: initialData?.qualityGrade || "",
    naturalSynthetic: initialData?.naturalSynthetic || "Natural",
    pieces: initialData?.pieces ?? 0,
    totalCarat: initialData?.totalCarat ?? 0,
    averageCarat: initialData?.averageCarat ?? 0,
    costPerCarat: initialData?.costPerCarat ?? 0,
    sellingPricePerCarat: initialData?.sellingPricePerCarat ?? 0,
    certificateAvailable: initialData?.certificateAvailable ? "true" : "false",
    laboratory: initialData?.laboratory || "",
    certificateNumber: initialData?.certificateNumber || "",
    certificateDate: initialData?.certificateDate ? initialData.certificateDate.slice(0, 10) : "",
    certificateCost: initialData?.certificateCost ?? 0,
    certificatePdf: initialData?.certificatePdf || "",
    certificateImages: initialData?.certificateImages || "",
    certificateNotes: initialData?.certificateNotes || "",
    warehouse: initialData?.warehouse || "Main Vault - HK",
    location: initialData?.location || "",
    shelf: initialData?.shelf || "",
    quantity: initialData?.quantity ?? 1,
    minimumStock: initialData?.minimumStock ?? 1,
    maximumStock: initialData?.maximumStock ?? 10,
    reorderLevel: initialData?.reorderLevel ?? 2,
    supplier: initialData?.supplier || "",
    supplierReference: initialData?.supplierReference || "",
    purchaseDate: initialData?.purchaseDate ? initialData.purchaseDate.slice(0, 10) : "",
    purchaseInvoice: initialData?.purchaseInvoice || "",
    paymentStatus: initialData?.paymentStatus || "Paid",
    outstandingAmount: initialData?.outstandingAmount ?? 0,
    supplierNotes: initialData?.supplierNotes || "",
    internalNotes: initialData?.internalNotes || "",
    customerNotes: initialData?.customerNotes || "",
    specialInstructions: initialData?.specialInstructions || "",
    tags: initialData?.tags || [],
    components: initialData?.components || [],
    imageUrls: initialData?.imageUrls || [],
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const formValues = watch();

  // Reset form with initialData when editing
  useEffect(() => {
    if (isEditing && initialData) {
      reset(defaultValues);
    }
  }, [initialData, isEditing, reset]);

  // Check for unsaved draft in local storage on mount (create mode)
  useEffect(() => {
    if (!isEditing) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed?.data && parsed?.timestamp) {
            setDraftTimestamp(new Date(parsed.timestamp).toLocaleTimeString());
            setShowDraftModal(true);
          }
        }
      } catch (err) {
        console.error("Failed to read product draft:", err);
      }
    }
  }, [isEditing]);

  // Handle draft restore
  const handleRestoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed?.data) {
          reset(parsed.data);
          showSuccess("Draft Restored", "Your previous draft has been restored.");
        }
      }
    } catch (err) {
      showError("Restore Error", "Failed to restore draft.");
    } finally {
      setShowDraftModal(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowDraftModal(false);
  };

  // Auto-save draft logic
  const saveDraftToStorage = () => {
    try {
      const timeStr = new Date().toLocaleTimeString();
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ data: formValues, timestamp: new Date().toISOString() })
      );
      setAutoSaveTime(timeStr);
    } catch (err) {
      console.error("Auto save failed:", err);
    }
  };

  // Auto save on step change
  const handleStepChange = async (targetStep) => {
    if (targetStep > activeStep) {
      const valid = await validateStep(activeStep);
      if (!valid) return;
    }
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps((prev) => [...prev, activeStep]);
    }
    saveDraftToStorage();
    setActiveStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = async (step) => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["stockNo", "name", "category"];
    if (step === 3) fieldsToValidate = ["purchasePrice", "sellingPrice"];
    if (step === 4) fieldsToValidate = ["warehouse", "quantity"];

    if (fieldsToValidate.length === 0) return true;

    const result = await trigger(fieldsToValidate);
    if (!result) {
      showError("Validation Error", "Please fill in all required fields before proceeding.");
    }
    return result;
  };

  const handleNext = async () => {
    const valid = await validateStep(activeStep);
    if (valid && activeStep < 5) {
      handleStepChange(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      handleStepChange(activeStep - 1);
    }
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const finalStockNo = data.stockNo || `STK-${Math.floor(10000 + Math.random() * 90000)}`;
      const payload = {
        ...data,
        stockNo: finalStockNo,
        sku: data.sku || `STK-${(data.category || "PRD").substring(0, 3).toUpperCase()}-${finalStockNo}`,
        barcode: data.barcode || `890${finalStockNo.replace(/\D/g, "").padStart(9, "0")}`,
        qrCode: data.qrCode || `QR-STK-${finalStockNo}`,
        discountAllowed: data.discountAllowed === "true" || data.discountAllowed === true,
        certificateAvailable: data.certificateAvailable === "true" || data.certificateAvailable === true,
      };

      await onSubmitSuccess(payload);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      console.error("Publish Submit Error:", err);
      showError("Submission Failed", err.response?.data?.message || err.message || "Failed to publish product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormError = (validationErrors) => {
    console.error("Product Wizard Validation Errors:", validationErrors);
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      const errMessages = errorKeys.map((key) => `${key}: ${validationErrors[key]?.message || "Invalid value"}`).join(", ");
      showError(
        "Cannot Publish Product",
        `Please fix field validation errors (${errorKeys.join(", ")}). Check console for details.`
      );
    }
  };

  const executeSubmit = handleSubmit(handleFormSubmit, handleFormError);

  return (
    <div className="w-full space-y-0">
      {/* Horizontal Stepper */}
      <WizardStepper
        activeStep={activeStep}
        onStepClick={handleStepChange}
        completedSteps={completedSteps}
      />

      {/* Main Wizard Workspace */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <form onSubmit={executeSubmit}>
            {activeStep === 1 && (
              <StepBasicInfo
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {activeStep === 2 && (
              <StepCategoryDetails
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
                control={control}
              />
            )}

            {activeStep === 3 && (
              <StepPricing
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {activeStep === 4 && (
              <StepInventorySupplier
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {activeStep === 5 && (
              <StepReviewPublish
                watch={watch}
                onJumpToStep={(step) => handleStepChange(step)}
              />
            )}

            {/* Mobile spacing to prevent fixed footer overlap */}
            {/* <div className="h-20 md:hidden" /> */}

            {/* Sticky Bottom Navigation Footer */}
            <WizardFooter
              activeStep={activeStep}
              totalSteps={5}
              onPrev={handlePrev}
              onNext={handleNext}
              onSaveDraft={saveDraftToStorage}
              onCancel={() => navigate("/products")}
              onSubmit={executeSubmit}
              isSubmitting={isSubmitting}
              autoSaveTime={autoSaveTime}
            />
          </form>
        </div>

        {/* Right Sticky Sidebar */}
        <ProductSidebar
          watch={watch}
          register={register}
          setValue={setValue}
          errors={errors}
        />
      </div>

      {/* Unsaved Draft Detection Modal */}
      <DraftRestoreModal
        isOpen={showDraftModal}
        timestamp={draftTimestamp}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
}
