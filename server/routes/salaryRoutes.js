// /server/routes/salaryRoutes.js
const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/', salaryController.listSalaries); // Endpoint GET /api/salaries
// Lấy chi tiết 1 bản lương
router.get('/:id', salaryController.getSalary);
// Tính lương cho tháng (body or query: month=YYYY-MM)
router.post('/calculate', salaryController.calculateSalaries);

// Cập nhật chi tiết 1 bản lương (bonus, deductions, sales_commission, base_salary)
router.patch('/:id', salaryController.updateSalary);

// Đánh dấu đã trả
router.patch('/:id/pay', salaryController.paySalary);

// Xóa bảng lương
router.delete('/:id', salaryController.deleteSalary);

module.exports = router;