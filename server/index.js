import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import connectDB from './db/connection.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/category.js';
import customerRoutes from './routes/customer.js';
import dashboardRoutes from './routes/dashboard.js';
import excelRoutes from './routes/excel.js';
import notificationRoutes from './routes/notification.js';
import productRoutes from './routes/product.js';
import SalesOrderRoutes from './routes/salesOrder.js';
import supplierRoutes from './routes/supplier.js';

// Load environment variables FIRST
dotenv.config();

console.log('Cloudinary Config Check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'missing',
  has_secret: !!process.env.CLOUDINARY_API_SECRET
});

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add this route to handle image serving
app.get('/api/product/image/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ success: false, message: "Image not found" });
  }
});
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/product', productRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/sales-order', SalesOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/excel', excelRoutes);

app.listen(process.env.PORT || 5000, () => {
  connectDB();
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});