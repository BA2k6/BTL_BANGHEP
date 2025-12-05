// /server/controllers/salaryController.js
const salaryModel = require('../models/salaryModel');

const salaryController = {
    listSalaries: async (req, res) => {
        // TODO: Cần middleware kiểm tra quyền Owner/Admin
        try {
            const salaries = await salaryModel.getAllSalaries(); // Gọi Model
            res.status(200).json(salaries);
        } catch (error) {
            console.error("Error listing salaries:", error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách bảng lương.' });
        }
    }
    ,

    // POST /api/salaries/calculate?month=YYYY-MM
    calculateSalaries: async (req, res) => {
        try {
            // month can be query or body
            const month = req.query.month || req.body.month; // e.g. '2025-12'
            if (!month) {
                return res.status(400).json({ message: 'Vui lòng cung cấp tham số month ở định dạng YYYY-MM' });
            }

            // compute first and last day
            const monthStart = `${month}-01`;

            // 1) Get all employees with their commission_rate and base_salary
            const [employees] = await require('../config/db.config').query(
                `SELECT employee_id, user_id, base_salary, commission_rate FROM employees`
            );

            const db = require('../config/db.config');

            // For each employee, compute total sales during month
            for (const emp of employees) {
                const [rows] = await db.query(
                    `SELECT IFNULL(SUM(final_total),0) AS total_sales FROM orders WHERE DATE_FORMAT(order_date, '%Y-%m') = ? AND status = 'Hoàn Thành' AND staff_id = ?`,
                    [month, emp.user_id]
                );

                const totalSales = Number(rows[0].total_sales || 0);
                const salesCommission = Number((totalSales * Number(emp.commission_rate || 0)).toFixed(2));

                const salaryId = `SAL${month.replace('-', '')}-${emp.employee_id}`;

                await salaryModel.upsertSalary({
                    salary_id: salaryId,
                    employee_id: emp.employee_id,
                    month_year: monthStart,
                    base_salary: emp.base_salary,
                    sales_commission: salesCommission,
                    bonus: 0,
                    deductions: 0
                });
            }

            const newSalaries = await salaryModel.getAllSalaries();
            res.status(200).json({ message: 'Tính lương hoàn tất.', data: newSalaries });
        } catch (error) {
            console.error('Error calculating salaries:', error);
            res.status(500).json({ message: 'Lỗi khi tính lương.', details: error.message });
        }
    },

    // PATCH /api/salaries/:id/pay
    paySalary: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Missing salary id' });

            const ok = await salaryModel.markSalaryPaid(id);
            if (!ok) return res.status(404).json({ message: 'Không tìm thấy bảng lương.' });

            res.status(200).json({ message: 'Cập nhật trạng thái đã trả.' });
        } catch (error) {
            console.error('Error paying salary:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái trả lương.' });
        }
    }
    ,

    // PATCH /api/salaries/:id
    updateSalary: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Missing salary id' });

            // Only accept specific fields
            const { base_salary, sales_commission, bonus, deductions } = req.body;
            const payload = {};
            if (base_salary !== undefined) payload.base_salary = base_salary;
            if (sales_commission !== undefined) payload.sales_commission = sales_commission;
            if (bonus !== undefined) payload.bonus = bonus;
            if (deductions !== undefined) payload.deductions = deductions;

            if (Object.keys(payload).length === 0) {
                return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật.' });
            }

            const result = await salaryModel.updateSalary(id, payload);
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy bảng lương để cập nhật.' });
            }

            const updated = await salaryModel.getSalaryById(id);
            res.status(200).json({ message: 'Cập nhật bảng lương thành công.', data: updated });
        } catch (error) {
            console.error('Error updating salary:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật bảng lương.', details: error.message });
        }
    }
    ,

    // GET /api/salaries/:id
    getSalary: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Missing salary id' });

            const row = await salaryModel.getSalaryById(id);
            if (!row) return res.status(404).json({ message: 'Không tìm thấy bảng lương.' });

            res.status(200).json(row);
        } catch (error) {
            console.error('Error getting salary:', error);
            res.status(500).json({ message: 'Lỗi khi lấy thông tin bảng lương.' });
        }
    }
    ,

    // DELETE /api/salaries/:id
    deleteSalary: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Missing salary id' });

            const ok = await salaryModel.deleteSalary(id);
            if (!ok) return res.status(404).json({ message: 'Không tìm thấy bảng lương để xóa.' });

            res.status(200).json({ message: 'Đã xóa bảng lương.' });
        } catch (error) {
            console.error('Error deleting salary:', error);
            res.status(500).json({ message: 'Lỗi khi xóa bảng lương.' });
        }
    }
};

module.exports = salaryController;