import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";

const createSalesOrder = async (req, res) => {
    try {
        const { productId, quantity, packageSize, salesPrice, customerName } = req.body;

        // Check if product exists
        const product = await ProductModal.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Check if there's enough stock
        if (parseInt(product.stock) < parseInt(quantity)) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient stock available" 
            });
        }

        const newSalesOrder = new SalesOrderModal({
            productId,
            productName: product.name,
            quantity,
            packageSize,
            salesPrice,
            customerName
        });

        await newSalesOrder.save();
        return res.status(201).json({ 
            success: true, 
            message: "Sales order created successfully", 
            salesOrder: newSalesOrder 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getSalesOrders = async (req, res) => {
    try {
        const { status, customerName, productName } = req.query;
        let filter = {};
        
        if (status) filter.status = status;
        if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
        if (productName) filter.productName = { $regex: productName, $options: 'i' };

        const salesOrders = await SalesOrderModal.find(filter)
            .populate('productId')
            .sort({ createdAt: -1 });
            
        return res.status(200).json({ success: true, salesOrders });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateSalesOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const salesOrder = await SalesOrderModal.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ success: false, message: "Sales order not found" });
        }

        // If approving the order, reduce the product stock
        if (status === 'approved' && salesOrder.status !== 'approved') {
            const product = await ProductModal.findById(salesOrder.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            // Update stock
            product.stock = (parseInt(product.stock) - parseInt(salesOrder.quantity)).toString();
            await product.save();
        }

        // If rejecting an approved order, restock the product
        if (status === 'rejected' && salesOrder.status === 'approved') {
            const product = await ProductModal.findById(salesOrder.productId);
            if (product) {
                product.stock = (parseInt(product.stock) + parseInt(salesOrder.quantity)).toString();
                await product.save();
            }
        }

        salesOrder.status = status;
        await salesOrder.save();

        return res.status(200).json({ 
            success: true, 
            message: "Sales order status updated successfully" 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export { createSalesOrder, getSalesOrders, updateSalesOrderStatus };
