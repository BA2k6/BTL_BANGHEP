const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');

// 1. Lấy danh sách phiếu nhập (Master)
router.get('/', stockInController.listStockInReceipts); 

// 2. Lấy chi tiết 1 phiếu cụ thể (Cho Modal Xem Chi Tiết)
// Dòng này chính là dòng gây lỗi nếu Controller không có hàm getReceiptDetails
router.get('/:id/details', stockInController.getReceiptDetails); 

// 3. Lấy toàn bộ items (flat list - optional)
router.get('/items', stockInController.listStockInItems);

// 4. Tạo phiếu nhập (Bulk)
router.post('/create-receipt', stockInController.createStockInReceipt);

// 5. Xóa dòng chi tiết
router.delete('/items/:id', stockInController.deleteStockInItem);

module.exports = router;