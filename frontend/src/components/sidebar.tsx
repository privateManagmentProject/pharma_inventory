import {
  Grid3X3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashbourd",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Categories",
      path: "/admin/categories",
      icon: <Grid3X3 className="w-5 h-5" />,
    },

    {
      name: "Suppliers",
      path: "/admin/suppliers",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: <User className="w-5 h-5" />,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: <Package className="w-5 h-5" />,
    },

    {
      name: "Orders",
      path: "/admin/salesOrders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-screen bg-gray-800 transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-white">Navigation</span>
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-700 group ${
                      isActive ? "bg-gray-700" : ""
                    }`
                  }
                  onClick={onClose}
                >
                  {item.icon}
                  <span className="ms-3">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
