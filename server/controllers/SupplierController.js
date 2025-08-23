import multer from "multer";
import path from "path";
import SupplierModal from "../models/Supplier.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).array('licenses', 5); // Allow up to 5 license files

const createSupplier = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { name, email, phone, address, tinNumber, accountName, accountNumber } = req.body;
      
      const existingSupplier = await SupplierModal.findOne({ 
        $or: [{ email }, { tinNumber }] 
      });
      
      if (existingSupplier) {
        return res.status(400).json({ success: false, message: "Supplier already exists" });
      }

      // Get file paths
      const licenses = req.files ? req.files.map(file => file.path) : [];

      const newSupplier = new SupplierModal({
        name, 
        email, 
        phone, 
        address,
        tinNumber,
        licenses,
        account: {
          name: accountName,
          number: accountNumber
        }
      });
      
      await newSupplier.save();
      return res.status(201).json({ success: true, message: "Supplier added successfully" });
    });
  } catch(error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSuppliers = async(req, res) => {
  try {
    const suppliers = await SupplierModal.find();
    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSupplier = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { id } = req.params;
      const { name, email, phone, address, tinNumber, accountName, accountNumber } = req.body;
      
      const existingSupplier = await SupplierModal.findById(id);
      if (!existingSupplier) {
        return res.status(404).json({ success: false, message: "Supplier not found" });
      }

      // Check if email or TIN number already exists for another supplier
      const duplicate = await SupplierModal.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [{ email }, { tinNumber }] }
        ]
      });
      
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Email or TIN number already exists" });
      }

      // Get file paths
      const newLicenses = req.files ? req.files.map(file => file.path) : [];
      const allLicenses = [...existingSupplier.licenses, ...newLicenses];

      const updatedSupplier = await SupplierModal.findByIdAndUpdate(
        id, 
        {
          name,
          email,
          phone,
          address,
          tinNumber,
          licenses: allLicenses,
          account: {
            name: accountName,
            number: accountNumber
          }
        },
        { new: true }
      );
      
      return res.status(200).json({ success: true, message: "Supplier updated successfully", supplier: updatedSupplier });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierModal.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    
    return res.status(200).json({ success: true, supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await SupplierModal.findByIdAndDelete(id);
    
    if (!deletedSupplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    
    return res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createSupplier, deleteSupplier, getSupplierById, getSuppliers, updateSupplier };

