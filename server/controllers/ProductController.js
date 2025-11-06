import fs from "fs";
import multer from "multer";
import path from "path";
import ProductModel from "../models/Product.js";

// Temporary disk storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products/';
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).single('image');

// Helper function to upload to Cloudinary using dynamic import
const uploadToCloudinary = async (filePath, folder = "product-images") => {
  try {
    console.log('Uploading to Cloudinary:', filePath);
    
    // Dynamically import cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary
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
    
    console.log('Cloudinary upload successful:', result.secure_url);
    
    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      path: result.secure_url,
      publicId: result.public_id,
      name: path.basename(filePath),
      type: result.resource_type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Delete local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete successful:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

const createProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
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
        
        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);
        
        // Upload image to Cloudinary if provided
        let imageData = null;
        if (req.file) {
          try {
            const cloudinaryResult = await uploadToCloudinary(req.file.path);
            imageData = {
              path: cloudinaryResult.path,
              publicId: cloudinaryResult.publicId,
              name: req.file.originalname,
              type: req.file.mimetype
            };
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
          }
        }
        
        const newProduct = new ProductModel({
          name: name || "",
          brandName: brandName || "",
          brandRate: brandRate || "good",
          description: description || "",
          manufacturer: manufacturer || "",
          soldPrice: soldPrice ? parseFloat(soldPrice) : 0,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
          expiryDate: expiryDate || new Date(),
          stock: stock ? parseInt(stock) : 0,
          packageSize: packageSize || "kg",
          cartonSize: cartonSize || "",
          categoryId: categoryId || null,
          supplierId: supplierId || null,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 500,
          outOfStockThreshold: 100,
          userId: req.user._id,
          image: imageData ? imageData.path : null,
          imagePublicId: imageData ? imageData.publicId : null
        });
        
        await newProduct.save();
        
        // Populate the saved product for response
        const populatedProduct = await ProductModel.findById(newProduct._id)
          .populate('categoryId', 'name categoryName')
          .populate('supplierId', 'name email');
        
        console.log("Product created successfully:", newProduct._id);
        return res.status(201).json({ 
          success: true, 
          message: "Product added successfully", 
          product: populatedProduct 
        });
      } catch (innerError) {
        console.error("Inner create product error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch(error) {
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { 
      search, 
      categoryName, 
      supplierName, 
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
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (packageSize) filter.packageSize = packageSize;
    if (manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };
    if (brandRate) filter.brandRate = brandRate;
    
    // Price range filters
    if (minPrice || maxPrice) {
      filter.soldPrice = {};
      if (minPrice) filter.soldPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.soldPrice.$lte = parseFloat(maxPrice);
    }
    
    // Stock range filters
    if (minStock || maxStock) {
      filter.stock = {};
      if (minStock) filter.stock.$gte = parseInt(minStock);
      if (maxStock) filter.stock.$lte = parseInt(maxStock);
    }
    
    // Expiry date filters
    if (expiryDateFrom || expiryDateTo) {
      filter.expiryDate = {};
      if (expiryDateFrom) filter.expiryDate.$gte = new Date(expiryDateFrom);
      if (expiryDateTo) filter.expiryDate.$lte = new Date(expiryDateTo);
    }

    // Lookup for categoryName and supplierName
    const categoryMatch = categoryName
      ? { name: { $regex: categoryName, $options: 'i' } }
      : {};
    const supplierMatch = supplierName
      ? { name: { $regex: supplierName, $options: 'i' } }
      : {};

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate query to filter by categoryName and supplierName
    const products = await ProductModel.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier",
        },
      },
      {
        $match: {
          ...(categoryName && { "category.name": { $regex: categoryName, $options: "i" } }),
          ...(supplierName && { "supplier.name": { $regex: supplierName, $options: "i" } }),
        },
      },
      {
        $sort: sortOptions,
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
      {
        $project: {
          name: 1,
          brandName: 1,
          brandRate: 1,
          description: 1,
          manufacturer: 1,
          soldPrice: 1,
          purchasePrice: 1,
          expiryDate: 1,
          stock: 1,
          packageSize: 1,
          cartonSize: 1,
          categoryId: 1,
          supplierId: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          category: { $arrayElemAt: ["$category", 0] },
          supplier: { $arrayElemAt: ["$supplier", 0] },
        },
      },
    ]);

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
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
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

        // Handle image upload to Cloudinary
        if (req.file) {
          // Delete old image from Cloudinary if exists
          if (existingProduct.imagePublicId) {
            try {
              await deleteFromCloudinary(existingProduct.imagePublicId);
            } catch (error) {
              console.error("Error deleting old image from Cloudinary:", error);
            }
          }
          
          // Upload new image to Cloudinary
          try {
            const cloudinaryResult = await uploadToCloudinary(req.file.path);
            updateData.image = cloudinaryResult.path;
            updateData.imagePublicId = cloudinaryResult.publicId;
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
          }
        }
        
        // Convert numeric fields
        if (updateData.soldPrice) updateData.soldPrice = parseFloat(updateData.soldPrice);
        if (updateData.purchasePrice) updateData.purchasePrice = parseFloat(updateData.purchasePrice);
        if (updateData.stock) updateData.stock = parseInt(updateData.stock);
        if (updateData.lowStockThreshold) updateData.lowStockThreshold = parseInt(updateData.lowStockThreshold);
        
        updateData.updatedAt = new Date();
        
        const updatedProduct = await ProductModel.findByIdAndUpdate(
          id, 
          updateData,
          { new: true, runValidators: true }
        ).populate('categoryId', 'name categoryName')
         .populate('supplierId', 'name email');
        
        return res.status(200).json({ 
          success: true, 
          message: "Product updated successfully", 
          product: updatedProduct 
        });
      } catch (innerError) {
        console.error("Inner update product error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found"});
    }
    
    // Role-based access control
    if (req.user.role !== 'admin' && existingProduct.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied"});
    }

    // Delete image from Cloudinary if exists
    if (existingProduct.imagePublicId) {
      try {
        await deleteFromCloudinary(existingProduct.imagePublicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }
    
    // Soft delete by setting isActive to false
    const deletedProduct = await ProductModel.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    return res.status(200).json({ success: true, message: "Product deleted successfully"});
    
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Server error"});
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id)
      .populate('categoryId', 'name categoryName')
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
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct
};
