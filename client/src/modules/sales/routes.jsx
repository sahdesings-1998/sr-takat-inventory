import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const SalesList = lazy(() => import("./pages/SalesList.jsx"));
const SaleDetails = lazy(() => import("./pages/SaleDetails.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const salesRoutes = [
  {
    path: "/sales",
    element: withSuspense(SalesList),
  },
  {
    path: "/sales/:id",
    element: withSuspense(SaleDetails),
  },
];

export default salesRoutes;
