import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const CustomerList = lazy(() => import("./pages/CustomerList.jsx"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const customerRoutes = [
  {
    path: "/customers",
    element: withSuspense(CustomerList),
  },
  {
    path: "/customers/:id",
    element: withSuspense(CustomerDetails),
  },
];

export default customerRoutes;
