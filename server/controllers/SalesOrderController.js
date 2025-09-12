import CustomerModal from "../models/Customer.js";
import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";
// SalesOrderController.js (Updated)
const createSalesOrder = async (req, res) => {
  try {
    const { customerId, items, paymentDueDate } = req.body;

    // Validate customer
    const customer = await CustomerModal.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await ProductModal.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }
      
      if (parseInt(product.stock) < parseInt(item.quantity)) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}` 
        });
      }
      
      const itemTotal = parseFloat(product.price) * parseInt(item.quantity);
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        packageSize: item.packageSize,
        unitPrice: product.price,
        totalPrice: itemTotal.toFixed(2),
        supplierId: product.supplierId
      });
    }

    // Create sales order
    const newSalesOrder = new SalesOrderModal({
      customerId,
      items: orderItems,
      totalAmount: totalAmount.toFixed(2),
      paymentInfo: {
        dueDate: paymentDueDate,
        status: 'pending'
      },
      status: 'pending',
      customerName: customer.name,
    });

    await newSalesOrder.save();
    
    return res.status(201).json({ 
      success: true, 
      message: "Sales order created successfully", 
      salesOrder: newSalesOrder 
    });

  } catch (error) {
    console.error(error);
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

        const salesOrders = await SalesOrderModal.find(filter);
            
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
            const additionalAmount = parseFloat(paidAmount);
            salesOrder.paidAmount += additionalAmount;
            
            // Auto-update status based on payment
            if (salesOrder.paidAmount >= parseFloat(salesOrder.totalAmount)) {
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
                salesOrder.paidAmount = parseFloat(salesOrder.totalAmount);
            }
        }

        // Update other fields if any
        Object.keys(otherFields).forEach(key => {
            if (salesOrder[key] !== undefined) {
                salesOrder[key] = otherFields[key];
            }
        });

        await salesOrder.save();

        // Handle stock changes for multiple items
        if (salesOrder.status === 'approved' && oldStatus !== 'approved') {
            // Reduce stock for all items when order is approved
            for (const item of salesOrder.items) {
                const product = await ProductModal.findById(item.productId);
                if (product) {
                    product.stock = (parseInt(product.stock) - parseInt(item.quantity)).toString();
                    await product.save();
                }
            }
        } else if (oldStatus === 'approved' && salesOrder.status !== 'approved') {
            // Restock all items if order is no longer approved
            for (const item of salesOrder.items) {
                const product = await ProductModal.findById(item.productId);
                if (product) {
                    product.stock = (parseInt(product.stock) + parseInt(item.quantity)).toString();
                    await product.save();
                }
            }
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
      .populate('items.productId')  // Populate productId in items
      .populate('customerId');  
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: "Sales order not found" });
    }
    
    return res.status(200).json({ success: true, salesOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




export { createSalesOrder, getSalesOrderById, getSalesOrders, updateSalesOrder, updateSalesOrderStatus };

