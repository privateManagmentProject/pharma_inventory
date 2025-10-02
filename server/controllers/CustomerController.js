import multer from "multer";
import path from "path";
import CustomerModal from "../models/Customer.js";
import { exportCustomersToExcel, importCustomersFromExcel } from "../util/customerImportExport.js";
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
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  }
}).array('licenses', 5);
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

// Update export function with better error handling
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
const importCustomersBulk = async (req, res) => {
  try {
    const { customers } = req.body;
    const userId = req.user._id;

    console.log('Bulk import request received for:', customers?.length, 'customers');

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid customer data" 
      });
    }

    const importedCustomers = [];
    const errors = [];

    // Use bulk insert for better performance
    const customerPromises = customers.map(async (customerData, index) => {
      try {
        // Extract phone numbers
        const contactNumbers = customerData.Contact ? 
          customerData.Contact.toString().split('/').map(num => num.trim()).filter(num => num.length > 0) 
          : [];
        
        const primaryPhone = contactNumbers[0] || `NO_PHONE_${Date.now()}_${index}`;

        // Generate TIN number
        const tinNumber = `TIN_${customerData.Customer.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}_${index}`;

        // Check for duplicates
        const existingCustomer = await CustomerModal.findOne({
          $or: [
            { phone: primaryPhone, userId },
            { name: customerData.Customer.trim(), userId }
          ]
        });

        if (existingCustomer) {
          throw new Error(`Customer already exists: ${customerData.Customer}`);
        }

        // Create customer object
        const customer = {
          name: customerData.Customer.trim(),
          address: customerData.City?.toString()?.trim() || 'Not specified',
          companyName: customerData.Customer.trim(),
          tinNumber: tinNumber,
          phone: primaryPhone,
          description: customerData.Remark?.toString()?.trim() || '',
          licenses: [],
          receiverInfo: {
            name: customerData['Contact Person']?.toString()?.trim() || customerData.Customer.trim(),
            phone: primaryPhone,
            address: customerData.City?.toString()?.trim() || 'Not specified'
          },
          withhold: false,
          userId: userId
        };

        return customer;
      } catch (error) {
        errors.push(`Customer "${customerData.Customer}": ${error.message}`);
        return null;
      }
    });

    // Wait for all customer objects to be created
    const customerObjects = await Promise.all(customerPromises);
    const validCustomers = customerObjects.filter(customer => customer !== null);

    // Bulk insert valid customers
    if (validCustomers.length > 0) {
      const result = await CustomerModal.insertMany(validCustomers, { ordered: false });
      importedCustomers.push(...result);
      console.log(`Successfully imported ${result.length} customers`);
    }

    const result = {
      success: true,
      importedCount: importedCustomers.length,
      errorCount: errors.length,
      errors,
      importedCustomers: importedCustomers.map(c => ({ id: c._id, name: c.name }))
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error("Bulk import error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to import customers" 
    });
  }
};

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
        description,
        receiverName,
        receiverPhone,
        receiverAddress,
        withhold 
      } = req.body;
      
      const existingCustomer = await CustomerModal.findOne({ 
        $or: [{ phone }, { tinNumber }],
        userId: req.user._id
      });
      
      if (existingCustomer) {
        return res.status(400).json({ success: false, message: "Customer already exists" });
      }

       // Process uploaded files
      const licenses = req.files ? req.files.map(file => ({
        name: file.originalname,
        path: file.path,
        type: file.mimetype
      })) : [];
      
      const newCustomer = new CustomerModal({
        name, 
        address, 
        companyName, 
        tinNumber, 
        phone,
        licenses,
        description: description || "",
        receiverInfo: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddress
        },
        withhold: withhold === 'true',
        userId: req.user._id // Track which user created this customer
      });
      
      await newCustomer.save();
      return res.status(201).json({ success: true, message: "Customer added successfully", customer: newCustomer });
    });
  } catch(error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCustomers = async(req, res) => {
  try {
    const { search } = req.query;
     let filter= {}
   if(search){
     filter={
       $or: [
         { name: { $regex: search, $options: 'i' } },
         { companyName: { $regex: search, $options: 'i' } },
         { phone: { $regex: search, $options: 'i' } },
         { tinNumber: { $regex: search, $options: 'i' } }
       ]
     }
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

export { createCustomer, deleteCustomer, exportCustomers, getCustomerById, getCustomers, importCustomers, importCustomersBulk, updateCustomer };

