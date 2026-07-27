import { createElement } from "react";
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";
import AuthLayout from "@/layouts/AuthLayout.jsx";
import authRoutes from "@/modules/auth/routes.jsx";

/**
 * Level 1 of the route protection: Public / Guest routes.
 * Wrapped in PublicOnlyRoute so authenticated users bypass login pages
 * and unauthenticated users see the auth layout.
 */
const publicRoutes = [
  {
    element: createElement(PublicOnlyRoute),
    children: [
      {
        element: createElement(AuthLayout),
        children: authRoutes,
      },
    ],
  },
];

export default publicRoutes;
