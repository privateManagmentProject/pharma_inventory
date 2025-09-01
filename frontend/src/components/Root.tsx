import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
const Root = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "customer") {
        navigate("/customer/dashboard");
      } else {
        navigate("/login");
      }
    } else {
      // If user is not logged in, redirect to login page
      navigate("/login");
    }
  }, [user, navigate]);
  return null; // No UI to render, just a redirect
};

export default Root;
