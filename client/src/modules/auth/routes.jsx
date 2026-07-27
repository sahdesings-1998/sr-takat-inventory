import { lazy, Suspense } from "react";
import AuthLoader from "@/components/ui/AuthLoader";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));

const withSuspense = (Component) => (
  <Suspense fallback={<AuthLoader />}>
    <Component />
  </Suspense>
);

const authRoutes = [
  { path: "/login", element: withSuspense(Login) },
  { path: "/register", element: withSuspense(Register) },
  { path: "/forgot-password", element: withSuspense(ForgotPassword) },
  { path: "/reset-password/:token", element: withSuspense(ResetPassword) },
];

export default authRoutes;
