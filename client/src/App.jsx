import { Route, BrowserRouter as Router, Routes } from "react-router";
import "./App.css";
import Categories from "./components/Categories";
import Products from "./components/Products";
import Root from "./components/Root";
import SalesOrders from "./components/SalesOrders";
import Suppliers from "./components/Suppliers";
import Dashbaord from "./pages/Dashbaord";
import Login from "./pages/Login";
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
