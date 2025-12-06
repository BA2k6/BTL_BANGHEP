// server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ============================================================
// 1. CÁC ROUTE CỤ THỂ (STATIC ROUTES) - PHẢI ĐẶT TRÊN CÙNG
// ============================================================

// Route lấy danh sách biến thể (QUAN TRỌNG: Đặt ở đây để không bị nhầm với :id)
router.get('/variants', productController.listVariants);


// ============================================================
// 2. CÁC ROUTE KHÁC (BASE ROUTES)
// ============================================================

router.get('/', productController.listProducts);
router.post('/', productController.createProduct);


// ============================================================
// 3. CÁC ROUTE CÓ THAM SỐ ĐỘNG (:id) - PHẢI ĐẶT DƯỚI CÙNG
// ============================================================

// Lấy chi tiết 1 sản phẩm
router.get('/:id', productController.getProduct); 

// Cập nhật thông tin sản phẩm (Tên, giá, mô tả...)
router.put('/:id', productController.updateProduct);

// Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

// --- MỚI: Route đổi trạng thái nhanh (Toggle Active/Inactive) ---
// Method PATCH được dùng vì chỉ cập nhật 1 trường dữ liệu
router.patch('/:id/status', productController.toggleProductStatus);

module.exports = router;