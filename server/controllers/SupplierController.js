import SupplierModal from "../models/Supplier.js";
const createSupplier = async (req, res) => {
    try {
        const { name, email, number,address } = req.body;
      
        const existigSupplier= await SupplierModal.findOne({ name});
        if(existigSupplier){
            return res.statu(400).json({ success: false, message: "Supplier already exists"});

        }
       const newSupplier = new SupplierModal({name, email, number,address
       });
       await newSupplier.save();
       return res.status(201).json( { success: true, message: "Supplier added successfull"})

    } catch( error) {
        return res.status(500).json({ success: false, message: "Server error"})
    }
};

const getSuppliers = async(req, res) =>{
    try {
        const supplier= await SupplierModal.find();
        return  res.status(200).json({ success: true, supplier})
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"})
    }
};

const updateSupplier =async (req, res) =>{
    try {
        const  {id } = req.params;
        const { name, email, number,address } = req.body;
         const existigSupplier= await SupplierModal.findOne({ name});
        if(!existigSupplier){
            return res.statu(400).json({ success: false, message: "Supplier not found"});

        }
        const updatedSupplier = await SupplierModal.findByIdAndUpdate(
            id, {
              name: n
            },
            {new: true}
        )
        // existigSupplier.SupplierName = SupplierName ||   existigSupplier.SupplierName;
        // existigSupplier.SupplierDescription = SupplierDescription ||   existigSupplier.SupplierDescription;
        // await existigSupplier.save();
        return res.status(200).json({ success: false, message: "Supplier update succesfully"})
        
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error"})
    }
}
export { createSupplier, getSuppliers, updateSupplier };
