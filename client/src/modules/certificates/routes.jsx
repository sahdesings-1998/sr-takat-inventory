import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const CertificateList = lazy(() => import("./pages/CertificateList.jsx"));

const routes = [
  {
    path: "/certificates",
    element: (
      <Suspense fallback={<SkeletonPageHeader />}>
        <CertificateList />
      </Suspense>
    ),
  },
];

export default routes;
