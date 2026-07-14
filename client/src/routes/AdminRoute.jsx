import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Level 3 of the 3-level route protection (Section 4): Role Protected.
 * Same session-check gate as ProtectedRoute, plus a role check on top.
 * Server-side permission checks (middleware/permissions.js) are the real
 * enforcement boundary — this only hides UI the user shouldn't see.
 */
const ALLOWED_ROLES = ["Admin"];

export default function AdminRoute() {
  const { isAuthenticated, loading, roleName } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!ALLOWED_ROLES.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
