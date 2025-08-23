import mongoose from "mongoose";
 const ProduceSchema = new mongoose.Schema({ 
    name: { type: String, require: true },
    brandName: { type: String },
    description: { type: String, required: true },
    manufacturer: { type: String},
    price: { type: String, required: true },
    supplierPrice: { type: String, required: true },
    expiryDate: { type: Date, required: true},
    stock :{ type: String, required: true },
   packageSize: { 
  type: String, 
  required: true,
  enum: ['kg', 'box', 'bottle', 'pack', 'unit'] // Add your desired package types
},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "Category", require: true},
    supplierId: {type: mongoose.Schema.Types.ObjectId, ref: "Supplier", require: true}
   
 });

const ProductModal = mongoose.model("Product", ProduceSchema);

export default ProductModal;
