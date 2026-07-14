import { createElement } from "react";
import AdminRoute from "./AdminRoute.jsx";
import DashboardLayout from "@/layouts/DashboardLayout.jsx";
import Settings from "@/modules/settings/pages/Settings.jsx";

/**
 * Level 3 of the 3-level route protection (Section 4): Role Protected.
 * Admin-only routes, e.g. /settings.
 */
const adminRoutes = [
  {
    element: createElement(AdminRoute),
    children: [
      {
        element: createElement(DashboardLayout),
        children: [{ path: "/settings", element: createElement(Settings) }],
      },
    ],
  },
];

export default adminRoutes;
