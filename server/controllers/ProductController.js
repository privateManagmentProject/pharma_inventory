import fs from "fs";
import multer from "multer";
import path from "path";
import ProductModel from "../models/Product.js";

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Configure multer for file uploads with better error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + fileExtension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! Please upload JPG, PNG, or GIF files.'), false);
  }
};

// Configure multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file
  }
}).single('image');

// Helper function to get base URL
const getBaseUrl = (req) => {
  if (process.env.NODE_ENV === 'production') {
    return `${req.protocol}://${req.get('host')}`;
  }
  return `${req.protocol}://${req.get('host')}`;
};

const createProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB." });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ success: false, message: "Too many files. Only one file allowed." });
          }
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      const { 
        name, 
        brandName, 
        brandRate, 
        description, 
        manufacturer, 
        soldPrice, 
        purchasePrice, 
        expiryDate, 
        stock, 
        packageSize, 
        cartonSize, 
        categoryId, 
        supplierId, 
        lowStockThreshold 
      } = req.body;
      
      // Validate required fields
      if (!name || !description || !soldPrice || !purchasePrice || !expiryDate || !stock || !packageSize || !categoryId || !supplierId) {
        return res.status(400).json({ success: false, message: "All required fields must be filled" });
      }

      // Check if product already exists
      const existingProduct = await ProductModel.findOne({ name, userId: req.user._id });
      if(existingProduct){
        return res.status(400).json({ success: false, message: "Product already exists"});
      }

      // Handle image path
      let imagePath = null;
      if (req.file) {
        // Store relative path for flexibility
        imagePath = `/uploads/${req.file.filename}`;
        
        // For production, you might want to store the full URL
        if (process.env.NODE_ENV === 'production') {
          imagePath = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
        }
      }

      const newProduct = new ProductModel({
        name, 
        brandName, 
        brandRate: brandRate || 'good',
        description, 
        manufacturer, 
        soldPrice,
        purchasePrice,
        expiryDate, 
        stock, 
        packageSize, 
        cartonSize,
        categoryId, 
        supplierId,
        lowStockThreshold: lowStockThreshold || 500,
        outOfStockThreshold: 100,
        userId: req.user._id,
        image: imagePath
      });
      
      await newProduct.save();
      
      // Populate the saved product for response
      const populatedProduct = await ProductModel.findById(newProduct._id)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name email');
      
      return res.status(201).json({ 
        success: true, 
        message: "Product added successfully", 
        product: populatedProduct 
      });
    });
  } catch(error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
};

const getProducts = async(req, res) => {
  try {  
    const { 
      search, 
      category, 
      supplier, 
      minPrice, 
      maxPrice, 
      minStock, 
      maxStock, 
      expiryDateFrom, 
      expiryDateTo, 
      packageSize, 
      manufacturer, 
      brandRate,
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;
    
    let filter = { isActive: true };
    
    // Enhanced search to include brand and manufacturer
    if(search){
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if(category) filter.categoryId = category;
    if(supplier) filter.supplierId = supplier;
    if(packageSize) filter.packageSize = packageSize;
    if(manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };
    if(brandRate) filter.brandRate = brandRate;
    
    // Price range filters
    if(minPrice || maxPrice){
      filter.soldPrice = {};
      if(minPrice) filter.soldPrice.$gte = parseFloat(minPrice);
      if(maxPrice) filter.soldPrice.$lte = parseFloat(maxPrice);
    }
    
    // Stock range filters
    if(minStock || maxStock){
      filter.stock = {};
      if(minStock) filter.stock.$gte = parseInt(minStock);
      if(maxStock) filter.stock.$lte = parseInt(maxStock);
    }
    
    // Expiry date filters
    if(expiryDateFrom || expiryDateTo){
      filter.expiryDate = {};
      if(expiryDateFrom) filter.expiryDate.$gte = new Date(expiryDateFrom);
      if(expiryDateTo) filter.expiryDate.$lte = new Date(expiryDateTo);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await ProductModel.find(filter)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ProductModel.countDocuments(filter);
    
    return res.status(200).json({ 
      success: true, 
      products, 
      total, 
      page: parseInt(page), 
      pages: Math.ceil(total / parseInt(limit)) 
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB." });
          }
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      // Check if product exists
      const existingProduct = await ProductModel.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Product not found"});
      }
      
      // Role-based access control
      if (req.user.role !== 'admin' && existingProduct.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied"});
      }
      
      // Handle image upload
      if (req.file) {
        // Delete old image if exists
        if (existingProduct.image && existingProduct.image.includes('/uploads/')) {
          const oldImagePath = path.join(process.cwd(), existingProduct.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Set new image path
        updateData.image = `/uploads/${req.file.filename}`;
        if (process.env.NODE_ENV === 'production') {
          updateData.image = `${getBaseUrl(req)}/uploads/${req.file.filename}`;
        }
      }
      
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id, 
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name')
       .populate('supplierId', 'name email');
      
      return res.status(200).json({ 
        success: true, 
        message: "Product updated successfully", 
        product: updatedProduct 
      });
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
};

// Add this endpoint to serve images
const getProductImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    
    // Send file
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Get product image error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists and user has permission
    const existingProduct = await ProductModal.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found"});
    }
    
    // Role-based access control
    if (req.user.role !== 'admin' && existingProduct.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied"});
    }
    
    // Soft delete by setting isActive to false
    const deletedProduct = await ProductModal.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    return res.status(200).json({ success: true, message: "Product deleted successfully"});
    
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
}
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name email')
      .populate('userId', 'name email');
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Role-based access control
    if (req.user.role !== 'admin' && product.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  createProduct,
  deleteProduct, getProductById, getProductImage, getProducts, updateProduct
};

