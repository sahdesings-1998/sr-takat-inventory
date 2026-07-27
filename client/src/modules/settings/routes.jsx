import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const Settings = lazy(() => import("./pages/Settings.jsx"));

const settingsRoutes = [
  {
    path: "/settings",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <Settings />
      </Suspense>
    ),
  },
];

export default settingsRoutes;
