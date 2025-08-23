import mongoose from "mongoose";
 const categorySchema = new mongoose.Schema({ 
    categoryName: { type: String, required: true, unique: true },
    categoryDescription: { type: String, required: true },
    
 });

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
