// [file name]: customerImportExport.js
import XLSX from 'xlsx';
import CustomerModal from '../models/Customer.js';

// Function to export customers to Excel format
export const exportCustomersToExcel = async (userId) => {
  try {
    console.log('Exporting customers for user:', userId);
    const customers = await CustomerModal.find({ userId });
    console.log('Found customers for export:', customers.length);
    
    if (customers.length === 0) {
      throw new Error('No customers found to export');
    }

    // Transform data to match Excel format - using the exact column names from your Excel
    const excelData = customers.map(customer => ({
      'Customer': customer.name || '',
      'City': customer.address || '',
      'Contact': customer.phone || '',
      'Contact Person': customer.receiverInfo?.name || '',
      'Remark': customer.description || ''
    }));

    console.log('Excel data prepared:', excelData.length, 'rows');

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'buffer',
      cellStyles: true 
    });
    
    console.log('Excel buffer created, size:', excelBuffer.length);
    return excelBuffer;
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export customers: ' + error.message);
  }
};

// Function to import customers from Excel
export const importCustomersFromExcel = async (fileBuffer, userId) => {
  try {
    console.log('Starting import process...');
    
    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellText: false,
      cellDates: true 
    });
    
    console.log('Workbook sheets:', workbook.SheetNames);
    
    let allData = [];
    
    // Process all sheets
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the range of the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Convert to JSON - skip header rows by checking content
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: ['A', 'B', 'C', 'D', 'E'], // Map columns A-E
        range: 0, // Start from first row
        blankrows: false,
        defval: ''
      });
      
      console.log(`Sheet ${sheetName} raw data length:`, data.length);
      
      // Filter out header rows and empty rows
      const validData = data.filter(row => {
        const customerName = row.A;
        // Skip rows that are headers or empty
        return customerName && 
               customerName !== 'Customer' && 
               !customerName.includes('Customer List') &&
               !customerName.includes('Facility Name') &&
               typeof customerName === 'string' &&
               customerName.trim().length > 0;
      });
      
      console.log(`Sheet ${sheetName} valid data:`, validData.length);
      
      // Transform to our expected format
      const transformedData = validData.map(row => ({
        Customer: row.A || '',
        City: row.B || '',
        Contact: row.C || '',
        'Contact Person': row.D || '',
        Remark: row.E || ''
      }));
      
      allData = [...allData, ...transformedData];
    });
    
    console.log('Total valid rows found:', allData.length);

    const importedCustomers = [];
    const errors = [];
    let processedCount = 0;

    for (const row of allData) {
      processedCount++;
      try {
        // Skip if no customer name
        if (!row.Customer || row.Customer.trim() === '') {
          errors.push(`Row ${processedCount}: Missing customer name`);
          continue;
        }

        // Extract phone numbers (handle multiple numbers separated by /)
        const contactNumbers = row.Contact ? 
          row.Contact.toString().split('/').map(num => num.trim()).filter(num => num.length > 0) 
          : [];
        
        const primaryPhone = contactNumbers[0] || `NO_PHONE_${Date.now()}_${processedCount}`;

        // Generate TIN number from customer name and timestamp
        const tinNumber = `TIN_${row.Customer.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;

        // Create new customer
        const newCustomer = new CustomerModal({
          name: row.Customer.trim(),
          address: row.City?.toString()?.trim() || 'Not specified',
          companyName: row.Customer.trim(), // Using customer name as company name
          tinNumber: tinNumber,
          phone: primaryPhone,
          description: row.Remark?.toString()?.trim() || '',
          licenses: [],
          receiverInfo: {
            name: row['Contact Person']?.toString()?.trim() || row.Customer.trim(),
            phone: primaryPhone,
            address: row.City?.toString()?.trim() || 'Not specified'
          },
          withhold: false,
          userId: userId
        });

        const savedCustomer = await newCustomer.save();
        importedCustomers.push(savedCustomer);
        console.log(`Imported customer: ${savedCustomer.name}`);
        
      } catch (error) {
        console.error(`Error importing row ${processedCount}:`, error);
        errors.push(`Row ${processedCount}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      importedCount: importedCustomers.length,
      errorCount: errors.length,
      errors,
      importedCustomers
    };

    console.log('Import result:', result);
    return result;

  } catch (error) {
    console.error('Import process error:', error);
    throw new Error('Failed to import customers: ' + error.message);
  }
};
