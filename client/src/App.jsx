import { Navigate, useRoutes } from "react-router-dom";
import publicRoutes from "./routes/publicRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const routeConfig = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  ...publicRoutes,
  ...protectedRoutes,
  ...adminRoutes,
  { path: "*", element: <Navigate to="/dashboard" replace /> },
];

export default function App() {
  return useRoutes(routeConfig);
}
