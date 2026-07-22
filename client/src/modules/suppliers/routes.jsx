import SupplierList from "./pages/SupplierList.jsx";
import SupplierDetails from "./pages/SupplierDetails.jsx";

const supplierRoutes = [
  {
    path: "/suppliers",
    element: <SupplierList />,
  },
  {
    path: "/suppliers/:id",
    element: <SupplierDetails />,
  },
];

export default supplierRoutes;
