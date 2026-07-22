// Tab definitions — id, label, icon label, and which categories show them
// showFor: null = always shown; array = only for those categories
export const TAB_DEFINITIONS = [
  { id: "overview",        label: "Overview",       showFor: null },
  { id: "specifications",  label: "Specifications", showFor: null },
  { id: "pricing",         label: "Pricing",        showFor: null },
  { id: "inventory",       label: "Inventory",      showFor: null },
  { id: "components",      label: "Components",     showFor: ["Jewellery", "Watch", "Custom Product", "Ring", "Necklace", "Earrings", "Bracelet", "Pendant"] },
  { id: "supplier",        label: "Supplier",       showFor: null },
  { id: "qrcode",          label: "QR & Barcode",   showFor: null },
  { id: "certificates",    label: "Certificates",   showFor: null, requiresData: "certificate" },
  { id: "media",           label: "Media",          showFor: null, requiresData: "media" },
  { id: "sales",           label: "Sales",          showFor: null },
  { id: "history",         label: "History",        showFor: null },
  { id: "documents",       label: "Documents",      showFor: null, requiresData: "documents" },
];

export function getVisibleTabs(product) {
  if (!product) return [];

  const hasCert =
    product.certificateAvailable === true ||
    product.certificateAvailable === "true" ||
    product.certificateNumber ||
    product.laboratory;

  const hasMedia = product.imageUrls?.length > 0 || product.videos || product.certificateImages;
  const hasDocuments = product.documents || product.warranty || product.cadFiles || product.certificatePdf;

  return TAB_DEFINITIONS.filter((tab) => {
    if (tab.showFor !== null && !tab.showFor.includes(product.category)) return false;
    if (tab.requiresData === "certificate" && !hasCert) return false;
    if (tab.requiresData === "media" && !hasMedia) return false;
    if (tab.requiresData === "documents" && !hasDocuments) return false;
    return true;
  });
}
