const stockInModel = require('../models/stockInModel');

const stockInController = {
    // 1. Lấy danh sách phiếu nhập (Master)
    listStockInReceipts: async (req, res) => {
        try {
            const receipts = await stockInModel.getAllStockInReceipts();
            res.status(200).json(receipts);
        } catch (error) {
            console.error("Lỗi listStockInReceipts:", error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách phiếu nhập.' });
        }
    },

    // 2. Lấy danh sách chi tiết hàng hóa (Items phẳng)
    listStockInItems: async (req, res) => {
        try {
            const items = await stockInModel.getAllStockInItems();
            res.status(200).json(items);
        } catch (error) {
            console.error("Lỗi listStockInItems:", error);
            res.status(500).json({ message: 'Lỗi khi tải chi tiết nhập kho.' });
        }
    },

    // 3. Tạo phiếu nhập mới (Bulk Insert)
    createStockInReceipt: async (req, res) => {
        try {
            const { stockInId, supplierName, userId, items } = req.body;

            // Validate
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Danh sách sản phẩm trống.' });
            }
            if (!stockInId && !supplierName) {
                return res.status(400).json({ message: 'Vui lòng nhập tên nhà cung cấp.' });
            }

            const result = await stockInModel.createStockInReceipt({
                stockInId,
                supplierName,
                userId: userId || 'WH01',
                items
            });

            res.status(201).json({ message: 'Nhập kho thành công!', data: result });
        } catch (error) {
            console.error("Lỗi createStockInReceipt:", error);
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    },

    // 4. Xóa dòng chi tiết
    deleteStockInItem: async (req, res) => {
        try {
            const { id } = req.params; 
            if (!id || !id.includes('_')) return res.status(400).json({ message: 'ID không hợp lệ.' });

            const parts = id.split('_');
            const stockInId = parts[0];
            const variantId = parts.slice(1).join('_');

            await stockInModel.deleteStockInItem(stockInId, variantId);
            res.status(200).json({ message: 'Đã xóa chi tiết nhập kho.' });
        } catch (error) {
            console.error("Lỗi deleteStockInItem:", error);
            if (error.message.includes("không tồn tại")) return res.status(404).json({ message: error.message });
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    },

    // 5. [HÀM NÀY ĐANG BỊ THIẾU DẪN ĐẾN LỖI 500]
    // Lấy chi tiết 1 phiếu cụ thể
    getReceiptDetails: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Thiếu mã phiếu nhập.' });

            const details = await stockInModel.getStockInDetailsById(id);
            res.status(200).json(details);
        } catch (error) {
            console.error("Lỗi getReceiptDetails:", error);
            res.status(500).json({ message: 'Lỗi server khi tải chi tiết phiếu.' });
        }
    }
};

module.exports = stockInController;