const userModel = require('../models/userModel');
const db = require('../config/db.config');
const bcrypt = require('bcrypt'); // [QUAN TRỌNG: Để mã hóa mật khẩu]

const userController = {
    // ============================================================
    // 1. LẤY DANH SÁCH USER (Cho Admin/Owner)
    // ============================================================
    listUsers: async (req, res) => {
        try {
            const users = await userModel.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            console.error("List Users Error:", error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng.' });
        }
    },

    // ============================================================
    // 2. TẠO USER MỚI (Có Transaction & Hash Password)
    // ============================================================
    createUser: async (req, res) => {
        const requesterRole = req.user ? req.user.roleName : null; 
        const { userId, username, password, fullName, phone, roleName, email } = req.body;

        if (!userId || !username || !password || !fullName || !roleName) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        // --- Kiểm tra quyền hạn (Logic giữ nguyên) ---
        if (requesterRole) {
            if (roleName !== 'Customer' && requesterRole !== 'Owner') return res.status(403).json({ message: 'Không đủ quyền.' });
            if (roleName === 'Customer' && !['Owner', 'Sales', 'Online Sales'].includes(requesterRole)) return res.status(403).json({ message: 'Không đủ quyền.' });
        }

        const roleMap = { 'Owner': 1, 'Customer': 2, 'Warehouse': 3, 'Sales': 4, 'Online Sales': 5, 'Shipper': 6 };
        const roleId = roleMap[roleName];
        if (!roleId) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });

        let connection;
        try {
            // 1. Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            connection = await db.getConnection();
            await connection.beginTransaction();

            // 2. Kiểm tra trùng lặp
            const [dupUser] = await connection.query("SELECT user_id FROM users WHERE username = ?", [username]);
            if (dupUser.length > 0) { await connection.release(); return res.status(409).json({ message: 'Username đã tồn tại.' }); }

            const [dupId] = await connection.query("SELECT user_id FROM users WHERE user_id = ?", [userId]);
            if (dupId.length > 0) { await connection.release(); return res.status(409).json({ message: 'User ID đã tồn tại.' }); }

            // 3. Insert User (Mặc định Active, và phải đổi mật khẩu lần đầu)
            await connection.query(
                "INSERT INTO users (user_id, username, password_hash, role_id, status, must_change_password) VALUES (?, ?, ?, ?, 'Active', TRUE)",
                [userId, username, hashedPassword, roleId]
            );

            // 4. Insert Profile (Customer hoặc Employee)
            if (roleName === 'Customer') {
                await connection.query("INSERT INTO customers (customer_id, user_id, full_name, phone, email) VALUES (?, ?, ?, ?, ?)", [userId, userId, fullName, phone, email || null]);
            } else if (roleName !== 'Owner') {
                const empEmail = email || `${username}@store.com`;
                await connection.query("INSERT INTO employees (employee_id, user_id, full_name, email, phone, start_date, employee_type, department, base_salary) VALUES (?, ?, ?, ?, ?, CURDATE(), 'Full-time', ?, 5000000)", [userId, userId, fullName, empEmail, phone, roleName]);
            }

            await connection.commit();
            connection.release();
            res.status(201).json({ message: 'Tạo tài khoản thành công!' });

        } catch (error) {
            if (connection) { await connection.rollback(); connection.release(); }
            console.error("Create User Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống khi tạo tài khoản.' });
        }
    },

    // ============================================================
    // 3. ADMIN RESET MẬT KHẨU (Force Logout)
    // ============================================================
    adminResetPassword: async (req, res) => {
        // [QUAN TRỌNG]: Lấy ID từ URL params để khớp với Router PUT /:id/reset-password
        const targetUserId = req.params.id; 
        const { newPassword } = req.body;
        
        if (!targetUserId || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin ID hoặc mật khẩu mới.' });

        try {
            // 1. Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // 2. Token Version = null (Model sẽ tự xử lý hoặc +1) để User bị đăng xuất
            const newTokenVersion = null; 

            // 3. Gọi Model
            await userModel.adminResetPassword(targetUserId, hashedPassword, newTokenVersion);
            
            res.status(200).json({ message: 'Reset mật khẩu thành công. User sẽ bị đăng xuất khỏi các thiết bị.' });
        } catch (error) {
            console.error("Reset Pass Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống khi reset mật khẩu.' });
        }
    },

    // ============================================================
    // 4. ADMIN CẬP NHẬT TRẠNG THÁI (Khóa/Mở)
    // ============================================================
    updateUserStatus: async (req, res) => {
        const userId = req.params.id; // Lấy ID từ URL
        const { status } = req.body; 

        if (!userId || !status) return res.status(400).json({ message: 'Thiếu thông tin.' });

        // Chuẩn hóa trạng thái
        const s = status.toString().toLowerCase();
        let dbStatus = status;
        if (s === 'hoạt động') dbStatus = 'Active';
        if (s === 'đã khóa' || s === 'locked') dbStatus = 'Locked';

        if (dbStatus !== 'Active' && dbStatus !== 'Locked') return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });

        try {
            const newTokenVersion = null; // Force logout nếu cần (tùy logic model)

            await userModel.updateStatus(userId, dbStatus, newTokenVersion);
            res.status(200).json({ message: `Đã cập nhật trạng thái thành ${dbStatus}` });
        } catch (error) {
            console.error("Update Status Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật trạng thái.' });
        }
    },

    // ============================================================
    // 5. LẤY HỒ SƠ CÁ NHÂN (Profile)
    // ============================================================
    getUserProfile: async (req, res) => {
        try {
            // Lấy ID từ Token (req.user do middleware decode ra)
            const userId = req.user.userId || req.user.id; 
            
            const user = await userModel.getProfileById(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
            }
            
            res.status(200).json(user);
        } catch (error) {
            console.error("Get Profile Error:", error);
            res.status(500).json({ message: 'Lỗi server khi lấy thông tin.' });
        }
    },

    // ============================================================
    // 6. CẬP NHẬT HỒ SƠ CÁ NHÂN [ĐÃ SỬA LỖI ROLE]
    // ============================================================
    updateUserProfile: async (req, res) => {
        try {
            // Lấy ID từ Token (An toàn nhất)
            const userId = req.user.userId || req.user.id; 
            const roleName = req.user.roleName; 
            
            console.log(`>>> Update Profile request: User [${userId}] - Role [${roleName}]`);

            const { full_name, phone, address, date_of_birth, email } = req.body;

            // Xử lý ngày tháng: Nếu rỗng gửi null để tránh lỗi DB
            const dobValue = date_of_birth ? date_of_birth : null;

            const data = { 
                full_name, 
                phone, 
                address, 
                date_of_birth: dobValue,
                email
            };

            let result;
            
            // [FIX QUAN TRỌNG]: Cập nhật đúng tên Role như trong Database
            // Lưu ý: Phải khớp chính xác với Role bạn đã Insert lúc tạo User
            const employeeRoles = [
                'Owner', 
                'Store Manager', 
                'Sales',          // Sửa từ 'Sales Staff' -> 'Sales'
                'Online Sales',   // Thêm trường hợp này
                'Warehouse',      // Sửa từ 'Warehouse Staff' -> 'Warehouse'
                'Shipper'
            ];
            
            // Kiểm tra xem user thuộc nhóm nhân viên hay khách hàng
            if (employeeRoles.includes(roleName)) {
                console.log(">>> Updating EMPLOYEE table...");
                result = await userModel.updateEmployeeProfile(userId, data);
            } else {
                console.log(">>> Updating CUSTOMER table...");
                result = await userModel.updateCustomerProfile(userId, data);
            }

            console.log(">>> DB Result:", result);

            // Kiểm tra kết quả thực tế từ DB
            if (result && result.affectedRows === 0) {
                // Trường hợp này nghĩa là ID không tồn tại trong bảng tương ứng
                // Ví dụ: Role là 'Sales' nhưng lại không có dòng nào trong bảng 'employees' có id đó
                return res.status(404).json({ 
                    message: 'Cập nhật thất bại. Không tìm thấy bản ghi hồ sơ tương ứng trong DB.',
                    debug: `Role: ${roleName}, Table Checked: ${employeeRoles.includes(roleName) ? 'Employees' : 'Customers'}`
                });
            }

            res.status(200).json({ message: 'Cập nhật hồ sơ thành công!' });

        } catch (error) {
            console.error("Update Profile Error:", error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ.' });
        }
    },
};

module.exports = userController;