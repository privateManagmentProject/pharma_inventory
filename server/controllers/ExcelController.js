import fs from "fs";
import multer from "multer";
import xlsx from "xlsx";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/excel/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
}).single('file');

// Import customers from Excel
const importCustomers = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Map Excel columns to customer fields
          const customerData = {
            name: row['Name'] || row['Customer Name'] || '',
            address: row['Address'] || '',
            companyName: row['Company Name'] || row['Company'] || '',
            tinNumber: row['TIN Number'] || row['TIN'] || '',
            phone: row['Phone'] || row['Phone Number'] || '',
            description: row['Description'] || '',
            receiverInfo: {
              name: row['Receiver Name'] || row['Contact Person'] || '',
              phone: row['Receiver Phone'] || row['Contact Phone'] || '',
              address: row['Receiver Address'] || row['Delivery Address'] || ''
            },
            withhold: row['Withhold'] === 'Yes' || row['Withhold'] === true,
            userId: req.user._id,
            isActive: true
          };

          // Validate required fields
          if (!customerData.name || !customerData.address || !customerData.companyName) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: Missing required fields (Name, Address, Company Name)`);
            continue;
          }

          // Check if customer already exists
          const existingCustomer = await Customer.findOne({ 
            name: customerData.name, 
            userId: req.user._id 
          });

          if (existingCustomer) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: Customer "${customerData.name}" already exists`);
            continue;
          }

          const newCustomer = new Customer(customerData);
          await newCustomer.save();
          results.success++;

        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        message: `Import completed. ${results.success} customers imported, ${results.failed} failed.`,
        results
      });
    });
  } catch (error) {
    console.error("Import customers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Import suppliers from Excel
const importSuppliers = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Map Excel columns to supplier fields
          const supplierData = {
            name: row['Name'] || row['Supplier Name'] || '',
            email: row['Email'] || '',
            phone: row['Phone'] || row['Phone Number'] || '',
            address: row['Address'] || '',
            description: row['Description'] || '',
            tinNumber: row['TIN Number'] || row['TIN'] || '',
            licenses: [],
            accounts: [],
            userId: req.user._id,
            isActive: true
          };

          // Validate required fields
          if (!supplierData.name || !supplierData.email || !supplierData.address) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: Missing required fields (Name, Email, Address)`);
            continue;
          }

          // Check if supplier already exists
          const existingSupplier = await Supplier.findOne({ 
            email: supplierData.email 
          });

          if (existingSupplier) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: Supplier with email "${supplierData.email}" already exists`);
            continue;
          }

          const newSupplier = new Supplier(supplierData);
          await newSupplier.save();
          results.success++;

        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        message: `Import completed. ${results.success} suppliers imported, ${results.failed} failed.`,
        results
      });
    });
  } catch (error) {
    console.error("Import suppliers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export customers to Excel
const exportCustomers = async (req, res) => {
  try {
    let filter = { isActive: true };
    
    // Role-based filtering
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }

    const customers = await Customer.find(filter).populate('userId', 'name');

    // Prepare data for Excel
    const excelData = customers.map(customer => ({
      'Customer Name': customer.name,
      'Company Name': customer.companyName,
      'Address': customer.address,
      'Phone': customer.phone,
      'TIN Number': customer.tinNumber,
      'Description': customer.description,
      'Contact Person': customer.receiverInfo.name,
      'Contact Phone': customer.receiverInfo.phone,
      'Delivery Address': customer.receiverInfo.address,
      'Withhold': customer.withhold ? 'Yes' : 'No',
      'Created By': customer.userId?.name || 'Unknown',
      'Created Date': customer.createdAt.toLocaleDateString()
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Company Name
      { wch: 30 }, // Address
      { wch: 15 }, // Phone
      { wch: 15 }, // TIN Number
      { wch: 30 }, // Description
      { wch: 20 }, // Contact Person
      { wch: 15 }, // Contact Phone
      { wch: 30 }, // Delivery Address
      { wch: 10 }, // Withhold
      { wch: 15 }, // Created By
      { wch: 15 }  // Created Date
    ];
    worksheet['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Customers');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Export customers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export suppliers to Excel
const exportSuppliers = async (req, res) => {
  try {
    let filter = { isActive: true };
    
    // Role-based filtering
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }

    const suppliers = await Supplier.find(filter).populate('userId', 'name');

    // Prepare data for Excel
    const excelData = suppliers.map(supplier => ({
      'Supplier Name': supplier.name,
      'Email': supplier.email,
      'Phone': supplier.phone,
      'Address': supplier.address,
      'Description': supplier.description,
      'TIN Number': supplier.tinNumber,
      'Created By': supplier.userId?.name || 'Unknown',
      'Created Date': supplier.createdAt.toLocaleDateString()
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Supplier Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 30 }, // Address
      { wch: 30 }, // Description
      { wch: 15 }, // TIN Number
      { wch: 15 }, // Created By
      { wch: 15 }  // Created Date
    ];
    worksheet['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Suppliers');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Export suppliers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Excel template for customers
const getCustomerTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        'Customer Name': 'John Doe',
        'Company Name': 'ABC Company',
        'Address': '123 Main Street, City',
        'Phone': '+1234567890',
        'TIN Number': '123456789',
        'Description': 'Regular customer',
        'Contact Person': 'Jane Smith',
        'Contact Phone': '+1234567891',
        'Delivery Address': '123 Main Street, City',
        'Withhold': 'No'
      }
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, 
      { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, 
      { wch: 30 }, { wch: 10 }
    ];
    worksheet['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Customer Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Get customer template error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Excel template for suppliers
const getSupplierTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        'Supplier Name': 'XYZ Suppliers',
        'Email': 'contact@xyzsuppliers.com',
        'Phone': '+1234567890',
        'Address': '456 Business Ave, City',
        'Description': 'Medical supplies supplier',
        'TIN Number': '987654321'
      }
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, 
      { wch: 30 }, { wch: 30 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Supplier Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=supplier-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Get supplier template error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
    exportCustomers,
    exportSuppliers,
    getCustomerTemplate,
    getSupplierTemplate, importCustomers,
    importSuppliers
};

