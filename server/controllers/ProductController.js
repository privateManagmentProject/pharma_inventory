import CategoryModal from "../models/Category.js";
import ProductModal from "../models/Product.js";
import SupplierModal from "../models/Supplier.js";
const createProduct = async (req, res) => {
   try {
        const { name, brandName, description, manufacturer, price, supplierPrice, expiryDate, stock, packageSize, categoryId, supplierId } = req.body;
      
        const existingProduct = await ProductModal.findOne({ name });
        if(existingProduct){
            return res.status(400).json({ success: false, message: "Product already exists"});
        }

       const newProduct = new ProductModal({
           name, brandName, description, manufacturer, price, supplierPrice, 
           expiryDate, stock, packageSize, categoryId, supplierId
       });
       
       await newProduct.save();
       return res.status(201).json({ success: true, message: "Product added successfully"});

    } catch(error) {
        return res.status(500).json({ success: false, message: "Server error"});
    }
};

const getProducts = async(req, res) =>{
    try {
        const { search, category, supplier } = req.query;
        let filter = {};
        
        if(search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if(category) {
            filter.categoryId = category;
        }
        if(supplier) {
            filter.supplierId = supplier;
        }

        const products = await ProductModal.find(filter)
            .populate('categoryId')
            .populate('supplierId');
            
        const categories = await CategoryModal.find();
        const suppliers = await SupplierModal.find();
        
        return res.status(200).json({ success: true, products, categories, suppliers });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"});
    }
};
const updateProduct = async (req, res) =>{
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const updatedProduct = await ProductModal.findByIdAndUpdate(
            id, 
            updateData,
            { new: true }
        );
        
        if(!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found"});
        }
        
        return res.status(200).json({ success: true, message: "Product updated successfully"});
        
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"});
    }
}

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedProduct = await ProductModal.findByIdAndDelete(id);
        
        if(!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found"});
        }
        
        return res.status(200).json({ success: true, message: "Product deleted successfully"});
        
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"});
    }
}

export { createProduct, deleteProduct, getProducts, updateProduct };

