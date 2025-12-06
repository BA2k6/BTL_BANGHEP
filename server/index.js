// /server/index.js ĐÃ SỬA
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

require('./config/db.config'); 

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes'); 
const stockInRoutes = require('./routes/stockInRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); 
app.use(express.json());

// ============================================================
// ĐỊNH NGHĨA ROUTES (API)
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ánh xạ /api/customers (bao gồm cả /api/customers/phone/:phone)
app.use('/api/customers', customerRoutes); 

// Ánh xạ /api (cho /api/admin/users và /api/users/profile)
app.use('/api', userRoutes); 

app.use('/api/stockin', stockInRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/employees', employeeRoutes);

app.get('/', (req, res) => res.send(`Store Management API is running on port ${PORT}`));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));