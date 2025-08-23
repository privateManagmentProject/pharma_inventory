import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const ProtectedRoutes = ({ children, requireRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!requireRole.includes(user.role)) {
      navigate("/unauthorized");
      return;
    }
  }, [user, requireRole, navigate]);
  if (!user) return null;
  if (!requireRole.includes(user.role)) return null;
  return children;
  // If user is authenticated and has the required role, render the children
  // If user is not authenticated, redirect to login
  // If user does not have the required role, redirect to unauthorized page
  // If user is authenticated and has the required role, render the children
  // If user is not authenticated, redirect to login
  // If user does not have the required role, redirect to unauthorized page
  // If user is authenticated and has the required role, render the children
  // If user is not authenticated, redirect to login
  // If user does not have the required role, redirect to unauthorized page
  // If user is authenticated and has the required role, render the children
};

export default ProtectedRoutes;
