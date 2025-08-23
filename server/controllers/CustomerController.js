import multer from "multer";
import path from "path";
import CustomerModal from "../models/Customer.js";

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

const createCustomer = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { 
        name, 
        address, 
        companyName, 
        tinNumber, 
        phone, 
        receiverName,
        receiverPhone,
        receiverAddress,
        withhold 
      } = req.body;
      
      const existingCustomer = await CustomerModal.findOne({ 
        $or: [{ phone }, { tinNumber }] 
      });
      
      if (existingCustomer) {
        return res.status(400).json({ success: false, message: "Customer already exists" });
      }

      // Get file paths
      const licenses = req.files ? req.files.map(file => file.path) : [];

      const newCustomer = new CustomerModal({
        name, 
        address, 
        companyName, 
        tinNumber, 
        phone,
        licenses,
        receiverInfo: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddress
        },
        withhold: withhold === 'true'
      });
      
      await newCustomer.save();
      return res.status(201).json({ success: true, message: "Customer added successfully" });
    });
  } catch(error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCustomers = async(req, res) => {
  try {
    const customers = await CustomerModal.find();
    return res.status(200).json({ success: true, customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCustomer = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { id } = req.params;
      const { 
        name, 
        address, 
        companyName, 
        tinNumber, 
        phone, 
        receiverName,
        receiverPhone,
        receiverAddress,
        withhold 
      } = req.body;
      
      const existingCustomer = await CustomerModal.findById(id);
      if (!existingCustomer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      // Check if phone or TIN number already exists for another customer
      const duplicate = await CustomerModal.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [{ phone }, { tinNumber }] }
        ]
      });
      
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Phone or TIN number already exists" });
      }

      // Get file paths
      const newLicenses = req.files ? req.files.map(file => file.path) : [];
      const allLicenses = [...existingCustomer.licenses, ...newLicenses];

      const updatedCustomer = await CustomerModal.findByIdAndUpdate(
        id, 
        {
          name,
          address,
          companyName,
          tinNumber,
          phone,
          licenses: allLicenses,
          receiverInfo: {
            name: receiverName,
            phone: receiverPhone,
            address: receiverAddress
          },
          withhold: withhold === 'true'
        },
        { new: true }
      );
      
      return res.status(200).json({ success: true, message: "Customer updated successfully", customer: updatedCustomer });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await CustomerModal.findByIdAndDelete(id);
    
    if (!deletedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    
    return res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModal.findById(id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    
    return res.status(200).json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createCustomer, deleteCustomer, getCustomerById, getCustomers, updateCustomer };

