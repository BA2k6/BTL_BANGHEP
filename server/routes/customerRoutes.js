const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// 🔍 Tìm khách hàng theo số điện thoại
router.get('/phone/:phone', customerController.getCustomerByPhone);

// Danh sách khách hàng
router.get('/', customerController.listCustomers);

// Xem chi tiết 1 khách hàng + lịch sử mua hàng
router.get('/:id', customerController.getCustomerDetail);

// Cập nhật thông tin khách hàng
router.put('/:id', customerController.updateCustomer);

// Thêm khách hàng & tài khoản
router.post('/register', customerController.registerCustomer);

module.exports = router;