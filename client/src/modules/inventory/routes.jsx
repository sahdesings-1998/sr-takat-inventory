import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const InventoryDashboard = lazy(() => import("./pages/InventoryDashboard.jsx"));

const inventoryRoutes = [
  {
    path: "/inventory",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <InventoryDashboard />
      </Suspense>
    ),
  },
];

export default inventoryRoutes;
