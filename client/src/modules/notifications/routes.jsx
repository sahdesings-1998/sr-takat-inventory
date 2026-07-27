import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const NotificationList = lazy(() => import("./pages/NotificationList.jsx"));

const notificationRoutes = [
  {
    path: "/notifications",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <NotificationList />
      </Suspense>
    ),
  },
];

export default notificationRoutes;
