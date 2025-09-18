import Customer from "../models/Customer.js";
import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import SalesOrder from "../models/SalesOrder.js";
import Supplier from "../models/Supplier.js";

// Get dashboard statistics based on user role
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        
        let filter = {};
        if (userRole !== 'admin') {
            filter.userId = userId;
        }

        // Get basic counts
        const [
            totalProducts,
            totalSalesOrders,
            totalCustomers,
            totalSuppliers,
            lowStockProducts,
            expiringProducts,
            pendingPayments,
            overduePayments
        ] = await Promise.all([
            Product.countDocuments({ ...filter, isActive: true }),
            SalesOrder.countDocuments(userRole === 'admin' ? {} : { userId }),
            Customer.countDocuments({ ...filter, isActive: true }),
            Supplier.countDocuments({ ...filter, isActive: true }),
            Product.countDocuments({ 
                ...filter, 
                isActive: true,
                $expr: { $lte: [{ $toInt: "$stock" }, "$lowStockThreshold"] }
            }),
            Product.countDocuments({
                ...filter,
                isActive: true,
                expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
            }),
            SalesOrder.countDocuments({
                ...(userRole === 'admin' ? {} : { userId }),
                'paymentInfo.status': { $in: ['pending', 'partial'] }
            }),
            SalesOrder.countDocuments({
                ...(userRole === 'admin' ? {} : { userId }),
                'paymentInfo.status': 'overdue'
            })
        ]);

        // Calculate total revenue
        const revenueResult = await SalesOrder.aggregate([
            ...(userRole === 'admin' ? [] : [{ $match: { userId: userId } }]),
            { $group: { _id: null, totalRevenue: { $sum: { $toDouble: "$totalAmount" } } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // Calculate pending revenue
        const pendingRevenueResult = await SalesOrder.aggregate([
            ...(userRole === 'admin' ? [] : [{ $match: { userId: userId } }]),
            { $match: { 'paymentInfo.status': { $in: ['pending', 'partial'] } } },
            { $group: { _id: null, totalPending: { $sum: { $toDouble: "$unpaidAmount" } } } }
        ]);
        const pendingRevenue = pendingRevenueResult.length > 0 ? pendingRevenueResult[0].totalPending : 0;

        // Get recent sales orders
        const recentOrders = await SalesOrder.find(userRole === 'admin' ? {} : { userId })
            .populate('customerId', 'name companyName')
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get low stock products
        const lowStockProductsList = await Product.find({
            ...filter,
            isActive: true,
            $expr: { $lte: [{ $toInt: "$stock" }, "$lowStockThreshold"] }
        })
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .limit(5);

        // Get expiring products
        const expiringProductsList = await Product.find({
            ...filter,
            isActive: true,
            expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .sort({ expiryDate: 1 })
        .limit(5);

        // Get sales data for chart (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const salesData = await SalesOrder.aggregate([
            ...(userRole === 'admin' ? [] : [{ $match: { userId: userId } }]),
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: { $toDouble: "$totalAmount" } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Get notification counts
        const notificationCounts = await Notification.aggregate([
            { $match: { userId: userId, isActive: true, isRead: false } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        const stats = {
            overview: {
                totalProducts,
                totalSalesOrders,
                totalCustomers,
                totalSuppliers,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                pendingRevenue: Math.round(pendingRevenue * 100) / 100
            },
            alerts: {
                lowStockProducts,
                expiringProducts,
                pendingPayments,
                overduePayments
            },
            recentOrders,
            lowStockProducts: lowStockProductsList,
            expiringProducts: expiringProductsList,
            salesData,
            notificationCounts
        };

        return res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get analytics data for charts
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        const { period = '6months' } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '1month':
                dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                break;
            case '3months':
                dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
                break;
            case '6months':
                dateFilter = { $gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) };
                break;
            case '1year':
                dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                break;
        }

        const baseMatch = userRole === 'admin' ? {} : { userId };

        // Sales trend data
        const salesTrend = await SalesOrder.aggregate([
            { $match: { ...baseMatch, createdAt: dateFilter } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalSales: { $sum: { $toDouble: "$totalAmount" } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // Top selling products
        const topProducts = await SalesOrder.aggregate([
            { $match: { ...baseMatch, createdAt: dateFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $toDouble: "$items.totalPrice" } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        // Customer analysis
        const customerAnalysis = await SalesOrder.aggregate([
            { $match: { ...baseMatch, createdAt: dateFilter } },
            {
                $group: {
                    _id: "$customerId",
                    customerName: { $first: "$customerName" },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: { $toDouble: "$totalAmount" } }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);

        // Payment status distribution
        const paymentStatus = await SalesOrder.aggregate([
            { $match: { ...baseMatch, createdAt: dateFilter } },
            {
                $group: {
                    _id: "$paymentInfo.status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: { $toDouble: "$totalAmount" } }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            analytics: {
                salesTrend,
                topProducts,
                customerAnalysis,
                paymentStatus
            }
        });
    } catch (error) {
        console.error("Get analytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export { getAnalytics, getDashboardStats };

