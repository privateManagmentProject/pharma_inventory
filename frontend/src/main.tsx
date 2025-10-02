import { createRoot } from "react-dom/client";
import App from "./App";
import AuthProvider from "./context/AuthContext";
// import { Toaster } from "./components/ui/toaster";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    {/* <Toaster /> */}
  </AuthProvider>
);
