import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const MemoList = lazy(() => import("./pages/MemoList.jsx"));
const MemoDetails = lazy(() => import("./pages/MemoDetails.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

const memoRoutes = [
  {
    path: "/memos",
    element: withSuspense(MemoList),
  },
  {
    path: "/memos/:id",
    element: withSuspense(MemoDetails),
  },
  {
    path: "/memo",
    element: withSuspense(MemoList),
  },
  {
    path: "/memo/:id",
    element: withSuspense(MemoDetails),
  },
];

export default memoRoutes;
