import { lazy, Suspense } from "react";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));

const dashboardRoutes = [
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    ),
  },
];

export default dashboardRoutes;
