import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({ 
    name: { type: String, default: "" },
    brandName: { type: String, default: "" },
    brandRate: { 
        type: String, 
        enum: ['good', 'very good', 'excellent'],
        default: 'good'
    },
    description: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    soldPrice: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    expiryDate: { type: Date, default: Date.now },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 500 },
    outOfStockThreshold: { type: Number, default: 100 },
    cartonSize: { type: String, default: "" },
    image: { type: String, default: null },
    imagePublicId: { type: String, default: null }, // Cloudinary public_id
    packageSize: { 
        type: String, 
        default: "kg",
        enum: ['kg', 'box', 'bottle', 'pack', 'pk','tube','vial', 'ampoule','glass','plastic','syrings','sachet','aerosol','spray','bottle','bag','roll','cops','carton','tin','cans','pouches']
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
    const stock = this.stock;
    if (stock <= this.outOfStockThreshold) return 'out';
    if (stock <= this.lowStockThreshold) return 'low';
    return 'available';
});

const ProductModel = mongoose.model("Product", ProductSchema);

export default ProductModel;