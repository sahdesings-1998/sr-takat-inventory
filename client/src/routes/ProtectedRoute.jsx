import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";

/**
 * Route protection guard for authenticated routes.
 * Renders AuthLoader while session is being verified.
 * Navigates to /login if session check fails / unauthenticated.
 * Renders Outlet if authenticated.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
