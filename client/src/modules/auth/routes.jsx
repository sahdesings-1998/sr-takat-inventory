import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

/**
 * Raw page routes owned by the auth module. Composed under AuthLayout by
 * routes/publicRoutes.js — nothing outside this module needs to know these
 * pages exist as files.
 */
const authRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
];

export default authRoutes;
