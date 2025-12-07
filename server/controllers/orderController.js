// server/controllers/orderController.js
const db = require('../config/db.config');
const orderModel = require('../models/orderModel'); 

// ===========================
// TẠO MÃ ĐƠN TỰ ĐỘNG (Helper)
// ===========================
async function generateOrderId(conn) {
    const [rows] = await conn.query(`
        SELECT order_id FROM orders ORDER BY CAST(SUBSTRING(order_id, 4) AS UNSIGNED) DESC LIMIT 1
    `);

    if (rows.length === 0) return "ORD001";

    const last = rows[0].order_id.replace("ORD", "");
    const next = String(parseInt(last) + 1).padStart(3, "0");

    return "ORD" + next;
}

// ============================================================
// KHỞI TẠO VÀ GÁN CÁC HÀM VÀO object orderController
// ============================================================
const orderController = {

    // 1. LẤY DANH SÁCH ĐƠN HÀNG
    listOrders: async (req, res) => {
        try {
            const orders = await orderModel.getAllOrders();
            res.status(200).json(orders || []);
        } catch (error) {
            console.error("Error listing orders:", error);
            res.status(500).json({ message: "Lỗi SQL khi truy vấn đơn hàng.", details: error.message });
        }
    },

    // 2. TẠO ĐƠN HÀNG (createOrder)
    createOrder: async (req, res) => {
        const conn = await db.getConnection();
        try {
            // DEBUG Log
            try { console.log('[DEBUG] Incoming createOrder payload:', JSON.stringify(req.body)); } catch (e) {}

            await conn.beginTransaction();
            
            const { 
                customerPhone, customerId: customerIdFromClient, employeeId, deliveryStaffId, orderChannel, directDelivery, 
                items, subtotal, shippingCost, finalTotal, paymentMethod 
            } = req.body;

            // Validate
            if (!employeeId || !items || items.length === 0 || 
                subtotal === undefined || shippingCost === undefined || finalTotal === undefined || !paymentMethod
            ) {
                await conn.rollback(); 
                return res.status(400).json({ message: "Thiếu dữ liệu tạo đơn hàng (Nhân viên, Sản phẩm hoặc thông tin tiền tệ)." });
            }

            // 1. Tìm Customer ID
            let customerId = null;
            if (customerIdFromClient) {
                customerId = customerIdFromClient;
            } else if (customerPhone) {
                const [cust] = await conn.query("SELECT customer_id FROM customers WHERE phone = ?", [customerPhone]);
                if (cust.length === 0) { 
                    await conn.rollback(); 
                    return res.status(404).json({ message: "Không tìm thấy khách hàng." }); 
                }
                customerId = cust[0].customer_id;
            } else {
                customerId = null;
            }

            // 2. Xác minh và tính toán
            let orderItems = [];
            for (const it of items) {
                // ✅ FIXED: Dùng p.base_price
                const [variantData] = await conn.query(
                    `SELECT p.base_price, pv.additional_price, pv.stock_quantity 
                     FROM product_variants pv 
                     JOIN products p ON pv.product_id = p.product_id 
                     WHERE pv.variant_id = ? FOR UPDATE`, // FOR UPDATE để khóa dòng tránh race condition
                    [it.variantId]
                );

                if (variantData.length === 0) { await conn.rollback(); return res.status(404).json({ message: `Không tìm thấy biến thể ${it.variantId}` }); }
                if (variantData[0].stock_quantity < it.quantity) { await conn.rollback(); return res.status(400).json({ message: `Biến thể ${it.variantId} không đủ tồn kho.` }); }

                // Tính toán giá bán thực tế
                const priceAtOrder = parseFloat(variantData[0].base_price) + parseFloat(variantData[0].additional_price || 0);
                const finalPriceToRecord = it.priceAtOrder || priceAtOrder;

                orderItems.push({ ...it, priceAtOrder: finalPriceToRecord, variantId: it.variantId });
            }

            // 3. Đặt trạng thái ban đầu
            let status = "Đang Xử Lý"; 
            let paymentStatus = "Chưa Thanh Toán"; 
            let completedDate = null;
            
            if (directDelivery) { 
                status = "Hoàn Thành"; 
                paymentStatus = "Đã Thanh Toán"; 
                completedDate = new Date(); 
            }

            const orderId = await generateOrderId(conn);

            // 4. INSERT vào orders
            await conn.query(
                `INSERT INTO orders (order_id, customer_id, staff_id, delivery_staff_id, order_date, subtotal, shipping_cost, final_total, status, order_channel, payment_method, payment_status, direct_delivery, completed_date)
                 VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, customerId, employeeId, deliveryStaffId || null, subtotal, shippingCost, finalTotal, status, orderChannel, paymentMethod, paymentStatus, directDelivery, completedDate]
            );

            // 5. INSERT vào order_details VÀ TRỪ KHO (Thay thế Trigger)
            for (const it of orderItems) {
                await conn.query(
                    `INSERT INTO order_details (order_id, variant_id, quantity, price_at_order) VALUES (?, ?, ?, ?)`, 
                    [orderId, it.variantId, it.quantity, it.priceAtOrder]
                );

                // ✅ LOGIC MỚI: Trừ kho thủ công
                await conn.query(
                    `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?`,
                    [it.quantity, it.variantId]
                );
            }
            
            await conn.commit();
            res.status(201).json({ message: "Tạo đơn hàng thành công!", orderId, status, paymentStatus, finalTotal, items: orderItems });

        } catch (error) {
            await conn.rollback();
            console.error("Error creating order:", error);
            res.status(500).json({ message: "Lỗi khi tạo đơn hàng.", details: error.message });
        } finally {
            conn.release();
        }
    },

    // 3. LẤY CHI TIẾT ĐƠN HÀNG (getOrderById)
    getOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            const [order] = await db.query(
                `SELECT 
                    o.order_id AS id, 
                    o.customer_id,
                    o.staff_id,
                    o.delivery_staff_id,
                    c.full_name AS customerName, 
                    c.phone, 
                    c.address,
                    o.final_total AS totalAmount, 
                    o.subtotal, 
                    o.shipping_cost, 
                    o.status, 
                    o.payment_status, 
                    o.order_channel, 
                    o.payment_method, 
                    DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') AS orderDate, 
                    es.full_name AS staffName,
                    ed.full_name AS deliveryStaffName
                FROM orders o 
                LEFT JOIN customers c ON o.customer_id = c.customer_id 
                LEFT JOIN employees es ON o.staff_id = es.user_id
                LEFT JOIN employees ed ON o.delivery_staff_id = ed.user_id
                WHERE o.order_id = ?`, 
                [orderId]
            );
            
            if (order.length === 0) { return res.status(404).json({ message: "Không tìm thấy đơn hàng." }); }

            const [details] = await db.query(
                `SELECT 
                    od.variant_id, 
                    p.name AS product_name, 
                    pv.color, 
                    pv.size, 
                    od.quantity, 
                    od.price_at_order, 
                    (od.quantity * od.price_at_order) AS itemTotal
                FROM order_details od 
                JOIN product_variants pv ON od.variant_id = pv.variant_id 
                LEFT JOIN products p ON pv.product_id = p.product_id 
                WHERE od.order_id = ?`, 
                [orderId]
            );

            res.status(200).json({ ...order[0], items: details });

        } catch (error) {
            console.error("Error getting order:", error);
            res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng.", details: error.message });
        }
    },

    // 4. CẬP NHẬT ĐƠN HÀNG (updateOrder)
    updateOrder: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const { orderId } = req.params;
            const { items, shippingCost, paymentMethod, deliveryStaffId, status, paymentStatus } = req.body; 
            
            if (!items || items.length === 0) { await conn.rollback(); return res.status(400).json({ message: "Phải có ít nhất 1 sản phẩm." }); }
            
            // ✅ LOGIC MỚI: Lấy chi tiết cũ để hoàn kho trước khi xóa
            const [oldDetails] = await conn.query("SELECT variant_id, quantity FROM order_details WHERE order_id = ?", [orderId]);
            for (const oldIt of oldDetails) {
                await conn.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?', [oldIt.quantity, oldIt.variant_id]);
            }

            // Xóa chi tiết cũ
            await conn.query("DELETE FROM order_details WHERE order_id = ?", [orderId]);
            
            // Tính toán mới và chuẩn bị insert
            let subtotal = 0; 
            let newOrderDetails = [];
            
            for (const it of items) {
                // ✅ FIXED: Dùng p.base_price
                const [variantData] = await conn.query(
                    `SELECT (p.base_price + pv.additional_price) AS final_price, pv.stock_quantity 
                     FROM product_variants pv 
                     JOIN products p ON pv.product_id = p.product_id 
                     WHERE pv.variant_id = ?`, 
                    [it.variantId]
                );
                
                if (variantData.length === 0) { await conn.rollback(); return res.status(404).json({ message: `Không tìm thấy biến thể ${it.variantId}` }); }
                
                // Check tồn kho mới (lưu ý: kho đã được hoàn lại số cũ ở bước trên)
                if (variantData[0].stock_quantity < it.quantity) {
                    await conn.rollback(); return res.status(400).json({ message: `Sản phẩm ${it.variantId} không đủ tồn kho.` });
                }

                const price = parseFloat(variantData[0].final_price);
                subtotal += price * it.quantity; 
                newOrderDetails.push({ variantId: it.variantId, quantity: it.quantity, price });
            }

            const shippingFee = Number(shippingCost || 0);
            const finalTotal = subtotal + shippingFee;

            // Cập nhật Orders Header
            const updateFields = {
                subtotal: subtotal,
                shipping_cost: shippingFee,
                final_total: finalTotal,
            };
            if (paymentMethod) { updateFields.payment_method = paymentMethod; }
            if (deliveryStaffId !== undefined) { updateFields.delivery_staff_id = deliveryStaffId; }
            if (status) { updateFields.status = status; }
            if (paymentStatus) { updateFields.payment_status = paymentStatus; }

            const updateQuery = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
            const updateValues = [...Object.values(updateFields), orderId];

            await conn.query(`UPDATE orders SET ${updateQuery} WHERE order_id = ?`, updateValues);

            // Insert chi tiết mới VÀ TRỪ KHO (Thay thế Trigger)
            for (const it of newOrderDetails) {
                await conn.query(
                    `INSERT INTO order_details (order_id, variant_id, quantity, price_at_order) VALUES (?, ?, ?, ?)`, 
                    [orderId, it.variantId, it.quantity, it.price]
                );
                // ✅ LOGIC MỚI: Trừ kho thủ công
                await conn.query(
                    `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?`,
                    [it.quantity, it.variantId]
                );
            }

            await conn.commit();
            res.status(200).json({ message: "Cập nhật đơn hàng thành công!", finalTotal });

        } catch (error) {
            await conn.rollback();
            console.error("Error updating order:", error);
            res.status(500).json({ message: "Lỗi khi cập nhật đơn hàng.", details: error.message });
        } finally {
            conn.release();
        }
    },
    
    // 5. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (updateOrderStatus)
    updateOrderStatus: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const { orderId } = req.params;
            const { status } = req.body;

            if (!status) { await conn.rollback(); return res.status(400).json({ message: "Phải cung cấp trạng thái mới." }); }
            
            // Lấy trạng thái cũ
            const [oldOrderRows] = await conn.query('SELECT status FROM orders WHERE order_id = ?', [orderId]);
            if (oldOrderRows.length === 0) { await conn.rollback(); return res.status(404).json({ message: "Không tìm thấy đơn hàng." }); }
            const oldStatus = oldOrderRows[0].status;
            
            const completedDate = (status === 'Hoàn Thành') ? new Date() : null;
            await conn.query("UPDATE orders SET status = ?, completed_date = ? WHERE order_id = ?", [status, completedDate, orderId]);

            // ✅ LOGIC MỚI: Hoàn kho nếu Hủy đơn (Thay thế Trigger)
            if (status === 'Đã Hủy' && oldStatus !== 'Đã Hủy') {
                const [details] = await conn.query("SELECT variant_id, quantity FROM order_details WHERE order_id = ?", [orderId]);
                for (const item of details) {
                    await conn.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?', [item.quantity, item.variant_id]);
                }
            }

            await conn.commit();
            res.status(200).json({ message: "Cập nhật trạng thái đơn hàng thành công!", status });

        } catch (error) {
            await conn.rollback();
            console.error("Error updating order status:", error);
            res.status(500).json({ message: "Lỗi khi cập nhật trạng thái.", details: error.message });
        } finally {
            conn.release();
        }
    },

    // 6. CẬP NHẬT TRẠNG THÁI THANH TOÁN (updatePaymentStatus)
    updatePaymentStatus: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const { orderId } = req.params;
            const { paymentStatus } = req.body;

            if (!paymentStatus) { await conn.rollback(); return res.status(400).json({ message: "Phải cung cấp trạng thái thanh toán mới." }); }

            await conn.query('UPDATE orders SET payment_status = ? WHERE order_id = ?', [paymentStatus, orderId]);
            
            if (paymentStatus === 'Đã Thanh Toán') {
                await conn.query('UPDATE orders SET completed_date = NOW() WHERE order_id = ? AND completed_date IS NULL', [orderId]);
            }

            await conn.commit();
            res.status(200).json({ message: "Cập nhật trạng thái thanh toán thành công!", paymentStatus });

        } catch (error) {
            await conn.rollback();
            console.error("Error updating payment status:", error);
            res.status(500).json({ message: "Lỗi khi cập nhật trạng thái thanh toán.", details: error.message });
        } finally {
            conn.release();
        }
    },

    // 7. XÓA ĐƠN HÀNG (deleteOrder)
    deleteOrder: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const { orderId } = req.params;

            const [details] = await conn.query('SELECT variant_id, quantity FROM order_details WHERE order_id = ?', [orderId]);
            
            if (details.length === 0) { await conn.rollback(); return res.status(404).json({ message: "Không tìm thấy đơn hàng để xóa." }); }

            // 1. Hoàn lại tồn kho thủ công (Giữ nguyên logic cũ đã có)
            for (const item of details) {
                await conn.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE variant_id = ?', [item.quantity, item.variant_id]);
            }

            // 2. Xóa chi tiết và đơn hàng
            await conn.query("DELETE FROM order_details WHERE order_id = ?", [orderId]); 
            await conn.query("DELETE FROM orders WHERE order_id = ?", [orderId]); 

            await conn.commit();
            res.status(200).json({ message: "Xóa đơn hàng thành công và đã hoàn lại tồn kho!" });

        } catch (error) {
            await conn.rollback();
            console.error("Error deleting order:", error);
            res.status(500).json({ message: "Lỗi khi xóa đơn hàng.", details: error.message });
        } finally {
            conn.release();
        }
    }

};

module.exports = orderController;