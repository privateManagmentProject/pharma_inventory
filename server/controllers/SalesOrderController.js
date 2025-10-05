import CustomerModal from "../models/Customer.js";
import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";

const createSalesOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      items, 
      paymentInfo,
      notes 
    } = req.body;

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
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
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

    // Process payment info based on payment type
    let processedPaymentInfo = {
      paymentType: paymentInfo.paymentType || 'one-time',
      dueDate: paymentInfo.dueDate,
      status: 'pending',
      totalPaidAmount: 0,
      remainingAmount: totalAmount
    };

    if (paymentInfo.paymentType === 'two-time') {
      processedPaymentInfo.secondPaymentDate = paymentInfo.secondPaymentDate;
    } else if (paymentInfo.paymentType === 'date-based') {
      processedPaymentInfo.paymentSchedule = paymentInfo.paymentSchedule || [];
    }

    // Create sales order
    const newSalesOrder = new SalesOrderModal({
      customerId,
      customerName: customer.name,
      items: orderItems,
      totalAmount: totalAmount.toFixed(2),
      paymentInfo: processedPaymentInfo,
      status: 'pending',
      paidAmount: 0,
      unpaidAmount: totalAmount,
      notes: notes || ''
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
        const { 
            status, 
            customerName, 
            productName, 
            paymentStatus,
            paymentType,
            dateFrom,
            dateTo,
            minAmount,
            maxAmount,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;
        
        let filter = {};
        
        // Status filters
        if (status) filter.status = status;
        if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
        if (productName) {
            filter['items.productName'] = { $regex: productName, $options: 'i' };
        }
        if (paymentStatus) {
            filter['paymentInfo.status'] = paymentStatus;
        }
        if (paymentType) {
            filter['paymentInfo.paymentType'] = paymentType;
        }
        
        // Date range filters
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }
        
        // Amount range filters
        if (minAmount || maxAmount) {
            filter.totalAmount = {};
            if (minAmount) filter.totalAmount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.totalAmount.$lte = parseFloat(maxAmount);
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const salesOrders = await SalesOrderModal.find(filter)
            .populate('customerId', 'name companyName phone')
            .populate('items.productId', 'name brandName')
            .populate('items.supplierId', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await SalesOrderModal.countDocuments(filter);
        
        return res.status(200).json({ 
            success: true, 
            salesOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error fetching sales orders:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentDate, notes } = req.body;

        const salesOrder = await SalesOrderModal.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ success: false, message: "Sales order not found" });
        }

        const paymentAmount = parseFloat(amount);
        const totalAmount = parseFloat(salesOrder.totalAmount);
        const currentPaidAmount = salesOrder.paidAmount || 0;
        const newPaidAmount = currentPaidAmount + paymentAmount;

        // Update payment info based on payment type
        if (salesOrder.paymentInfo && salesOrder.paymentInfo.paymentType === 'date-based') {
            // Find the next unpaid scheduled payment
            const unpaidSchedule = salesOrder.paymentInfo.paymentSchedule.find(
                schedule => schedule.status === 'pending'
            );
            
            if (unpaidSchedule) {
                unpaidSchedule.status = 'paid';
                unpaidSchedule.paidDate = paymentDate || new Date();
            }
        }

        // Update sales order
        salesOrder.paidAmount = newPaidAmount;
        
        // Ensure paymentInfo exists before updating
        if (!salesOrder.paymentInfo) {
            salesOrder.paymentInfo = {
                paymentType: 'one-time',
                status: 'pending',
                totalPaidAmount: 0,
                remainingAmount: totalAmount
            };
        }
        
        salesOrder.paymentInfo.totalPaidAmount = newPaidAmount;
        salesOrder.paymentInfo.remainingAmount = totalAmount - newPaidAmount;

        // Update status based on payment
        if (newPaidAmount >= totalAmount) {
            salesOrder.paymentInfo.status = 'completed';
            salesOrder.status = 'completed';
        } else if (newPaidAmount > 0) {
            salesOrder.paymentInfo.status = 'partial';
            salesOrder.status = 'progress';
        }

        // Check if overdue
        const today = new Date();
        if (salesOrder.paymentInfo.paymentType === 'one-time' && salesOrder.paymentInfo.dueDate) {
            const dueDate = new Date(salesOrder.paymentInfo.dueDate);
            if (salesOrder.paymentInfo.status !== 'completed' && today > dueDate) {
                salesOrder.paymentInfo.status = 'overdue';
            }
        } else if (salesOrder.paymentInfo.paymentType === 'two-time' && salesOrder.paymentInfo.secondPaymentDate) {
            const firstDue = new Date(salesOrder.paymentInfo.dueDate);
            const secondDue = new Date(salesOrder.paymentInfo.secondPaymentDate);
            if (salesOrder.paymentInfo.status !== 'completed' && (today > firstDue || today > secondDue)) {
                salesOrder.paymentInfo.status = 'overdue';
            }
        }

        await salesOrder.save();

        return res.status(200).json({
            success: true,
            message: "Payment added successfully",
            salesOrder
        });

    } catch (error) {
        console.error("Add payment error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const getPaymentSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const salesOrder = await SalesOrderModal.findById(id);
        if (!salesOrder) {
            return res.status(404).json({ success: false, message: "Sales order not found" });
        }

        const paymentSchedule = salesOrder.paymentInfo?.paymentSchedule || [];
        const totalAmount = parseFloat(salesOrder.totalAmount);
        const paidAmount = salesOrder.paidAmount || 0;

        return res.status(200).json({
            success: true,
            paymentSchedule,
            totalAmount,
            paidAmount,
            remainingAmount: totalAmount - paidAmount,
            paymentType: salesOrder.paymentInfo?.paymentType || 'one-time'
        });

    } catch (error) {
        console.error("Get payment schedule error:", error);
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
                if (salesOrder.paymentInfo) {
                    salesOrder.paymentInfo.status = 'completed';
                }
            } else if (salesOrder.paidAmount > 0) {
                salesOrder.status = 'progress';
                if (salesOrder.paymentInfo) {
                    salesOrder.paymentInfo.status = 'partial';
                }
            } else {
                salesOrder.status = 'pending';
                if (salesOrder.paymentInfo) {
                    salesOrder.paymentInfo.status = 'pending';
                }
            }
            
            // Check if overdue
            const today = new Date();
            if (salesOrder.paymentInfo && salesOrder.paymentInfo.dueDate) {
                const dueDate = new Date(salesOrder.paymentInfo.dueDate);
                if (salesOrder.paymentInfo.status !== 'completed' && today > dueDate) {
                    salesOrder.paymentInfo.status = 'overdue';
                }
            }
        }

        // Manual status override if provided
        if (status) {
            salesOrder.status = status;
            
            // If manually approved, set paid amount to full price
            if (status === 'approved' || status === 'completed') {
                salesOrder.paidAmount = parseFloat(salesOrder.totalAmount);
                if (salesOrder.paymentInfo) {
                    salesOrder.paymentInfo.status = 'completed';
                }
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
            if (salesOrder.paymentInfo) {
                salesOrder.paymentInfo.status = 'completed';
            }
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
            if (salesOrder.paymentInfo) {
                salesOrder.paymentInfo.status = 'pending';
            }
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

export {
    addPayment, createSalesOrder, getPaymentSchedule, getSalesOrderById,
    getSalesOrders,
    updateSalesOrder,
    updateSalesOrderStatus
};
