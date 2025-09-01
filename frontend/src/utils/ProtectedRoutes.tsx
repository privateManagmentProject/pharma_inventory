import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRoutesProps {
  children: ReactNode;
  requireRole: string | string[];
}

const ProtectedRoutes = ({ children, requireRole }: ProtectedRoutesProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const hasRequiredRole = Array.isArray(requireRole)
      ? requireRole.includes(user.role)
      : user.role === requireRole;

    if (!hasRequiredRole) {
      navigate("/unauthorized");
    }
  }, [user, requireRole, navigate]);

  if (!user) {
    return null;
  }

  const hasRequiredRole = Array.isArray(requireRole)
    ? requireRole.includes(user.role)
    : user.role === requireRole;

  if (!hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
