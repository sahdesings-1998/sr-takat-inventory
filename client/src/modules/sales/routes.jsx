import SalesList from "./pages/SalesList.jsx";
import SaleDetails from "./pages/SaleDetails.jsx";

const salesRoutes = [
  {
    path: "/sales",
    element: <SalesList />,
  },
  {
    path: "/sales/:id",
    element: <SaleDetails />,
  },
];

export default salesRoutes;
