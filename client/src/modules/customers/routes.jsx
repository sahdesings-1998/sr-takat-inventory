import CustomerList from "./pages/CustomerList.jsx";
import CustomerDetails from "./pages/CustomerDetails.jsx";

const customerRoutes = [
  {
    path: "/customers",
    element: <CustomerList />,
  },
  {
    path: "/customers/:id",
    element: <CustomerDetails />,
  },
];

export default customerRoutes;
