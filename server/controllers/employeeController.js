//C:\Users\Admin\Downloads\DUANWEB(1)\server\controllers\employeeController.js
const employeeModel = require('../models/employeeModel');
const db = require('../config/db.config');
const bcrypt = require('bcrypt');

const employeeController = {
    
    // 1. Lấy danh sách (Giữ nguyên)
    getAllEmployees: async (req, res) => { 
        try {
            const employees = await employeeModel.getAllEmployees();
            res.status(200).json(employees);
        } catch (error) {
            console.error("List Employees Error:", error);
            res.status(500).json({ message: 'Lỗi tải danh sách nhân viên.' });
        }
    },

    // 2. Tạo nhân viên mới (ĐÃ SỬA: LẤY EMP ID TỪ FRONTEND)
    createEmployee: async (req, res) => {
        try {
            const { 
                employeeId, // <--- QUAN TRỌNG: Lấy lại ID này từ Frontend (SALE01, WH01...)
                fullName, email, phone, address, 
                roleName, baseSalary, username, password, dob
            } = req.body;

            // Map tên chức vụ
            const roleMap = { 
                'Warehouse': 3, 'Kho': 3,
                'Sales': 4, 'Bán hàng': 4,
                'Online Sales': 5, 'Sale Online': 5,
                'Shipper': 6, 'Giao hàng': 6 
            };
            const roleId = roleMap[roleName] || 4; // Mặc định Sales

            if (!roleId) {
                return res.status(400).json({ message: 'Chức vụ không hợp lệ.' });
            }

            // 1. Kiểm tra trùng (ID nhân viên, Email, SĐT) - Gọi Model
            const isDuplicate = await employeeModel.checkDuplicate(employeeId, email, phone);
            if (isDuplicate) {
                return res.status(409).json({ message: 'Mã nhân viên, Email hoặc SĐT đã tồn tại.' });
            }

            // 2. Kiểm tra trùng Username (Gọi SQL nhanh)
            const [existingUser] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
            if (existingUser.length > 0) {
                return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
            }

            // 3. Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Chuẩn bị dữ liệu để gửi sang Model
            
            // Dữ liệu User: Không cần ID, Model sẽ tự sinh US...
            const userData = {
                username: username,
                password_hash: hashedPassword,
                role_id: roleId
            };

            // Dữ liệu Employee: PHẢI CÓ employeeId LẤY TỪ FRONTEND
            const empData = {
                employee_id: employeeId, // <--- Truyền vào đây
                full_name: fullName,
                email: email,
                phone: phone,
                date_of_birth: dob,
                address: address,
                department: roleName,
                base_salary: baseSalary,
                commission_rate: 0 
            };

            // 5. GỌI MODEL
            // (Hàm này sẽ tự sinh UserID US... và dùng EmployeeID SALE... ta vừa truyền)
            const result = await employeeModel.create(empData, userData);

            res.status(201).json({ 
                message: 'Thêm nhân viên thành công!',
                newEmployeeId: result.employeeId, 
                newUserId: result.userId
            });

        } catch (error) {
            console.error("CREATE EMPLOYEE ERROR:", error);
            res.status(500).json({ 
                message: 'Lỗi hệ thống khi thêm nhân viên.', 
                details: error.sqlMessage || error.message 
            });
        }
    },

    // 3. XỬ LÝ SỬA NHÂN VIÊN (Giữ nguyên)
    updateEmployee: async (req, res) => {
        const employeeId = req.params.id;
        const data = req.body;

        try {
            let hashedPassword = null;
            if (data.password && data.password.trim() !== '') {
                hashedPassword = await bcrypt.hash(data.password, 10);
            }

            await employeeModel.update(employeeId, data, hashedPassword);

            res.status(200).json({ message: 'Cập nhật thành công!' });
        } catch (error) {
            console.error("Update Error:", error);
            res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên.' });
        }
    },

    // 4. XỬ LÝ XÓA NHÂN VIÊN (Giữ nguyên)
   /* deleteEmployee: async (req, res) => {
        const employeeId = req.params.id;

        try {
            const userId = await employeeModel.getUserIdByEmpId(employeeId);
            
            if (!userId) {
                return res.status(404).json({ message: 'Không tìm thấy nhân viên này.' });
            }

            await employeeModel.deleteUser(userId);

            res.status(200).json({ message: 'Đã xóa nhân viên và tài khoản liên quan.' });
        } catch (error) {
            console.error("Delete Error:", error);
            res.status(500).json({ message: 'Lỗi khi xóa dữ liệu.' });
        }
    }*/
};

module.exports = employeeController;