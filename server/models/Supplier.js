import mongoose from "mongoose";
 const SupplierSchema = new mongoose.Schema({ 
    name: { type: String, require: true },
    email: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    address :{ type: String, required: true },
    createdAt: { type: Date, default: Date.now},
   
 });

const SupplierModal = mongoose.model("Supplier", SupplierSchema);

export default SupplierModal;
