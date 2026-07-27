import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";

const ALLOWED_ROLES = ["Admin"];

export default function AdminRoute() {
  const { isAuthenticated, loading, roleName } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!ALLOWED_ROLES.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
