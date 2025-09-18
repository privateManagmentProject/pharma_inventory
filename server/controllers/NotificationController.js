import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import SalesOrder from "../models/SalesOrder.js";

// Create notification
const createNotification = async (req, res) => {
    try {
        const { userId, type, title, message, relatedId, relatedType, priority } = req.body;
        
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            relatedId,
            relatedType,
            priority: priority || 'medium'
        });

        await notification.save();
        
        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification
        });
    } catch (error) {
        console.error("Create notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, isRead, type } = req.query;
        
        const filter = { userId, isActive: true };
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('relatedId');

        const total = await Notification.countDocuments(filter);

        return res.status(200).json({
            success: true,
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark as read error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Mark all as read error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isActive = false;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get notification counts
const getNotificationCounts = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const total = await Notification.countDocuments({ userId, isActive: true });
        const unread = await Notification.countDocuments({ userId, isActive: true, isRead: false });
        
        const countsByType = await Notification.aggregate([
            { $match: { userId: userId, isActive: true, isRead: false } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        return res.status(200).json({
            success: true,
            counts: {
                total,
                unread,
                byType: countsByType
            }
        });
    } catch (error) {
        console.error("Get notification counts error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Auto-generate notifications for stock and expiry alerts
const generateStockNotifications = async () => {
    try {
        const products = await Product.find({ isActive: true });
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        for (const product of products) {
            const stock = parseInt(product.stock);
            const threshold = product.lowStockThreshold || 10;

            // Check for low stock
            if (stock <= threshold) {
                await Notification.findOneAndUpdate(
                    {
                        userId: product.userId,
                        type: 'stock_low',
                        relatedId: product._id,
                        relatedType: 'product',
                        isActive: true
                    },
                    {
                        userId: product.userId,
                        type: 'stock_low',
                        title: 'Low Stock Alert',
                        message: `${product.name} is running low on stock. Current stock: ${stock}`,
                        relatedId: product._id,
                        relatedType: 'product',
                        priority: stock === 0 ? 'urgent' : 'high',
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
            }

            // Check for expiry warning (30 days)
            if (product.expiryDate <= thirtyDaysFromNow) {
                await Notification.findOneAndUpdate(
                    {
                        userId: product.userId,
                        type: 'expiry_warning',
                        relatedId: product._id,
                        relatedType: 'product',
                        isActive: true
                    },
                    {
                        userId: product.userId,
                        type: 'expiry_warning',
                        title: 'Product Expiry Warning',
                        message: `${product.name} will expire on ${product.expiryDate.toDateString()}`,
                        relatedId: product._id,
                        relatedType: 'product',
                        priority: product.expiryDate <= today ? 'urgent' : 'high',
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (error) {
        console.error("Generate stock notifications error:", error);
    }
};

// Auto-generate notifications for payment due dates
const generatePaymentNotifications = async () => {
    try {
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

        const orders = await SalesOrder.find({
            'paymentInfo.status': { $in: ['pending', 'partial'] },
            'paymentInfo.dueDate': { $lte: sevenDaysFromNow }
        }).populate('userId');

        for (const order of orders) {
            const dueDate = new Date(order.paymentInfo.dueDate);
            const isOverdue = dueDate < today;
            
            await Notification.findOneAndUpdate(
                {
                    userId: order.userId._id,
                    type: isOverdue ? 'payment_overdue' : 'payment_due',
                    relatedId: order._id,
                    relatedType: 'sales_order',
                    isActive: true
                },
                {
                    userId: order.userId._id,
                    type: isOverdue ? 'payment_overdue' : 'payment_due',
                    title: isOverdue ? 'Payment Overdue' : 'Payment Due Soon',
                    message: `Payment for order ${order._id} is ${isOverdue ? 'overdue' : 'due'} on ${dueDate.toDateString()}`,
                    relatedId: order._id,
                    relatedType: 'sales_order',
                    priority: isOverdue ? 'urgent' : 'high',
                    isActive: true
                },
                { upsert: true, new: true }
            );
        }
    } catch (error) {
        console.error("Generate payment notifications error:", error);
    }
};

export {
    createNotification, deleteNotification, generatePaymentNotifications, generateStockNotifications, getNotificationCounts, getUserNotifications, markAllAsRead, markAsRead
};

