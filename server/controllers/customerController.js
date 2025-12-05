const customerModel = require('../models/customerModel');
const db = require('../config/db.config');
const bcrypt = require('bcrypt');

const customerController = {

    // =============================
    // GET /api/customers
    // =============================
    listCustomers: async (req, res) => {
        try {
            const customers = await customerModel.getAllCustomers();
            res.status(200).json(customers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách khách hàng.' });
        }
    },

    // =============================
    // POST /api/customers/register
    // Thêm khách hàng và (tùy chọn) tạo tài khoản
    // =============================
    registerCustomer: async (req, res) => {
        try {
            const { 
                fullName, phone, email, address, dob,
                createAccount, username, password 
            } = req.body;

            // 1. Validate cơ bản
            if (!fullName || !phone) {
                return res.status(400).json({ message: 'Họ tên và Số điện thoại là bắt buộc.' });
            }

            // 2. Kiểm tra xem SĐT đã tồn tại chưa
            const existingCustomer = await customerModel.checkPhoneExists(phone);
            if (existingCustomer) {
                return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
            }

            let userData = null;

            // 3. Nếu yêu cầu tạo tài khoản
            if (createAccount) {
                if (!username || !password) {
                    return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc khi tạo tài khoản.' });
                }

                // Mã hóa mật khẩu
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);

                userData = {
                    username: username,
                    passwordHash: passwordHash,
                    // [ĐÃ SỬA]: role_id = 2 (Customer) thay vì 4
                    role_id: 2 
                };
            }

            // 4. Gọi Model để thực hiện Transaction
            // Model sẽ tự sinh ID dạng CUS1, US1...
            const result = await customerModel.createCustomerTransaction({
                fullName, phone, email, address, dob
            }, userData);

            res.status(201).json({ 
                message: 'Thêm khách hàng thành công.', 
                data: result 
            });

        } catch (error) {
            console.error("Register Error:", error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Tên đăng nhập hoặc SĐT đã tồn tại trong hệ thống.' });
            }
            res.status(500).json({ message: 'Lỗi server khi thêm khách hàng.' });
        }
    },

    // =============================
    // 🔍 GET /api/customers/phone/:phone
    // =============================
    getCustomerByPhone: async (req, res) => {
        try {
            const phone = req.params.phone;
            const [rows] = await db.query(
                "SELECT * FROM customers WHERE phone = ? LIMIT 1",
                [phone]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy khách hàng." });
            }
            return res.status(200).json({ customer: rows[0] });
        } catch (error) {
            console.error("Error getCustomerByPhone:", error);
            res.status(500).json({ message: "Lỗi server khi tìm khách hàng." });
        }
    },

    // =============================
    // GET /api/customers/:id
    // =============================
    getCustomerDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const customer = await customerModel.getCustomerById(id);
            if (!customer) {
                return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
            }
            const orders = await customerModel.getCustomerOrders(id);
            return res.status(200).json({ customer, orders: orders || [] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi lấy thông tin khách hàng.' });
        }
    },

    // =============================
    // PUT /api/customers/:id
    // =============================
    updateCustomer: async (req, res) => {
        try {
            const { id } = req.params;
            const { fullName, email, phone, address, dob } = req.body;
            const updated = await customerModel.updateCustomer(id, {
                fullName, email, phone, address, dob
            });
            if (!updated) {
                return res.status(404).json({ message: 'Không tìm thấy khách hàng để cập nhật.' });
            }
            res.status(200).json({ message: 'Cập nhật khách hàng thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi cập nhật khách hàng.' });
        }
    }
};

module.exports = customerController;