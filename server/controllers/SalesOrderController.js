import CustomerModal from "../models/Customer.js";
import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";
const createSalesOrder = async (req, res) => {
    try {
        const { productId, quantity, packageSize, customerId, paidAmount = 0 } = req.body;

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

        // Calculate total sales price
        const salesPrice = (parseFloat(product.price) * parseInt(quantity)).toFixed(2);
        
        // Determine initial status based on payment
        let status = 'pending';
        if (paidAmount > 0) {
            status = parseFloat(paidAmount) >= parseFloat(salesPrice) ? 'approved' : 'progress';
        }
const customer =await CustomerModal.findById(customerId);
if(!customer){
    return res.status(404).json({ success: false, message: "Customer not found" });
}
        const newSalesOrder = new SalesOrderModal({
            productId,
            productName: product.name,
            quantity,
            packageSize,
            salesPrice,
            paidAmount: parseFloat(paidAmount),
            status,
            customerId,
            customerName: customer.name,
        });

        await newSalesOrder.save();
        
        // Update stock if fully paid/approved
        if (status === 'approved') {
            product.stock = (parseInt(product.stock) - parseInt(quantity)).toString();
            await product.save();
        }
        
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

const updateSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount, status, ...otherFields } = req.body;

        const salesOrder = await SalesOrderModal.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ success: false, message: "Sales order not found" });
        }

        // Store old status for stock adjustment logic
        const oldStatus = salesOrder.status;
        
        // Update paid amount if provided
        if (paidAmount !== undefined) {
            salesOrder.paidAmount = parseFloat(paidAmount);
            
            // Auto-update status based on payment
            if (salesOrder.paidAmount >= parseFloat(salesOrder.salesPrice)) {
                salesOrder.status = 'approved';
            } else if (salesOrder.paidAmount > 0) {
                salesOrder.status = 'progress';
            } else {
                salesOrder.status = 'pending';
            }
        }

        // Manual status override if provided
        if (status) {
            salesOrder.status = status;
            
            // If manually approved, set paid amount to full price
            if (status === 'approved') {
                salesOrder.paidAmount = parseFloat(salesOrder.salesPrice);
            }
        }

        // Update other fields if any
        Object.keys(otherFields).forEach(key => {
            if (salesOrder[key] !== undefined) {
                salesOrder[key] = otherFields[key];
            }
        });

        await salesOrder.save();

        // Handle stock changes
        const product = await ProductModal.findById(salesOrder.productId);
        if (product) {
            // If status changed to approved and was not approved before
            if (salesOrder.status === 'approved' && oldStatus !== 'approved') {
                // Reduce stock when order is approved
                product.stock = (parseInt(product.stock) - parseInt(salesOrder.quantity)).toString();
            } 
            // If status changed from approved to something else
            else if (oldStatus === 'approved' && salesOrder.status !== 'approved') {
                // Restock if order is no longer approved
                product.stock = (parseInt(product.stock) + parseInt(salesOrder.quantity)).toString();
            }
            await product.save();
        }

        return res.status(200).json({ 
            success: true, 
            message: "Sales order updated successfully",
            salesOrder 
        });

    } catch (error) {
        console.error("Update sales order error:", error);
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

        const oldStatus = salesOrder.status;
        salesOrder.status = status;

        // If approving the order, reduce the product stock
        if (status === 'approved' && oldStatus !== 'approved') {
            const product = await ProductModal.findById(salesOrder.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            // Update stock
            product.stock = (parseInt(product.stock) - parseInt(salesOrder.quantity)).toString();
            await product.save();
            
            // Set paid amount to full price if approving
            salesOrder.paidAmount = parseFloat(salesOrder.salesPrice);
        }

        // If rejecting an approved order, restock the product
        if (status === 'rejected' && oldStatus === 'approved') {
            const product = await ProductModal.findById(salesOrder.productId);
            if (product) {
                product.stock = (parseInt(product.stock) + parseInt(salesOrder.quantity)).toString();
                await product.save();
            }
            
            // Reset paid amount if rejecting
            salesOrder.paidAmount = 0;
        }

        await salesOrder.save();

        return res.status(200).json({ 
            success: true, 
            message: "Sales order status updated successfully" 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await SalesOrderModal.findById(id)
      .populate('productId');
    
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: "Sales order not found" });
    }
    
    return res.status(200).json({ success: true, salesOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




export { createSalesOrder, getSalesOrderById, getSalesOrders, updateSalesOrder, updateSalesOrderStatus };

