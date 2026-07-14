import { createElement } from "react";
import ProtectedRoute from "./ProtectedRoute.jsx";
import DashboardLayout from "@/layouts/DashboardLayout.jsx";
import dashboardRoutes from "@/modules/dashboard/routes.jsx";
import supplierRoutes from "@/modules/suppliers/routes.jsx";
import customerRoutes from "@/modules/customers/routes.jsx";
import notificationRoutes from "@/modules/notifications/routes.jsx";
import inventoryRoutes from "@/modules/inventory/routes.jsx";
import certificateRoutes from "@/modules/certificates/routes.jsx";
import productRoutes from "@/modules/products/routes.jsx";
import productionRoutes from "@/modules/production/routes.jsx";
import costingRoutes from "@/modules/costing/routes.jsx";
import memoRoutes from "@/modules/memo/routes.jsx";
import salesRoutes from "@/modules/sales/routes.jsx";
import reportsRoutes from "@/modules/reports/routes.jsx";
import auditRoutes from "@/modules/audit/routes.jsx";
import incomeExpenseRoutes from "@/modules/incomeExpense/routes.jsx";

/**
 * Level 2 of the 3-level route protection (Section 4): Authenticated.
 * Any signed-in user (any role) can reach these routes.
 */
const protectedRoutes = [
  {
    element: createElement(ProtectedRoute),
    children: [
      {
        element: createElement(DashboardLayout),
        children: [
          ...dashboardRoutes,
          ...supplierRoutes,
          ...customerRoutes,
          ...notificationRoutes,
          ...inventoryRoutes,
          ...certificateRoutes,
          ...productRoutes,
          ...productionRoutes,
          ...costingRoutes,
          ...memoRoutes,
          ...salesRoutes,
          ...reportsRoutes,
          ...auditRoutes,
          ...incomeExpenseRoutes,
        ],
      },
    ],
  },
];

export default protectedRoutes;
