import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import ListCategory from "./pages/categories/ListCategory";
import Dashboard from "./pages/dashboard/dashboard";
import Login from "./pages/users/Login";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: string;
}> = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Redirect to appropriate dashboard based on authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Login route */}
            <Route path="/login" element={<Login />} />

            {/* Admin routes with layout */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="categories" element={<ListCategory />} />
            </Route>

            {/* Customer dashboard */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute requiredRole="customer">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Unauthorized route */}
            <Route
              path="/unauthorized"
              element={<div>Unauthorized access</div>}
            />

            {/* Catch all route */}
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
