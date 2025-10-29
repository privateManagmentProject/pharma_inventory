import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({ 
    name: { type: String },
    brandName: { type: String },
    brandRate: { 
        type: String, 
        enum: ['good', 'very good', 'excellent'],
        default: 'good'
    },
    description: { type: String },
    manufacturer: { type: String},
    soldPrice: { type: Number }, // Changed to Number
    purchasePrice: { type: Number }, // Changed to Number
    expiryDate: { type: Date},
    stock: { type: Number }, // Changed to Number
    lowStockThreshold: { type: Number, default: 500 },
    outOfStockThreshold: { type: Number, default: 100 },

    image: { type: String },
    packageSize: { 
        type: String, 
        required: true,
        enum: ['kg', 'box', 'bottle', 'pack', 'pk','tube','vial', 'ampoule','glass','plastic','syrings','sachet','aerosol','spray','bottle','bag','roll','cops','carton','tin','cans','pouches'] // Match sales order enum
    },
    cartonSize: { type: String },
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "Category"},
    supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "Supplier"},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
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