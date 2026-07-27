import { lazy, Suspense } from "react";
import { SkeletonPageHeader } from "@/components/ui/Skeleton";

const IncomeManagement = lazy(() => import("./pages/IncomeManagement.jsx"));
const ExpenseManagement = lazy(() => import("./pages/ExpenseManagement.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<SkeletonPageHeader />}>
    <Component />
  </Suspense>
);

export const incomeExpenseRoutes = [
  {
    path: "/incomes",
    element: withSuspense(IncomeManagement),
  },
  {
    path: "/expenses",
    element: withSuspense(ExpenseManagement),
  },
];

export default incomeExpenseRoutes;
