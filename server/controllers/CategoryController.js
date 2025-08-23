import CategoryModel from "../models/Category.js";
const createCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription } = req.body;
      
        const existigCategory= await CategoryModel.findOne({ categoryName});
        if(existigCategory){
            return res.statu(400).json({ success: false, message: "Category already exists"});

        }
       const newCategroy = new CategoryModel({categoryName,categoryDescription,
       });
       await newCategroy.save();
       return res.status(201).json( { success: true, message: "category added successfull"})

    } catch( error) {
        return res.status(500).json({ success: false, message: "Server error"})
    }
};

const getCategories = async(req, res) =>{
    try {
        const categories= await CategoryModel.find();
        return  res.status(200).json({ success: false, categories})
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"})
    }
};

const UpdateCategories =async (req, res) =>{
    try {
        const  {id } = req.params;
       
        const { categoryName, categoryDescription } = req.body;
         const existigCategory= await CategoryModel.findById(id);
          
        if(!existigCategory){
            return res.statu(400).json({ success: false, message: "Category not found"});

        }
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id, {
                categoryName,categoryDescription
            },
            {new: true}
        )
        // existigCategory.categoryName = categoryName ||   existigCategory.categoryName;
        // existigCategory.categoryDescription = categoryDescription ||   existigCategory.categoryDescription;
        // await existigCategory.save();
        return res.status(200).json({ success: true, message: "Category update succesfully"})
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Server error"})
    }
}
export { createCategory, getCategories, UpdateCategories };
