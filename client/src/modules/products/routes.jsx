import ProductList from "./pages/ProductList.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import AddProductPage from "./pages/AddProductPage.jsx";
import EditProductPage from "./pages/EditProductPage.jsx";

const productRoutes = [
  {
    path: "/products",
    element: <ProductList />,
  },
  {
    path: "/products/add",
    element: <AddProductPage />,
  },
  {
    path: "/products/edit/:id",
    element: <EditProductPage />,
  },
  {
    path: "/products/:id",
    element: <ProductDetails />,
  },
];

export default productRoutes;
