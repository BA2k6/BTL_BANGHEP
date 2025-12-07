const db = require('../config/db.config');

const stockInModel = {
    // 1. Lấy danh sách phiếu nhập (Master List)
    getAllStockInReceipts: async () => {
        const query = `
            SELECT 
                si.stock_in_id AS id, 
                si.supplier_name AS supplierName, 
                DATE_FORMAT(si.import_date, '%Y-%m-%d %H:%i') AS importDate, 
                si.total_cost AS totalCost, 
                COALESCE(e.full_name, u.username) AS staffName
            FROM stock_in si
            LEFT JOIN users u ON si.user_id = u.user_id
            LEFT JOIN employees e ON si.user_id = e.user_id
            ORDER BY si.import_date DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 2. Lấy chi tiết của 1 phiếu (View Details Modal)
    getStockInDetailsById: async (stockInId) => {
        const query = `
            SELECT 
                sid.stock_in_id AS stockInId,
                sid.variant_id AS variantId,
                p.name AS productName,
                pv.color,
                pv.size,
                sid.quantity,
                sid.cost_price AS priceImport
            FROM stock_in_details sid
            JOIN product_variants pv ON sid.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE sid.stock_in_id = ?
        `;
        const [rows] = await db.query(query, [stockInId]);
        return rows;
    },

    // 3. Tạo phiếu nhập mới hoặc thêm hàng vào phiếu cũ (Bulk Transaction)
    createStockInReceipt: async (payload) => {
        const { stockInId: providedId, supplierName, userId, items } = payload;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // A. Kiểm tra User tồn tại
            const [userCheck] = await connection.query("SELECT user_id FROM users WHERE user_id = ?", [userId]);
            if (userCheck.length === 0) throw new Error(`User ID '${userId}' không tồn tại.`);

            // B. Tạo hoặc Lấy ID Phiếu
            let stockInId = providedId;
            if (!stockInId) {
                 stockInId = `SI${Date.now().toString().slice(-8)}`; // Tạo ID mới
                 // Tạo phiếu mới (Master)
                 await connection.query(
                    `INSERT INTO stock_in (stock_in_id, supplier_name, import_date, total_cost, user_id)
                     VALUES (?, ?, NOW(), 0, ?)`,
                    [stockInId, supplierName, userId]
                );
            }

            let grandTotalAdd = 0;

            // C. Lặp qua từng sản phẩm
            for (const item of items) {
                const qty = parseInt(item.quantity);
                const price = parseFloat(item.priceImport);
                const itemTotal = qty * price;
                grandTotalAdd += itemTotal;

                // C1. Insert Detail
                await connection.query(
                    `INSERT INTO stock_in_details (stock_in_id, variant_id, quantity, cost_price)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     quantity = quantity + VALUES(quantity),
                     cost_price = VALUES(cost_price)`, 
                    [stockInId, item.variantId, qty, price]
                );

                // C2. Tính Giá Vốn Bình Quân & Update Kho
                const [productInfo] = await connection.query(`
                    SELECT p.product_id, p.cost_price, 
                    COALESCE((SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.product_id), 0) AS total_stock
                    FROM product_variants pv JOIN products p ON pv.product_id = p.product_id
                    WHERE pv.variant_id = ?
                `, [item.variantId]);

                if (productInfo.length > 0) {
                    const { product_id, cost_price, total_stock } = productInfo[0];
                    const oldStock = Number(total_stock);
                    const oldCost = Number(cost_price || 0);
                    
                    // Update kho Variant
                    await connection.query(`UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?`, [qty, item.variantId]);

                    // Update giá vốn Product (Average Cost)
                    const newTotalStock = oldStock + qty;
                    let newAvg = price;
                    if (newTotalStock > 0) {
                        newAvg = ((oldStock * oldCost) + (qty * price)) / newTotalStock;
                    }
                    await connection.query(`UPDATE products SET cost_price = ? WHERE product_id = ?`, [newAvg, product_id]);
                }
            }

            // D. Cập nhật Tổng tiền Phiếu
            await connection.query(
                'UPDATE stock_in SET total_cost = total_cost + ? WHERE stock_in_id = ?',
                [grandTotalAdd, stockInId]
            );

            await connection.commit();
            return { stockInId };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // 4. Xóa 1 dòng chi tiết
    deleteStockInItem: async (stockInId, variantId) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                'SELECT quantity, cost_price FROM stock_in_details WHERE stock_in_id = ? AND variant_id = ?',
                [stockInId, variantId]
            );

            if (rows.length === 0) throw new Error("Chi tiết phiếu nhập không tồn tại.");
            
            const { quantity, cost_price } = rows[0];
            const qtyToDelete = parseInt(quantity);
            const totalMoneyToDelete = qtyToDelete * parseFloat(cost_price);

            // Xóa detail
            await connection.query('DELETE FROM stock_in_details WHERE stock_in_id = ? AND variant_id = ?', [stockInId, variantId]);

            // Trừ tiền Master
            await connection.query('UPDATE stock_in SET total_cost = total_cost - ? WHERE stock_in_id = ?', [totalMoneyToDelete, stockInId]);

            // Trừ tồn kho
            await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?', [qtyToDelete, variantId]);

            // Xóa Master nếu rỗng
            const [remain] = await connection.query('SELECT count(*) as c FROM stock_in_details WHERE stock_in_id = ?', [stockInId]);
            if (remain[0].c === 0) {
                await connection.query('DELETE FROM stock_in WHERE stock_in_id = ?', [stockInId]);
            }

            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = stockInModel;