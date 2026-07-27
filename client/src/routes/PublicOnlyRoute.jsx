import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";

/**
 * Route guard for public auth pages (e.g. /login, /register).
 * While auth status is loading: renders AuthLoader.
 * If user is ALREADY authenticated: redirects directly to /dashboard (or state.from).
 * If unauthenticated: renders public page (Login/Register).
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (isAuthenticated) {
    const target = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
