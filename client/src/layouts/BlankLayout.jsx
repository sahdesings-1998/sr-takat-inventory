import { Outlet } from "react-router-dom";

/**
 * No chrome — used for standalone pages (print views, public invoice
 * links, etc.) that shouldn't inherit the sidebar/topbar or auth card.
 */
export default function BlankLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Outlet />
    </div>
  );
}
