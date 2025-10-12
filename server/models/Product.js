import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    brandName: { type: String },
    brandRate: { 
        type: String, 
        enum: ['good', 'very good', 'excellent'],
        default: 'good'
    },
    description: { type: String, required: true },
    manufacturer: { type: String},
    soldPrice: { type: String, required: true }, // Changed from price
    purchasePrice: { type: String, required: true }, // Changed from supplierPrice
    expiryDate: { type: Date, required: true},
    stock: { type: String, required: true },
    lowStockThreshold: { type: Number, default: 500 }, // Changed to 500
    outOfStockThreshold: { type: Number, default: 100 }, // Added out of stock threshold
    image: { type: String },
    packageSize: { 
        type: String, 
        required: true,
        enum: ['carton', 'box', 'bottle', 'pack', 'strip'] // Removed 'unit', added 'carton', 'strip'
    },
    cartonSize: { type: String }, // New field for carton size
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true},
    supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ProductSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function() {
    const stock = parseInt(this.stock);
    if (stock <= this.outOfStockThreshold) return 'out';
    if (stock <= this.lowStockThreshold) return 'low';
    return 'available';
});

const ProductModel = mongoose.model("Product", ProductSchema);

export default ProductModel;