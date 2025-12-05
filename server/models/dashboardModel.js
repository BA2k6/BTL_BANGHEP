const db = require('../config/db.config');

const dashboardModel = {
    // 1. Hàm lấy dữ liệu biểu đồ (Doanh thu, Lợi nhuận, Đơn hàng)
    getMonthlySummary: async (year) => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const query = `
            SELECT
                DATE_FORMAT(o.order_date, '%Y-%m') AS month,
                -- Tổng doanh thu từ các đơn hoàn thành
                SUM(CASE WHEN o.status = 'Hoàn Thành' THEN IFNULL(o.final_total, 0) ELSE 0 END) AS salesRevenue, 
                
                -- Doanh thu trực tiếp
                SUM(CASE WHEN o.status = 'Hoàn Thành' AND o.order_channel = 'Trực tiếp' THEN IFNULL(o.final_total, 0) ELSE 0 END) AS directRevenue,
                
                -- Doanh thu Online
                SUM(CASE WHEN o.status = 'Hoàn Thành' AND o.order_channel = 'Online' THEN IFNULL(o.final_total, 0) ELSE 0 END) AS onlineRevenue,
                
                -- Giá vốn hàng bán (COGS): Cần join qua bảng variants để lấy giá vốn từ bảng products
                SUM(CASE 
                    WHEN o.status = 'Hoàn Thành' THEN IFNULL(od.quantity * IFNULL(p.cost_price, 0), 0) 
                    ELSE 0 
                END) AS totalCOGS, 
                
                COUNT(DISTINCT o.order_id) AS totalOrders
            FROM orders o
            LEFT JOIN order_details od ON o.order_id = od.order_id
            -- [SỬA LỖI]: Join qua product_variants trước vì order_details chứa variant_id
            LEFT JOIN product_variants pv ON od.variant_id = pv.variant_id
            LEFT JOIN products p ON pv.product_id = p.product_id
            WHERE DATE(o.order_date) BETWEEN ? AND ?
            GROUP BY month
            ORDER BY month ASC;
        `;

        try {
            const [rows] = await db.query(query, [startDate, endDate]);
            return rows.map(row => ({
                month: row.month,
                salesRevenue: Number(row.salesRevenue),
                directRevenue: Number(row.directRevenue),
                onlineRevenue: Number(row.onlineRevenue),
                totalCOGS: Number(row.totalCOGS),
                totalOrders: Number(row.totalOrders)
            }));
        } catch (error) {
            console.error("❌ SQL ERROR in getMonthlySummary:", error);
            throw new Error(`SQL Error on Dashboard Summary: ${error.message}`);
        }
    },

    // 2. Hàm lấy dữ liệu lương (Không thay đổi vì bảng salaries độc lập)
    getMonthlySalaries: async (year) => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const query = `
            SELECT 
                DATE_FORMAT(month_year, '%Y-%m') AS month,
                IFNULL(SUM(net_salary), 0) AS totalSalaries
            FROM salaries
            WHERE month_year BETWEEN ? AND ?
              AND paid_status = 'Paid'
            GROUP BY month
            ORDER BY month ASC;
        `;

        try {
            const [rows] = await db.query(query, [startDate, endDate]);
            return rows.map(row => ({
                month: row.month,
                totalSalaries: Number(row.totalSalaries)
            }));
        } catch (error) {
            console.error("❌ SQL ERROR in getMonthlySalaries:", error);
            throw new Error(`SQL Error on Monthly Salaries: ${error.message}`);
        }
    },

    // 3. Hàm lấy khách hàng mới (Sửa updated_at thành created_at để đếm khách mới)
    getCustomersByMonth: async (year, month) => {
        try {
            // [GỢI Ý]: Nên dùng created_at để tính số lượng khách hàng MỚI tạo trong tháng
            const query = `
                SELECT COUNT(*) AS total 
                FROM customers 
                WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
            `;
            const [rows] = await db.query(query, [year, month]);
            return rows[0].total || 0;
        } catch (error) {
            console.error("❌ SQL ERROR in getCustomersByMonth:", error);
            return 0;
        }
    },

    // 4. Lấy doanh thu theo Danh mục sản phẩm (Gom nhóm theo Quý)
    getRevenueByCategory: async (year) => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const query = `
            SELECT 
                QUARTER(o.order_date) as quarter,
                c.category_name,
                SUM(od.quantity * od.price_at_order) as totalRevenue
            FROM orders o
            JOIN order_details od ON o.order_id = od.order_id
            -- [SỬA LỖI]: Phải join variant -> product -> category
            JOIN product_variants pv ON od.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            WHERE o.status = 'Hoàn Thành' 
              AND DATE(o.order_date) BETWEEN ? AND ?
            GROUP BY quarter, c.category_name
            ORDER BY quarter, totalRevenue DESC;
        `;

        try {
            const [rows] = await db.query(query, [startDate, endDate]);
            return rows;
        } catch (error) {
            console.error("SQL Error getRevenueByCategory:", error);
            return [];
        }
    },

    // 5. Tìm năm cũ nhất
    getEarliestOrderYear: async () => {
        try {
            const query = "SELECT MIN(YEAR(order_date)) as minYear FROM orders";
            const [rows] = await db.query(query);
            return rows[0].minYear || new Date().getFullYear();
        } catch (error) {
            console.error("SQL Error getEarliestOrderYear:", error);
            return new Date().getFullYear();
        }
    },

    // 6. Tính tổng giá trị hàng tồn kho
    getTotalInventoryValue: async () => {
        try {
            // [SỬA LỖI]: stock_quantity nằm ở bảng variants, cost_price nằm ở bảng products
            const query = `
                SELECT SUM(pv.stock_quantity * p.cost_price) AS total 
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.product_id
                WHERE pv.stock_quantity > 0
            `;
            const [rows] = await db.query(query);
            return rows[0].total || 0;
        } catch (error) {
            console.error("SQL Error getTotalInventoryValue:", error);
            return 0;
        }
    }
};

module.exports = dashboardModel;