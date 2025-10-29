import mongoose from "mongoose";
 const categorySchema = new mongoose.Schema({ 
    categoryName: { type: String, unique: true },
    categoryDescription: { type: String },
     createdAt: { type: Date, default: Date.now }
    
 });

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
