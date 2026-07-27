import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const ProductList = lazy(() => import("./pages/ProductList.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx"));
const AddProductPage = lazy(() => import("./pages/AddProductPage.jsx"));
const EditProductPage = lazy(() => import("./pages/EditProductPage.jsx"));
const ProductScanPage = lazy(() => import("./pages/ProductScanPage.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const productRoutes = [
  {
    path: "/products",
    element: withSuspense(ProductList),
  },
  {
    path: "/products/add",
    element: withSuspense(AddProductPage),
  },
  {
    path: "/products/scan",
    element: withSuspense(ProductScanPage),
  },
  {
    path: "/products/scan/:code",
    element: withSuspense(ProductScanPage),
  },
  {
    path: "/products/edit/:id",
    element: withSuspense(EditProductPage),
  },
  {
    path: "/products/:id",
    element: withSuspense(ProductDetails),
  },
];

export default productRoutes;
