import fs from "fs";
import multer from "multer";
import path from "path";
import SupplierModal from "../models/Supplier.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/suppliers/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).array('licenses', 5);

// Helper function to upload to Cloudinary using dynamic import
const uploadToCloudinary = async (filePath, folder = "supplier-licenses") => {
  try {
    console.log('Uploading to Cloudinary:', filePath);
    
    // Dynamically import cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true
    });
    

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      path: result.secure_url,
      publicId: result.public_id,
      name: path.basename(filePath),
      type: result.resource_type === 'image' ? `image/${result.format}` : 'application/pdf'
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    await cloudinary.uploader.destroy(publicId);
   
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

const createSupplier = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { name, email, phone, address, description, tinNumber, accounts } = req.body;
        
        console.log("Request body:", req.body);
        console.log("Uploaded files:", req.files);
        
        // Upload files to Cloudinary
        const licenses = [];
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            try {
              const cloudinaryResult = await uploadToCloudinary(file.path);
              licenses.push({
                name: file.originalname,
                path: cloudinaryResult.path,
                publicId: cloudinaryResult.publicId,
                type: file.mimetype
              });
            } catch (uploadError) {
              console.error("Cloudinary upload error for file:", file.originalname, uploadError);
              // Continue with other files even if one fails
            }
          }
        }
        
        // Parse accounts JSON
        let parsedAccounts = [];
        try {
          parsedAccounts = accounts ? JSON.parse(accounts) : [];
        } catch (error) {
          console.error("Accounts parse error:", error);
          return res.status(400).json({ success: false, message: "Invalid accounts format" });
        }

        // Ensure at least one account is default if accounts exist
        if (parsedAccounts.length > 0 && !parsedAccounts.some(acc => acc.isDefault)) {
          parsedAccounts[0].isDefault = true;
        }

        // const supplierEmail = email && email.trim() !== "" ? email : null;

        const newSupplier = new SupplierModal({
          name: name || "", 
          email: email || "",
          phone: phone || "", 
          address: address || "",
          description: description || "",
          tinNumber: tinNumber || "",
          licenses,
          accounts: parsedAccounts,
          userId: req.user._id
        });
        
        await newSupplier.save();
        console.log("Supplier created successfully:", newSupplier._id);
        return res.status(201).json({ success: true, message: "Supplier added successfully", supplier: newSupplier });
      } catch (innerError) {
        console.error("Inner create supplier error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch(error) {
    console.error("Create supplier error:", error);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

const getSuppliers = async(req, res) => {
  try {
    const { search } = req.query;
    let filter = {  };
    
    if(search){
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
         
          { phone: { $regex: search, $options: 'i' } },
          { tinNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const suppliers = await SupplierModal.find(filter);
    return res.status(200).json({ success: true, suppliers, total: suppliers.length });
  } catch (error) {
    console.error("Get suppliers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSupplier = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { id } = req.params;
        const { name, email, phone, address, description, tinNumber, accounts, licensesToDelete } = req.body;
        
        const existingSupplier = await SupplierModal.findById(id);
        if (!existingSupplier) {
          return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        // Delete removed licenses from Cloudinary
        if (licensesToDelete) {
          try {
            const licensesToDeleteArray = JSON.parse(licensesToDelete);
            for (const licenseId of licensesToDeleteArray) {
              const license = existingSupplier.licenses.id(licenseId);
              if (license && license.publicId) {
                await deleteFromCloudinary(license.publicId);
              }
            }
          } catch (error) {
            console.error("Error deleting licenses:", error);
          }
        }

        // Upload new files to Cloudinary
        const newLicenses = [];
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            try {
              const cloudinaryResult = await uploadToCloudinary(file.path);
              newLicenses.push({
                name: file.originalname,
                path: cloudinaryResult.path,
                publicId: cloudinaryResult.publicId,
                type: file.mimetype
              });
            } catch (uploadError) {
              console.error("Cloudinary upload error for file:", file.originalname, uploadError);
            }
          }
        }

        // Filter out deleted licenses and add new ones
        let allLicenses = existingSupplier.licenses;
        if (licensesToDelete) {
          const licensesToDeleteArray = JSON.parse(licensesToDelete);
          allLicenses = allLicenses.filter(license => !licensesToDeleteArray.includes(license._id.toString()));
        }
        allLicenses = [...allLicenses, ...newLicenses];

        // Parse accounts JSON
        let parsedAccounts = [];
        try {
          parsedAccounts = accounts ? JSON.parse(accounts) : existingSupplier.accounts;
        } catch (error) {
          return res.status(400).json({ success: false, message: "Invalid accounts format" });
        }

        // Ensure at least one account is default if accounts exist
        if (parsedAccounts.length > 0 && !parsedAccounts.some(acc => acc.isDefault)) {
          parsedAccounts[0].isDefault = true;
        }

        const updatedSupplier = await SupplierModal.findByIdAndUpdate(
          id, 
          {
            name: name || "",
            email: email || "",
            phone: phone || "",
            address: address || "",
            description: description || "",
            tinNumber: tinNumber || "",
            licenses: allLicenses,
            accounts: parsedAccounts,
            updatedAt: new Date()
          },
          { new: true }
        );
        
        return res.status(200).json({ success: true, message: "Supplier updated successfully", supplier: updatedSupplier });
      } catch (innerError) {
        console.error("Inner update supplier error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch (error) {
    console.error("Update supplier error:", error);
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
    const supplier = await SupplierModal.findById(id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Delete all license files from Cloudinary
    for (const license of supplier.licenses) {
      if (license.publicId) {
        try {
          await deleteFromCloudinary(license.publicId);
        } catch (error) {
          console.error("Error deleting file from Cloudinary:", error);
        }
      }
    }

    await SupplierModal.findByIdAndDelete(id);
    
    return res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Delete supplier error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createSupplier, deleteSupplier, getSupplierById, getSuppliers, updateSupplier };
