import multer from "multer";
import path from "path";
import ProductModal from "../models/Product.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('image');

const createProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { name, brandName, description, manufacturer, price, supplierPrice, expiryDate, stock, packageSize, categoryId, supplierId, lowStockThreshold } = req.body;
      
      const existingProduct = await ProductModal.findOne({ name, userId: req.user._id });
      if(existingProduct){
        return res.status(400).json({ success: false, message: "Product already exists"});
      }

      const newProduct = new ProductModal({
        name, 
        brandName, 
        description, 
        manufacturer, 
        price, 
        supplierPrice, 
        expiryDate, 
        stock, 
        packageSize, 
        categoryId, 
        supplierId,
        lowStockThreshold: lowStockThreshold || 10,
        userId: req.user._id, // Track which user created this product
        image: req.file ? req.file.path : null
      });
      
      await newProduct.save();
      return res.status(201).json({ success: true, message: "Product added successfully", product: newProduct});
    });
  } catch(error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
};

const getProducts = async(req, res) => {
 try {  
  const { search, category, supplier, minPrice, maxPrice, minStock, maxStock, expiryDateFrom, expiryDateTo, packageSize, manufacturer, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
  let filter = {};
  if(search){
    filter={
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
  }
  if(category){
    filter.categoryId = category;
  }
  if(supplier){
    filter.supplierId = supplier;
  }
  if(packageSize){
    filter.packageSize = packageSize;
  }
  if(manufacturer){
    filter.manufacturer = { $regex: manufacturer, $options: 'i' };
  }
  // Price range filters
  if(minPrice || maxPrice){
    filter.price = {};
    if(minPrice) filter.price.$gte = minPrice;
    if(maxPrice) filter.price.$lte = maxPrice;
  }
  
  // Stock range filters
  if(minStock || maxStock){
    filter.stock = {};
    if(minStock) filter.stock.$gte = minStock;
    if(maxStock) filter.stock.$lte = maxStock;
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

  const products = await ProductModal.find(filter)
    .populate('categoryId', 'name')
    .populate('supplierId', 'name email')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await ProductModal.countDocuments(filter);
  
  return res.status(200).json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
 } catch (error) {
  console.error("Get products error:", error);
  return res.status(500).json({ success: false, message: "Server error" });
 }
   
};

const updateProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      // Check if product exists and user has permission
      const existingProduct = await ProductModal.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Product not found"});
      }
      
      // Role-based access control
      if (req.user.role !== 'admin' && existingProduct.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied"});
      }
      
      // If a new image was uploaded, add it to the update data
      if (req.file) {
        updateData.image = req.file.path;
      }
      
      const updatedProduct = await ProductModal.findByIdAndUpdate(
        id, 
        updateData,
        { new: true }
      );
      
      return res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct});
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
}
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModal.findById(id)
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

export { createProduct, deleteProduct, getProductById, getProducts, updateProduct };

