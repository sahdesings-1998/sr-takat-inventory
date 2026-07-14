import { createElement } from "react";
import AuthLayout from "@/layouts/AuthLayout.jsx";
import authRoutes from "@/modules/auth/routes.jsx";

/**
 * Level 1 of the 3-level route protection (Section 4): Public.
 * Rendered under AuthLayout — no auth check required.
 *
 * Plain .js (no JSX syntax) so this file parses regardless of the
 * bundler's per-extension JSX settings; createElement stands in for JSX.
 */
const publicRoutes = [
  {
    element: createElement(AuthLayout),
    children: authRoutes,
  },
];

export default publicRoutes;
