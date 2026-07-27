import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const CostingList = lazy(() => import("./pages/CostingList.jsx"));

const costingRoutes = [
  {
    path: "/costing",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <CostingList />
      </Suspense>
    ),
  },
];

export default costingRoutes;
