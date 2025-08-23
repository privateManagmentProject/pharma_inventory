import { Route, BrowserRouter as Router, Routes } from "react-router";
import "./App.css";
import Root from "./components/Root";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Dashbaord from "./pages/Dashbaord";
import Login from "./pages/Login";
import Products from "./pages/Products";
import SalesOrders from "./pages/SalesOrders";
import Suppliers from "./pages/Suppliers";
import ProtectedRoutes from "./utils/ProtectedRoutes";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoutes requireRole={"admin"}>
              <Dashbaord />
            </ProtectedRoutes>
          }
        >
          <Route index element={<h1>summery</h1>} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="products" element={<Products />} />
          <Route path="salesOrders" element={<SalesOrders />} />
          <Route path="customers" element={<Customers />} />
        </Route>
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoutes requireRole={["customer"]}>
              <h1>contact</h1>
            </ProtectedRoutes>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<>unauthorized</>} />
      </Routes>
    </Router>
  );
}

export default App;
