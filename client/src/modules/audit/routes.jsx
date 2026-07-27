import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const AuditLogList = lazy(() => import("./pages/AuditLogList.jsx"));

const auditRoutes = [
  {
    path: "/audit",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <AuditLogList />
      </Suspense>
    ),
  },
];

export default auditRoutes;
