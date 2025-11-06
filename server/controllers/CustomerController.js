import fs from "fs";
import multer from "multer";
import path from "path";
import CustomerModal from "../models/Customer.js";
import { exportCustomersToExcel, importCustomersFromExcel } from "../util/customerImportExport.js";

// Temporary disk storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/customers/';
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
const uploadToCloudinary = async (filePath, folder = "customer-licenses") => {
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
    
    console.log('Cloudinary upload successful:', result.secure_url);
    
    // Delete local file after successful upload
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
    
    // Delete local file if upload fails
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
    console.log('Cloudinary delete successful:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

const createCustomer = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { 
          name, 
          email,
          phone, 
          companyName, 
          tinNumber, 
          description,
          receiverName,
          receiverPhone,
          receiverAddress,
          withhold,
          withholdPhone,
          region,
          zone,
          woreda,
          kebele
        } = req.body;
        
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
            }
          }
        }
        
        const newCustomer = new CustomerModal({
          name: name || "", 
          email: email || "",
          phone: phone || "",
          address: {
            region: region || "",
            zone: zone || "",
            woreda: woreda || "",
            kebele: kebele || ""
          },
          companyName: companyName || "",
          tinNumber: tinNumber || "",
          description: description || "",
          licenses,
          receiverInfo: {
            name: receiverName || "",
            phone: receiverPhone || "",
            address: receiverAddress || ""
          },
          withhold: withhold === 'true',
          withholdPhone: withholdPhone || "",
          userId: req.user._id
        });
        
        await newCustomer.save();
        console.log("Customer created successfully:", newCustomer._id);
        return res.status(201).json({ success: true, message: "Customer added successfully", customer: newCustomer });
      } catch (innerError) {
        console.error("Inner create customer error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch(error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

const getCustomers = async(req, res) => {
  try {
    const { search } = req.query;
    let filter = {  };
    
    if(search){
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { tinNumber: { $regex: search, $options: 'i' } },
          { "address.region": { $regex: search, $options: 'i' } },
          { "address.zone": { $regex: search, $options: 'i' } },
          { "address.woreda": { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const customers = await CustomerModal.find(filter);
    return res.status(200).json({ success: true, customers, total: customers.length });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateCustomer = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { id } = req.params;
        const { 
          name, 
          email,
          phone, 
          companyName, 
          tinNumber, 
          description,
          receiverName,
          receiverPhone,
          receiverAddress,
          withhold,
          withholdPhone,
          region,
          zone,
          woreda,
          kebele,
          licensesToDelete 
        } = req.body;
        
        const existingCustomer = await CustomerModal.findById(id);
        if (!existingCustomer) {
          return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // Delete removed licenses from Cloudinary
        if (licensesToDelete) {
          try {
            const licensesToDeleteArray = JSON.parse(licensesToDelete);
            for (const licenseId of licensesToDeleteArray) {
              const license = existingCustomer.licenses.id(licenseId);
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
        let allLicenses = existingCustomer.licenses;
        if (licensesToDelete) {
          const licensesToDeleteArray = JSON.parse(licensesToDelete);
          allLicenses = allLicenses.filter(license => !licensesToDeleteArray.includes(license._id.toString()));
        }
        allLicenses = [...allLicenses, ...newLicenses];

        const updatedCustomer = await CustomerModal.findByIdAndUpdate(
          id, 
          {
            name: name || "",
            email: email || "",
            phone: phone || "",
            address: {
              region: region || "",
              zone: zone || "",
              woreda: woreda || "",
              kebele: kebele || ""
            },
            companyName: companyName || "",
            tinNumber: tinNumber || "",
            description: description || "",
            licenses: allLicenses,
            receiverInfo: {
              name: receiverName || "",
              phone: receiverPhone || "",
              address: receiverAddress || ""
            },
            withhold: withhold === 'true',
            withholdPhone: withholdPhone || "",
            updatedAt: new Date()
          },
          { new: true }
        );
        
        return res.status(200).json({ success: true, message: "Customer updated successfully", customer: updatedCustomer });
      } catch (innerError) {
        console.error("Inner update customer error:", innerError);
        return res.status(500).json({ success: false, message: "Server error: " + innerError.message });
      }
    });
  } catch (error) {
    console.error("Update customer error:", error);
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

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModal.findById(id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Delete all license files from Cloudinary
    for (const license of customer.licenses) {
      if (license.publicId) {
        try {
          await deleteFromCloudinary(license.publicId);
        } catch (error) {
          console.error("Error deleting file from Cloudinary:", error);
        }
      }
    }

    await CustomerModal.findByIdAndDelete(id);
    
    return res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Import/Export functions remain the same
const importCustomers = async (req, res) => {
  try {
    console.log('Import request received, file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await importCustomersFromExcel(req.file.buffer, req.user._id);
    
    return res.status(200).json({
      success: true,
      message: `Import completed. Successfully imported ${result.importedCount} customers. ${result.errorCount} errors occurred.`,
      ...result
    });
  } catch (error) {
    console.error("Import customers error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to import customers" 
    });
  }
};

const exportCustomers = async (req, res) => {
  try {
    console.log('Export request received for user:', req.user._id);
    
    const excelBuffer = await exportCustomersToExcel(req.user._id);
    
    if (!excelBuffer || excelBuffer.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No data available to export" 
      });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${Date.now()}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log('Sending Excel file, size:', excelBuffer.length);
    return res.send(excelBuffer);
  } catch (error) {
    console.error("Export customers error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to export customers" 
    });
  }
};

export { createCustomer, deleteCustomer, exportCustomers, getCustomerById, getCustomers, importCustomers, updateCustomer };
