import mongoose from "mongoose";

const ProduceSchema = new mongoose.Schema({ 
    name: { type: String, require: true },
    brandName: { type: String },
    description: { type: String, required: true },
    manufacturer: { type: String},
    price: { type: String, required: true },
    supplierPrice: { type: String, required: true },
    expiryDate: { type: Date, required: true},
    stock: { type: String, required: true },
    lowStockThreshold: { type: Number, default: 10 }, // Alert when stock goes below this
    image: { type: String },
    packageSize: { 
        type: String, 
        required: true,
        enum: ['kg', 'box', 'bottle', 'pack', 'unit']
    },
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "Category", require: true},
    supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "Supplier", require: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", require: true}, // Track which user added this product
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ProduceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const ProductModal = mongoose.model("Product", ProduceSchema);

export default ProductModal;
