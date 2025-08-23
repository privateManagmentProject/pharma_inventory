import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  logout();
  navigate("/login");
};

export default Logout;
