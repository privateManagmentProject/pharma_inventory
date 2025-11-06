import fs from "fs";
import multer from "multer";
import path from "path";
import CustomerModal from "../models/Customer.js";
import ProductModal from "../models/Product.js";
import SalesOrderModal from "../models/SalesOrder.js";

// Multer configuration for payment slips and license files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = 'uploads/';
    if (file.fieldname === 'paymentSlips') {
      uploadDir += 'payment-slips/';
    } else if (file.fieldname === 'licenseFiles') {
      uploadDir += 'licenses/';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}).fields([
  { name: 'paymentSlips', maxCount: 5 },
  { name: 'licenseFiles', maxCount: 5 }
]);

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = "sales-order") => {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true
    });
    
    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      path: result.secure_url,
      publicId: result.public_id,
      name: path.basename(filePath),
      type: result.resource_type === 'image' ? `image/${result.format}` : 'application/pdf',
      uploadedAt: new Date()
    };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

const getSalesOrders = async (req, res) => {
    try {
        const { 
            status, 
            region,
            zone,
            paymentMethod,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;
        
        let filter = {};
        
        // Status filter
        if (status) filter.status = status;
        
        // Address filters
        if (region) {
          filter['customerAddress.region'] = { $regex: region, $options: 'i' };
        }
        
        if (zone) {
          filter['customerAddress.zone'] = { $regex: zone, $options: 'i' };
        }
        
        // Payment method filter
        if (paymentMethod) {
          filter['paymentInfo.paymentMethod'] = paymentMethod;
        }
        
        // General search
        if (search) {
          const searchRegex = { $regex: search, $options: 'i' };
          filter.$or = [
            { customerName: searchRegex },
            { companyName: searchRegex },
            { customerTin: searchRegex },
            { 'items.productName': searchRegex },
            { 'items.supplierName': searchRegex }
          ];
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const salesOrders = await SalesOrderModal.find(filter)
            .populate('customerId', 'name companyName phone address withhold withholdPhone receiverInfo tinNumber licenses')
            .populate('items.productId', 'name brandName categoryId stock soldPrice purchasePrice')
            .populate('items.supplierId', 'name accounts')
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

const createSalesOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      items
    } = req.body;

    // Validate customer and get additional info
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
      
      if (product.stock < parseInt(item.quantity)) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
      
      const unitPrice = product.soldPrice;
      const supplierPrice = product.purchasePrice;
      const itemTotal = unitPrice * parseInt(item.quantity);
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productCategory: product.categoryId?.name || '',
        quantity: parseInt(item.quantity),
        packageSize: item.packageSize,
        unitPrice: unitPrice,
        supplierPrice: supplierPrice,
        totalPrice: itemTotal,
        supplierId: product.supplierId?._id || '',
        supplierName: product.supplierId?.name || ''
      });
    }

    // Create sales order with pre_order status
    const newSalesOrder = new SalesOrderModal({
      customerId,
      customerName: customer.name,
      customerTin: customer.tinNumber,
      customerAddress: customer.address,
      customerLicense: customer.licenses.length > 0 ? customer.licenses[0].path : '',
      companyName: customer.companyName,
      withhold: customer.withhold,
      withholdPhone: customer.withholdPhone,
      receiverName: customer.receiverInfo?.name || '',
      receiverPhone: customer.receiverInfo?.phone || '',
      receiverAddress: customer.receiverInfo?.address || '',
      items: orderItems,
      totalAmount: totalAmount,
      paymentInfo: {
        paymentMethod: 'cash', // Default, will be updated later
        status: 'pending',
        totalPaidAmount: 0,
        remainingAmount: totalAmount
      },
      status: 'pre_order',
      paidAmount: 0,
      unpaidAmount: totalAmount,
      step: 1
    });

    await newSalesOrder.save();
    
    return res.status(201).json({ 
      success: true, 
      message: "Pre-order created successfully", 
      salesOrder: newSalesOrder 
    });

  } catch (error) {
    console.error("Error creating sales order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSalesOrderStatus = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { id } = req.params;
        const { 
          status, 
          paymentMethod, 
          paidAmount, 
          dueDate,
          withholdPhone,
          cancellationReason,
          notes 
        } = req.body;

        const salesOrder = await SalesOrderModal.findById(id);
        if (!salesOrder) {
          return res.status(404).json({ success: false, message: "Sales order not found" });
        }

        const oldStatus = salesOrder.status;
        
        // Upload payment slips if any
        const paymentSlips = [];
        if (req.files && req.files.paymentSlips) {
          for (const file of req.files.paymentSlips) {
            try {
              const cloudinaryResult = await uploadToCloudinary(file.path, 'payment-slips');
              paymentSlips.push(cloudinaryResult);
            } catch (uploadError) {
              console.error("Cloudinary upload error for payment slip:", file.originalname, uploadError);
            }
          }
        }

        // Upload license files if any
        const licenseFiles = [];
        if (req.files && req.files.licenseFiles) {
          for (const file of req.files.licenseFiles) {
            try {
              const cloudinaryResult = await uploadToCloudinary(file.path, 'licenses');
              licenseFiles.push(cloudinaryResult);
            } catch (uploadError) {
              console.error("Cloudinary upload error for license file:", file.originalname, uploadError);
            }
          }
        }

        // Update payment info
        if (paymentMethod) {
          salesOrder.paymentInfo.paymentMethod = paymentMethod;
        }
        
        if (paidAmount !== undefined) {
          const additionalAmount = parseFloat(paidAmount);
          salesOrder.paidAmount += additionalAmount;
          salesOrder.paymentInfo.totalPaidAmount += additionalAmount;
        }

        if (dueDate) {
          salesOrder.paymentInfo.dueDate = new Date(dueDate);
        }

        // Add new payment slips
        if (paymentSlips.length > 0) {
          salesOrder.paymentInfo.paymentSlips = [...salesOrder.paymentInfo.paymentSlips, ...paymentSlips];
        }

        // Add new license files
        if (licenseFiles.length > 0) {
          salesOrder.licenseFiles = [...salesOrder.licenseFiles, ...licenseFiles];
        }

        // Update status and step
        if (status) {
          salesOrder.status = status;
          
          // Update step based on status
          if (status === 'pre_order') {
            salesOrder.step = 1;
          } else if (['sales_order_started', 'payment_progress', 'payment_completed', 'credit'].includes(status)) {
            salesOrder.step = 2;
          } else if (status === 'supplier_checked') {
            salesOrder.step = 3;
          } else if (status === 'cancelled_payment') {
            salesOrder.step = 0;
          }
        }

        // Update withhold phone
        if (withholdPhone !== undefined) {
          salesOrder.withholdPhone = withholdPhone;
        }

        // Update cancellation reason
        if (cancellationReason) {
          salesOrder.cancellationReason = cancellationReason;
        }

        // Update notes
        if (notes !== undefined) {
          salesOrder.notes = notes;
        }

        // Handle stock changes when moving to sales_order_started
        if (status === 'sales_order_started' && oldStatus === 'pre_order') {
          for (const item of salesOrder.items) {
            const product = await ProductModal.findById(item.productId);
            if (product) {
              product.stock = product.stock - item.quantity;
              await product.save();
            }
          }
        }

        // Restock if moving back from sales_order_started or cancelling
        if ((oldStatus === 'sales_order_started' && status !== 'sales_order_started') || 
            status === 'cancelled_payment') {
          for (const item of salesOrder.items) {
            const product = await ProductModal.findById(item.productId);
            if (product) {
              product.stock = product.stock + item.quantity;
              await product.save();
            }
          }
        }

        await salesOrder.save();

        return res.status(200).json({ 
          success: true, 
          message: "Sales order updated successfully",
          salesOrder 
        });
      } catch (innerError) {
        console.error("Inner update error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch (error) {
    console.error("Update sales order error:", error);
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
    
    return res.status(200).json({ success: true, salesOrder });
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const generateSalesOrderPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'customer', 'supplier', 'internal'

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

    // Enhanced PDF data with all customer information
    const pdfData = {
      salesOrder: {
        ...salesOrder.toObject(),
        customerFullInfo: salesOrder.customerId
      }
    };

    return res.status(200).json({
      success: true,
      ...pdfData,
      pdfType: type
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  createSalesOrder, generateSalesOrderPDF, getSalesOrderById, getSalesOrders, updateSalesOrderStatus
};
