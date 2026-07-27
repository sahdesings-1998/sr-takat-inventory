import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const JobCardList = lazy(() => import("./pages/JobCardList.jsx"));
const JobCardDetails = lazy(() => import("./pages/JobCardDetails.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const productionRoutes = [
  {
    path: "/production",
    element: withSuspense(JobCardList),
  },
  {
    path: "/production/:id",
    element: withSuspense(JobCardDetails),
  },
];

export default productionRoutes;
