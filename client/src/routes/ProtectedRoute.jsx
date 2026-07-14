import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Level 2 of the 3-level route protection (Section 4): Authenticated.
 * Renders its children only once AuthContext confirms a valid session
 * (via GET /auth/me on mount) — this is what keeps a user logged in
 * across a page refresh instead of bouncing them to /login while the
 * session check is still in flight.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
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

  return <Outlet />;
}
