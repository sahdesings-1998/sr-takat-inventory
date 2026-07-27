import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const SupplierList = lazy(() => import("./pages/SupplierList.jsx"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails.jsx"));
const CreatePurchaseInvoice = lazy(() => import("./pages/CreatePurchaseInvoice.jsx"));
const PurchaseInvoiceDetails = lazy(() => import("./pages/PurchaseInvoiceDetails.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const supplierRoutes = [
  {
    path: "/suppliers",
    element: withSuspense(SupplierList),
  },
  {
    path: "/suppliers/:id",
    element: withSuspense(SupplierDetails),
  },
  {
    path: "/purchase-invoices",
    element: <Navigate to="/suppliers?tab=purchase-invoices" replace />,
  },
  {
    path: "/purchase-invoices/new",
    element: withSuspense(CreatePurchaseInvoice),
  },
  {
    path: "/purchase-invoices/:id",
    element: withSuspense(PurchaseInvoiceDetails),
  },
];

export default supplierRoutes;
