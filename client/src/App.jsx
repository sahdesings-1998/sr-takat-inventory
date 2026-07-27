import { Navigate, useRoutes } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";
import publicRoutes from "./routes/publicRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

const routeConfig = [
  { path: "/", element: <RootRedirect /> },
  ...publicRoutes,
  ...protectedRoutes,
  ...adminRoutes,
  { path: "*", element: <RootRedirect /> },
];

export default function App() {
  return useRoutes(routeConfig);
}
