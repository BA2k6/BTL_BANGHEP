// C:\Users\Admin\Downloads\DUANWEB(1)\server\models\employeeModel.js
const db = require('../config/db.config');

const employeeModel = {
    // 1. Lấy danh sách nhân viên
    getAllEmployees: async () => {
        try {
            const query = `
                SELECT e.*, u.status, u.username 
                FROM employees e
                LEFT JOIN users u ON e.user_id = u.user_id 
                ORDER BY e.created_at DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // 2. Kiểm tra trùng
    checkDuplicate: async (employeeId, email, phone) => {
        const query = `
            SELECT employee_id FROM employees 
            WHERE employee_id = ? OR email = ? OR phone = ?
        `;
        const [rows] = await db.query(query, [employeeId, email, phone]);
        return rows.length > 0;
    },

    // 3. Lấy User ID từ Employee ID
    getUserIdByEmpId: async (employeeId) => {
        try {
            const query = `SELECT user_id FROM employees WHERE employee_id = ?`;
            const [rows] = await db.query(query, [employeeId]);
            return rows.length > 0 ? rows[0].user_id : null;
        } catch (err) { throw err; }
    },

    // 4. Xóa User
   /* deleteUser: async (userId) => {
        try {
            const query = `DELETE FROM users WHERE user_id = ?`;
            await db.query(query, [userId]);
        } catch (err) { throw err; }
    },*/

    // 5. Cập nhật thông tin Nhân viên
    update: async (employeeId, data, newPasswordHash) => {
        const connection = await db.getConnection(); 
        try {
            await connection.beginTransaction();

            // A. Cập nhật bảng EMPLOYEES (Đây là nơi lưu Tên thật)
            const updateEmpQuery = `
                UPDATE employees 
                SET full_name = ?, email = ?, phone = ?, address = ?, base_salary = ?
                WHERE employee_id = ?
            `;
            await connection.query(updateEmpQuery, [
                data.fullName, data.email, data.phone, data.address, data.baseSalary, employeeId
            ]);

            // B. Cập nhật bảng USERS (Chỉ cập nhật Mật khẩu nếu có)
            if (newPasswordHash) {
                const [rows] = await connection.query('SELECT user_id FROM employees WHERE employee_id = ?', [employeeId]);
                
                if (rows.length > 0) {
                    const userId = rows[0].user_id;
                    const updateUserSql = `
                        UPDATE users 
                        SET password_hash = ?, 
                            must_change_password = TRUE,
                            token_version = token_version + 1 
                        WHERE user_id = ?
                    `;
                    await connection.query(updateUserSql, [newPasswordHash, userId]);
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

getAllEmployees: async () => { /* ... */ return await db.query("SELECT e.*, u.status, u.username FROM employees e LEFT JOIN users u ON e.user_id = u.user_id ORDER BY e.created_at DESC").then(([rows]) => rows); },
    checkDuplicate: async (employeeId, email, phone) => { /* ... */ const [rows] = await db.query("SELECT employee_id FROM employees WHERE employee_id = ? OR email = ? OR phone = ?", [employeeId, email, phone]); return rows.length > 0; },
    getUserIdByEmpId: async (employeeId) => { /* ... */ const [rows] = await db.query("SELECT user_id FROM employees WHERE employee_id = ?", [employeeId]); return rows.length > 0 ? rows[0].user_id : null; },
    deleteUser: async (userId) => { /* ... */ await db.query("DELETE FROM users WHERE user_id = ?", [userId]); },
    update: async (employeeId, data, newPasswordHash) => { /* ... logic update giữ nguyên ... */ },

    // ============================================================
    // 6. TẠO NHÂN VIÊN (SỬA LẠI: USER TỰ ĐỘNG, EMP LẤY TỪ FRONTEND)
    // ============================================================
    create: async (empData, userData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // ---------------------------------------------------------
            // BƯỚC A: TẠO USER ID TỰ ĐỘNG (US1, US2...) - GIỮ NGUYÊN
            // ---------------------------------------------------------
            const [userRows] = await connection.query(
                "SELECT user_id FROM users WHERE user_id LIKE 'US%' ORDER BY LENGTH(user_id) DESC, user_id DESC LIMIT 1"
            );

            let newUserId = 'US1'; 
            if (userRows.length > 0) {
                const lastUserId = userRows[0].user_id; 
                const userNum = parseInt(lastUserId.substring(2)); 
                newUserId = `US${userNum + 1}`;
            }

            // ---------------------------------------------------------
            // BƯỚC B: INSERT VÀO DB
            // ---------------------------------------------------------

            // 1. Insert User (Dùng newUserId tự sinh)
            const insertUserSql = `
                INSERT INTO users (user_id, username, password_hash, role_id, status, must_change_password)
                VALUES (?, ?, ?, ?, 'Active', TRUE)
            `;
            // Lưu ý: Đã bỏ full_name ở bảng users theo yêu cầu trước
            await connection.query(insertUserSql, [
                newUserId, 
                userData.username, 
                userData.password_hash, 
                userData.role_id
            ]);

            // 2. Insert Employee (DÙNG ID TỪ FRONTEND GỬI LÊN)
            const insertEmpSql = `
                INSERT INTO employees (
                    employee_id, user_id, full_name, email, phone, 
                    date_of_birth, address, start_date, employee_type, 
                    department, base_salary, commission_rate
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Full-time', ?, ?, ?)
            `;
            
            await connection.query(insertEmpSql, [
                empData.employee_id, // <--- Lấy ID frontend (SALE01, WH02...)
                newUserId,           // <--- Lấy ID User tự sinh (US...)
                empData.full_name, 
                empData.email, 
                empData.phone, 
                empData.date_of_birth, 
                empData.address, 
                empData.department, 
                empData.base_salary, 
                empData.commission_rate
            ]);

            await connection.commit();
            return { success: true, employeeId: empData.employee_id, userId: newUserId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = employeeModel;