import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";

import { useMe } from "../pages/auth/hooks";
import useAuthStore from "../store/authStore";

const ALLOWED_ROLES = ["admin", "manager"];

export default function ProtectedRoute() {
  const location = useLocation();

  const { isLoading, isError } = useMe();

  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !user || !ALLOWED_ROLES.includes(user.role)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
