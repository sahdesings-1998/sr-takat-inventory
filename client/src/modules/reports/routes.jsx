import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const Reports = lazy(() => import("./pages/Reports.jsx"));

const reportsRoutes = [
  {
    path: "/reports",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <Reports />
      </Suspense>
    ),
  },
];

export default reportsRoutes;
