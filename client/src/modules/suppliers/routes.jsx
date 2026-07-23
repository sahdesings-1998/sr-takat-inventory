import { Navigate } from "react-router-dom";
import SupplierList from "./pages/SupplierList.jsx";
import SupplierDetails from "./pages/SupplierDetails.jsx";
import CreatePurchaseInvoice from "./pages/CreatePurchaseInvoice.jsx";
import PurchaseInvoiceDetails from "./pages/PurchaseInvoiceDetails.jsx";

const supplierRoutes = [
  {
    path: "/suppliers",
    element: <SupplierList />,
  },
  {
    path: "/suppliers/:id",
    element: <SupplierDetails />,
  },
  {
    path: "/purchase-invoices",
    element: <Navigate to="/suppliers?tab=purchase-invoices" replace />,
  },
  {
    path: "/purchase-invoices/new",
    element: <CreatePurchaseInvoice />,
  },
  {
    path: "/purchase-invoices/:id",
    element: <PurchaseInvoiceDetails />,
  },
];

export default supplierRoutes;
