const db = require('../config/db.config');

const customerModel = {
    // (MỚI) Kiểm tra SĐT tồn tại
    checkPhoneExists: async (phone) => {
        const [rows] = await db.query("SELECT customer_id FROM customers WHERE phone = ?", [phone]);
        return rows.length > 0;
    },

    // (MỚI) Tạo khách hàng + User (Transaction)
    // SỬA: Logic sinh ID theo dạng CUS1, US1 (Tự tăng, không số 0)
    createCustomerTransaction: async (customerData, userData) => {
        const connection = await db.getConnection(); // Lấy connection riêng để dùng transaction
        try {
            await connection.beginTransaction(); // Bắt đầu giao dịch

            let userId = null;

            // ========================================================
            // BƯỚC 1: TẠO USER (Nếu có yêu cầu)
            // ========================================================
            if (userData) {
                // 🟡 LOGIC ID USER: US1, US2...
                // Tìm ID user lớn nhất bắt đầu bằng 'US'
                const [userRows] = await connection.query(
                    "SELECT user_id FROM users WHERE user_id LIKE 'US%' ORDER BY LENGTH(user_id) DESC, user_id DESC LIMIT 1"
                );

                let nextUserNum = 1; // Mặc định nếu chưa có
                if (userRows.length > 0) {
                    const lastUserId = userRows[0].user_id; // VD: US10
                    // Cắt bỏ 2 ký tự đầu 'US' để lấy số
                    nextUserNum = parseInt(lastUserId.substring(2)) + 1;
                }
                
                userId = `US${nextUserNum}`; // VD: US11

                const insertUserQuery = `
                    INSERT INTO users (user_id, username, password_hash, role_id, status)
                    VALUES (?, ?, ?, ?, 'Active')
                `;
                await connection.query(insertUserQuery, [
                    userId, 
                    userData.username, 
                    userData.passwordHash, 
                    userData.role_id
                ]);
            }

            // ========================================================
            // BƯỚC 2: TẠO CUSTOMER
            // ========================================================
            // 🟡 LOGIC ID CUSTOMER: CUS1, CUS2...
            // Tìm ID customer lớn nhất bắt đầu bằng 'CUS'
            const [cusRows] = await connection.query(
                "SELECT customer_id FROM customers WHERE customer_id LIKE 'CUS%' ORDER BY LENGTH(customer_id) DESC, customer_id DESC LIMIT 1"
            );

            let nextCusNum = 1; // Mặc định
            if (cusRows.length > 0) {
                const lastCusId = cusRows[0].customer_id; // VD: CUS99
                // Cắt bỏ 3 ký tự đầu 'CUS' để lấy số
                nextCusNum = parseInt(lastCusId.substring(3)) + 1;
            }

            const customerId = `CUS${nextCusNum}`; // VD: CUS100
            
            const insertCustomerQuery = `
                INSERT INTO customers (customer_id, user_id, full_name, email, phone, address, date_of_birth)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await connection.query(insertCustomerQuery, [
                customerId,
                userId, // Có thể là null nếu không tạo tài khoản
                customerData.fullName,
                customerData.email || null,
                customerData.phone,
                customerData.address || null,
                customerData.dob || null
            ]);

            await connection.commit(); // Xác nhận giao dịch thành công
            return { customerId, userId };

        } catch (error) {
            await connection.rollback(); // Hoàn tác nếu có lỗi
            throw error;
        } finally {
            connection.release(); // Trả lại connection cho pool
        }
    },

    // Lấy danh sách tất cả khách hàng
    getAllCustomers: async () => {
        const query = `
            SELECT 
                customer_id AS id,
                full_name AS fullName,
                phone,
                email,
                address,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dob
            FROM customers
            ORDER BY customer_id;
        `;
        const [rows] = await db.query(query);
        return rows;
    },
    // Lấy 1 khách hàng theo id
    getCustomerById: async (id) => {
        const query = `
            SELECT 
                customer_id AS id,
                full_name AS fullName,
                phone,
                email,
                address,
                DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dob
            FROM customers
            WHERE customer_id = ?;
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    },
        // Lấy lịch sử đơn hàng của 1 khách hàng
    getCustomerOrders: async (customerId) => {
        const query = `
            SELECT 
                o.order_id AS id,
                DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') AS orderDate,
                o.final_total AS totalAmount,
                o.status AS status,
                o.order_channel AS orderType,
                o.payment_status AS paymentStatus
            FROM orders o
            WHERE o.customer_id = ?
            ORDER BY o.order_date DESC;
        `;
        const [rows] = await db.query(query, [customerId]);
        return rows;
    },
        // Cập nhật thông tin khách hàng, không chạm vào lịch sử đơn hàng
    updateCustomer: async (id, data) => {
        const { fullName, email, phone, address, dob } = data;
        const query = `
            UPDATE customers
            SET 
                full_name = ?, 
                email = ?, 
                phone = ?, 
                address = ?, 
                date_of_birth = ?
            WHERE customer_id = ?;
        `;
        const [result] = await db.query(query, [fullName, email, phone, address, dob, id]);
        return result.affectedRows > 0;
    }
};

module.exports = customerModel;