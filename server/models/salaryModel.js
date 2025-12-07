// /server/models/salaryModel.js
const db = require('../config/db.config');

const salaryModel = {
    getAllSalaries: async () => {
        const query = `
    SELECT
        s.salary_id AS salary_id,
        s.month_year AS month_year,
        s.base_salary,
        s.sales_commission,
        s.bonus,
        s.deductions,
        s.net_salary,
        s.paid_status,
        s.paid_at,
        emp.employee_id AS employee_id,
        emp.user_id AS user_id,
        COALESCE(emp.full_name) AS staff_name
    FROM salaries s
    LEFT JOIN employees emp ON s.employee_id = emp.employee_id
    LEFT JOIN users u ON emp.user_id = u.user_id
    ORDER BY s.month_year DESC, s.salary_id;
`;
        const [rows] = await db.query(query);
        return rows;
    }
    ,

    // Tạo hoặc cập nhật 1 bản lương (upsert theo employee_id + month_year unique key)
    upsertSalary: async (salary) => {
        const {
            salary_id,
            employee_id,
            month_year,
            base_salary,
            sales_commission,
            bonus = 0,
            deductions = 0
        } = salary;

        const query = `
            INSERT INTO salaries
            (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Unpaid')
            ON DUPLICATE KEY UPDATE
                base_salary = VALUES(base_salary),
                sales_commission = VALUES(sales_commission),
                bonus = VALUES(bonus),
                deductions = VALUES(deductions)
        `;

        const params = [salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions];
        const [result] = await db.query(query, params);
        return result;
    },

    markSalaryPaid: async (salaryId, paidByUserId = null) => {
        const query = `UPDATE salaries SET paid_status = 'Paid', paid_at = NOW() WHERE salary_id = ?`;
        const [result] = await db.query(query, [salaryId]);
        return result.affectedRows > 0;
    }
    ,

    getSalaryById: async (salaryId) => {
        const query = `
        SELECT
            s.salary_id AS salary_id,
            s.month_year AS month_year,
            s.base_salary,
            s.sales_commission,
            s.bonus,
            s.deductions,
            s.net_salary,
            s.paid_status,
            s.paid_at,
            emp.employee_id AS employee_id,
            emp.user_id AS user_id,
            COALESCE(emp.full_name, u.full_name) AS staff_name
        FROM salaries s
        LEFT JOIN employees emp ON s.employee_id = emp.employee_id
        LEFT JOIN users u ON emp.user_id = u.user_id
        WHERE s.salary_id = ?
        LIMIT 1;
        `;
        const [rows] = await db.query(query, [salaryId]);
        return rows[0] || null;
    },

    updateSalary: async (salaryId, fields = {}) => {
        // allowed fields to update
        const allowed = ['base_salary', 'sales_commission', 'bonus', 'deductions'];
        const setParts = [];
        const params = [];
        Object.keys(fields).forEach((k) => {
            if (allowed.includes(k)) {
                setParts.push(`${k} = ?`);
                params.push(fields[k]);
            }
        });
        if (setParts.length === 0) return { affectedRows: 0 };

        const query = `UPDATE salaries SET ${setParts.join(', ')} WHERE salary_id = ?`;
        params.push(salaryId);
        const [result] = await db.query(query, params);
        return result;
    }
    ,

    deleteSalary: async (salaryId) => {
        const query = `DELETE FROM salaries WHERE salary_id = ?`;
        const [result] = await db.query(query, [salaryId]);
        return result.affectedRows > 0;
    }
};

module.exports = salaryModel;