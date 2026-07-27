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
import settingsRoutes from "@/modules/settings/routes.jsx";
import AdminRoute from "./AdminRoute.jsx";

/**
 * Level 2 of the 3-level route protection: Authenticated.
 * Any signed-in user can reach these routes once AuthContext confirms valid session.
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
          {
            element: createElement(AdminRoute),
            children: settingsRoutes,
          },
        ],
      },
    ],
  },
];

export default protectedRoutes;
