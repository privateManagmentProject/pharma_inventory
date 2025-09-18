import api from "@/api/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardStats {
  overview: {
    totalProducts: number;
    totalSalesOrders: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
  alerts: {
    lowStockProducts: number;
    expiringProducts: number;
    pendingPayments: number;
    overduePayments: number;
  };
  recentOrders: any[];
  lowStockProducts: any[];
  expiringProducts: any[];
  salesData: any[];
  notificationCounts: any[];
}

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/dashboard/analytics?period=6months");
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              Failed to load dashboard data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.overview.totalProducts.toLocaleString(),
      icon: Package,
      description: isAdmin() ? "All products in system" : "Your products",
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.overview.totalRevenue),
      icon: DollarSign,
      description: isAdmin() ? "System-wide revenue" : "Your revenue",
      color: "text-green-600",
    },
    {
      title: "Sales Orders",
      value: stats.overview.totalSalesOrders.toLocaleString(),
      icon: ShoppingCart,
      description: isAdmin() ? "All sales orders" : "Your orders",
      color: "text-purple-600",
    },
    {
      title: isAdmin() ? "Total Users" : "Customers",
      value: stats.overview.totalCustomers.toLocaleString(),
      icon: Users,
      description: isAdmin() ? "All customers" : "Your customers",
      color: "text-orange-600",
    },
  ];

  const alertCards = [
    {
      title: "Low Stock",
      value: stats.alerts.lowStockProducts,
      icon: AlertTriangle,
      color:
        stats.alerts.lowStockProducts > 0 ? "text-red-600" : "text-gray-600",
      description: "Products running low",
    },
    {
      title: "Expiring Soon",
      value: stats.alerts.expiringProducts,
      icon: Calendar,
      color:
        stats.alerts.expiringProducts > 0 ? "text-yellow-600" : "text-gray-600",
      description: "Products expiring in 30 days",
    },
    {
      title: "Pending Payments",
      value: stats.alerts.pendingPayments,
      icon: DollarSign,
      color:
        stats.alerts.pendingPayments > 0 ? "text-orange-600" : "text-gray-600",
      description: "Awaiting payment",
    },
    {
      title: "Overdue Payments",
      value: stats.alerts.overduePayments,
      icon: AlertTriangle,
      color:
        stats.alerts.overduePayments > 0 ? "text-red-600" : "text-gray-600",
      description: "Past due date",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">
            {isAdmin() ? "Admin Dashboard" : "Your Dashboard"} -{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>
        <Badge variant={isAdmin() ? "default" : "secondary"}>
          {isAdmin() ? "Administrator" : "User"}
        </Badge>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {alertCards.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <Card
              key={index}
              className={
                alert.value > 0 ? "border-orange-200 bg-orange-50" : ""
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {alert.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${alert.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${alert.color}`}>
                  {alert.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Distribution of payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.paymentStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(analytics?.paymentStatus || []).map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest sales orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)} •{" "}
                      {formatCurrency(Number(order.totalAmount))}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.status === "completed"
                        ? "default"
                        : order.status === "pending"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Products running low on inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.lowStockProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Current stock: {product.stock} {product.packageSize}
                    </p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
