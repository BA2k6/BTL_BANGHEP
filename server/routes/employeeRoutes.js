//C:\Users\Admin\Downloads\DUANWEB(1)\server\routes\employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// 1. Lấy danh sách nhân viên
// GET http://localhost:5000/api/employees
router.get('/', employeeController.getAllEmployees); 

// 2. Tạo nhân viên mới
// POST http://localhost:5000/api/employees/create
router.post('/create', employeeController.createEmployee);

// 3. Cập nhật nhân viên (Sửa)
// PUT http://localhost:5000/api/employees/:id
router.put('/:id', employeeController.updateEmployee);

// 4. Xóa nhân viên
// DELETE http://localhost:5000/api/employees/:id
// router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;