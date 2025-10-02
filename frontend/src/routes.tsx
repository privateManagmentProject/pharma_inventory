import { Navigate, type RouteObject } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import ListCategory from "./pages/categories/ListCategory";
import ListCustomers from "./pages/customers/ListCustomers";
import Dashboard from "./pages/dashboard/dashboard";
import DetailProduct from "./pages/products/DetailProduct";
import EditProduct from "./pages/products/EditProduct";
import ListProduct from "./pages/products/ListProduct";
import NewProduct from "./pages/products/NewProduct";
import ListSuppliers from "./pages/suppliers/ListSuppliers";
import Login from "./pages/users/Login";

// Protected Route component
// eslint-disable-next-line react-refresh/only-export-components
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

// Admin routes with layout
const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "categories", element: <ListCategory /> },
      { path: "suppliers", element: <ListSuppliers /> },
      { path: "customers", element: <ListCustomers /> },
      { path: "products", element: <ListProduct /> },
      { path: "products/new", element: <NewProduct /> },
      { path: "products/:id", element: <DetailProduct /> },
      { path: "products/edit/:id", element: <EditProduct /> },
    ],
  },
];

// Public routes
const publicRoutes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  { path: "/unauthorized", element: <div>Unauthorized access</div> },
];

// Customer routes
const customerRoutes: RouteObject[] = [
  {
    path: "/customer/dashboard",
    element: (
      <ProtectedRoute requiredRole="customer">
        <Dashboard />
      </ProtectedRoute>
    ),
  },
];

// Combine all routes
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/admin/dashboard" replace />,
  },
  ...publicRoutes,
  ...adminRoutes,
  ...customerRoutes,
  { path: "*", element: <div>Page not found</div> },
];

export default routes;
