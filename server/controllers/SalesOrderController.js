import CustomerModal from "../models/Customer.js";
import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";
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
      const product = await ProductModal.findById(item.productId)
        .populate('categoryId')
        .populate('supplierId');
      
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
        productName: product.name,
        productCategory: product.categoryId?.name || '',
        quantity: item.quantity,
        packageSize: item.packageSize,
        unitPrice: product.price,
        totalPrice: itemTotal.toFixed(2),
        supplierId: product.supplierId?._id || '',
        supplierName: product.supplierId?.name || ''
      });
    }

    // Create sales order
    const newSalesOrder = new SalesOrderModal({
      customerId,
      customerName: customer.name,
      items: orderItems,
      totalAmount: totalAmount.toFixed(2),
      paymentInfo: {
        dueDate: paymentDueDate,
        status: 'pending'
      },
      status: 'pending',
      paidAmount: 0,
      unpaidAmount: totalAmount
    });

    await newSalesOrder.save();
    
    return res.status(201).json({ 
      success: true, 
      message: "Sales order created successfully", 
      salesOrder: newSalesOrder 
    });

  } catch (error) {
    console.error("Error creating sales order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSalesOrders = async (req, res) => {
    try {
        const { status, customerName, productName } = req.query;
        let filter = {};
        
        if (status) filter.status = status;
        if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
        if (productName) {
            filter['items.productName'] = { $regex: productName, $options: 'i' };
        }

        const salesOrders = await SalesOrderModal.find(filter)
            .populate('customerId')
            .populate('items.productId')
            .populate('items.supplierId');
            
        return res.status(200).json({ success: true, salesOrders });
    } catch (error) {
        console.error("Error fetching sales orders:", error);
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
            const totalAmount = parseFloat(salesOrder.totalAmount);
            if (salesOrder.paidAmount >= totalAmount) {
                salesOrder.status = 'completed';
                salesOrder.paymentInfo.status = 'completed';
            } else if (salesOrder.paidAmount > 0) {
                salesOrder.status = 'progress';
                salesOrder.paymentInfo.status = 'partial';
            } else {
                salesOrder.status = 'pending';
                salesOrder.paymentInfo.status = 'pending';
            }
            
            // Check if overdue
            const today = new Date();
            const dueDate = new Date(salesOrder.paymentInfo.dueDate);
            if (salesOrder.paymentInfo.status !== 'completed' && today > dueDate) {
                salesOrder.paymentInfo.status = 'overdue';
            }
        }

        // Manual status override if provided
        if (status) {
            salesOrder.status = status;
            
            // If manually approved, set paid amount to full price
            if (status === 'approved' || status === 'completed') {
                salesOrder.paidAmount = parseFloat(salesOrder.totalAmount);
                salesOrder.paymentInfo.status = 'completed';
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
        if ((salesOrder.status === 'approved' || salesOrder.status === 'completed') && 
            (oldStatus !== 'approved' && oldStatus !== 'completed')) {
            // Reduce stock for all items when order is approved/completed
            for (const item of salesOrder.items) {
                const product = await ProductModal.findById(item.productId);
                if (product) {
                    product.stock = (parseInt(product.stock) - parseInt(item.quantity)).toString();
                    await product.save();
                }
            }
        } else if ((oldStatus === 'approved' || oldStatus === 'completed') && 
                   (salesOrder.status !== 'approved' && salesOrder.status !== 'completed')) {
            // Restock all items if order is no longer approved/completed
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
        if ((status === 'approved' || status === 'completed') && 
            (oldStatus !== 'approved' && oldStatus !== 'completed')) {
            for (const item of salesOrder.items) {
                const product = await ProductModal.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: "Product not found" });
                }

                // Update stock
                product.stock = (parseInt(product.stock) - parseInt(item.quantity)).toString();
                await product.save();
            }
            
            // Set paid amount to full price if approving
            salesOrder.paidAmount = parseFloat(salesOrder.totalAmount);
            salesOrder.paymentInfo.status = 'completed';
        }

        // If rejecting an approved order, restock the product
        if ((status === 'rejected' || status === 'pending') && 
            (oldStatus === 'approved' || oldStatus === 'completed')) {
            for (const item of salesOrder.items) {
                const product = await ProductModal.findById(item.productId);
                if (product) {
                    product.stock = (parseInt(product.stock) + parseInt(item.quantity)).toString();
                    await product.save();
                }
            }
            
            // Reset paid amount if rejecting
            salesOrder.paidAmount = 0;
            salesOrder.paymentInfo.status = 'pending';
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
      .populate('customerId')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'categoryId',
          model: 'Category'
        }
      })
      .populate('items.supplierId');
    
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: "Sales order not found" });
    }
    
    // Format the response to include names
    const formattedSalesOrder = {
      ...salesOrder.toObject(),
      customerName: salesOrder.customerId?.name || salesOrder.customerName,
      items: salesOrder.items.map(item => ({
        ...item,
        productName: item.productId?.name || item.productName,
        productCategory: item.productId?.categoryId?.name || item.productCategory,
        supplierName: item.supplierId?.name || item.supplierName
      }))
    };
    
    return res.status(200).json({ success: true, salesOrder: formattedSalesOrder });
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createSalesOrder, getSalesOrderById, getSalesOrders, updateSalesOrder, updateSalesOrderStatus };
