-- ================================================================
-- CHỈ TẠO CẤU TRÚC BẢNG (SCHEMA + GIỮ DỮ LIỆU)
-- ================================================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;
DROP DATABASE IF EXISTS `store_management_db`;
CREATE DATABASE `store_management_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
USE `store_management_db`;

-- BẢNG roles
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT UNSIGNED NOT NULL PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `prefix` VARCHAR(10) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BẢNG users
CREATE TABLE `users` (
  `user_id` VARCHAR(15) NOT NULL PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  
  `token_version` INT DEFAULT 0,       -- Cột mới để quản lý đăng xuất
  `status` ENUM('Active', 'Inactive', 'Locked', 'Hoạt động', 'Đã khóa') NOT NULL DEFAULT 'Active',
  `must_change_password` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BẢNG customers (chỉ tạo 1 lần) - có thể liên kết tới user nếu khách hàng đăng ký
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` VARCHAR(15) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(15) NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `address` VARCHAR(255) NULL,
  `date_of_birth` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BẢNG employees
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` VARCHAR(15) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(15) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `date_of_birth` DATE NULL,
  `address` VARCHAR(255) NULL,
  `start_date` DATE NOT NULL,
  `employee_type` ENUM('Full-time','Part-time','Contract') NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `base_salary` DECIMAL(18,2) NOT NULL,
  `commission_rate` DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BẢNG salaries: net_salary là cột GENERATED STORED để tránh sai lệc
-- TẠO BẢNG MỚI
DROP TABLE IF EXISTS `salaries`;

-- TẠO BẢNG MỚI
CREATE TABLE IF NOT EXISTS `salaries` (
  `salary_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `employee_id` VARCHAR(15) NOT NULL,
  `month_year` DATE NOT NULL,
  `base_salary` DECIMAL(18,2) NOT NULL,
  `sales_commission` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `bonus` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `deductions` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `net_salary` DECIMAL(18,2) AS (base_salary + sales_commission + bonus - deductions) STORED,
  `paid_at` DATETIME NULL,
  `paid_status` ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid',
  UNIQUE KEY `uk_emp_month` (`employee_id`,`month_year`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE products (
    product_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT UNSIGNED NULL,
    description TEXT NULL,
    brand VARCHAR(100),
    base_price DECIMAL(18,2) NOT NULL,
    cost_price DECIMAL(18,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    avg_rating FLOAT DEFAULT 0,
    review_count INT DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);
CREATE TABLE product_variants (
    variant_id VARCHAR(25) PRIMARY KEY,
    product_id VARCHAR(20) NOT NULL,

    color VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,

    stock_quantity INT NOT NULL DEFAULT 0,
    additional_price DECIMAL(18,2) DEFAULT 0,   -- nếu size lớn +20k, optional

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,

    UNIQUE (product_id, color, size) -- không được trùng color + size
);
CREATE TABLE product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);


-- ORDERS: thêm thông tin địa chỉ giao hàng / người nhận để phục vụ đơn online
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` VARCHAR(20) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(15) NULL,
  `order_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_date` DATETIME NULL,
  `order_channel` ENUM('Trực tiếp','Online') NOT NULL,
  `direct_delivery` BOOLEAN NOT NULL DEFAULT FALSE,
  `subtotal` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `shipping_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `final_total` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status` ENUM('Đang Xử Lý','Đang Giao','Hoàn Thành','Đã Hủy') NOT NULL DEFAULT 'Đang xử lý',
  `payment_status` ENUM('Chưa Thanh Toán','Đã Thanh Toán','Đã Hoàn Tiền') NOT NULL DEFAULT 'Chưa Thanh Toán',
  `payment_method` ENUM('Tiền mặt','Thẻ tín dụng','Chuyển khoản') NOT NULL,
  `staff_id` VARCHAR(15) NOT NULL,
  `delivery_staff_id` VARCHAR(15) NULL,
  `note` TEXT NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE SET NULL,
  FOREIGN KEY (`staff_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`delivery_staff_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  INDEX idx_orders_customer (`customer_id`),
  INDEX idx_orders_staff (`staff_id`),
  INDEX idx_orders_delivery_staff (`delivery_staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ORDER_DETAILS

DROP TABLE IF EXISTS order_details;

CREATE TABLE order_details (
  order_id VARCHAR(20) NOT NULL,
  variant_id VARCHAR(25) NOT NULL,
  quantity INT NOT NULL,
  price_at_order DECIMAL(18,2) NOT NULL,

  PRIMARY KEY (order_id, variant_id),

  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT
);

-- STOCK_IN
CREATE TABLE IF NOT EXISTS `stock_in` (
  `stock_in_id` VARCHAR(20) NOT NULL PRIMARY KEY,
  `supplier_name` VARCHAR(100) NOT NULL,
  `import_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_cost` DECIMAL(18,2) NOT NULL,
  `user_id` VARCHAR(15) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT,
  INDEX idx_stock_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STOCK_IN_DETAILS
CREATE TABLE stock_in_details (
    stock_in_id VARCHAR(20) NOT NULL,
    variant_id VARCHAR(25) NOT NULL,
    quantity INT NOT NULL,
    cost_price DECIMAL(18,2) NOT NULL,

    PRIMARY KEY (stock_in_id, variant_id),

    FOREIGN KEY (stock_in_id) REFERENCES stock_in(stock_in_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT
);

SET FOREIGN_KEY_CHECKS = 1;
-- tăng khi nhập hàng --
DELIMITER //

CREATE TRIGGER trg_stock_in_add
AFTER INSERT ON stock_in_details
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE variant_id = NEW.variant_id;
END //

DELIMITER ;
-- giảm khi bán --
DELIMITER //

CREATE TRIGGER trg_order_details_add
AFTER INSERT ON order_details
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE variant_id = NEW.variant_id;
END //

DELIMITER ;
-- hoàn tồn khi đơn hủy --
DELIMITER //

CREATE TRIGGER trg_order_cancel_return_stock
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Chỉ thực thi khi đổi trạng thái sang "Đã Hủy"
    IF NEW.status = 'Đã Hủy' AND OLD.status <> 'Đã Hủy' THEN
        
        UPDATE product_variants pv
        JOIN order_details od ON od.variant_id = pv.variant_id
        SET pv.stock_quantity = pv.stock_quantity + od.quantity
        WHERE od.order_id = NEW.order_id;

    END IF;
END //

DELIMITER ;

-- Dữ liệu mẫu tối thiểu cho roles
INSERT IGNORE INTO `roles` (`role_id`, `role_name`, `prefix`, `description`) VALUES
(1,'Owner','OWNER','Quản lý toàn bộ hệ thống'),
(2,'Customer','CUS','Khách hàng mua sắm trực tuyến'),
(3,'Warehouse','WH','Quản lý nhập xuất, tồn kho'),
(4,'Sales','SALES','Nhân viên bán hàng trực tiếp'),
(5,'Online Sales','OS','Nhân viên xử lý đơn hàng online'),
(6,'Shipper','SHIP','Nhân viên giao hàng');


-- Users sample data

-- Owner
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('OWNER', 'OWNER', 'OWNER', 1, 'Active', TRUE);

-- Customers
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('US1', '0900000001', '0900000001', 2, 'Active', TRUE),
('US2', '0900000002', '0900000002', 2, 'Active', TRUE),
('US3', '0900000003', '0900000003', 2, 'Active', TRUE),
('US4', '0900000004', '0900000004', 2, 'Active', TRUE),
('US5', '0900000005', '0900000005', 2, 'Active', TRUE),
('US6', '0900000006', '0900000006', 2, 'Active', TRUE),
('US7', '0900000007', '0900000007', 2, 'Active', TRUE),
('US8', '0900000008', '0900000008', 2, 'Active', TRUE),
('US9', '0900000009', '0900000009', 2, 'Active', TRUE),
('US10', '0900000010', '0900000010', 2, 'Active', TRUE),
('US11', '0900000011', '0900000011', 2, 'Active', TRUE),
('US12', '0900000012', '0900000012', 2, 'Active', TRUE),
('US13', '0900000013', '0900000013', 2, 'Active', TRUE),
('US14', '0900000014', '0900000014', 2, 'Active', TRUE),
('US15', '0900000015', '0900000015', 2, 'Active', TRUE),
('US16', '0900000016', '0900000016', 2, 'Active', TRUE),
('US17', '0900000017', '0900000017', 2, 'Active', TRUE),
('US18', '0900000018', '0900000018', 2, 'Active', TRUE),
('US19', '0900000019', '0900000019', 2, 'Active', TRUE),
('US20', '0900000020', '0900000020', 2, 'Active', TRUE),
('US21', '0900000021', '0900000021', 2, 'Active', TRUE),
('US22', '0900000022', '0900000022', 2, 'Active', TRUE),
('US23', '0900000023', '0900000023', 2, 'Active', TRUE),
('US24', '0900000024', '0900000024', 2, 'Active', TRUE),
('US25', '0900000025', '0900000025', 2, 'Active', TRUE),
('US26', '0900000026', '0900000026', 2, 'Active', TRUE),
('US27', '0900000027', '0900000027', 2, 'Active', TRUE),
('US28', '0900000028', '0900000028', 2, 'Active', TRUE),
('US29', '0900000029', '0900000029', 2, 'Active', TRUE),
('US30', '0900000030', '0900000030', 2, 'Active', TRUE),
('US31', '0900000031', '0900000031', 2, 'Active', TRUE),
('US32', '0900000032', '0900000032', 2, 'Active', TRUE),
('US33', '0900000033', '0900000033', 2, 'Active', TRUE),
('US34', '0900000034', '0900000034', 2, 'Active', TRUE),
('US35', '0900000035', '0900000035', 2, 'Active', TRUE),
('US36', '0900000036', '0900000036', 2, 'Active', TRUE),
('US37', '0900000037', '0900000037', 2, 'Active', TRUE),
('US38', '0900000038', '0900000038', 2, 'Active', TRUE),
('US39', '0900000039', '0900000039', 2, 'Active', TRUE),
('US40', '0900000040', '0900000040', 2, 'Active', TRUE),
('US41', '0900000041', '0900000041', 2, 'Active', TRUE),
('US42', '0900000042', '0900000042', 2, 'Active', TRUE),
('US43', '0900000043', '0900000043', 2, 'Active', TRUE),
('US44', '0900000044', '0900000044', 2, 'Active', TRUE),
('US45', '0900000045', '0900000045', 2, 'Active', TRUE),
('US46', '0900000046', '0900000046', 2, 'Active', TRUE),
('US47', '0900000047', '0900000047', 2, 'Active', TRUE),
('US48', '0900000048', '0900000048', 2, 'Active', TRUE),
('US49', '0900000049', '0900000049', 2, 'Active', TRUE),
('US50', '0900000050', '0900000050', 2, 'Active', TRUE),
('US51', '0900000051', '0900000051', 2, 'Active', TRUE),
('US52', '0900000052', '0900000052', 2, 'Active', TRUE),
('US53', '0900000053', '0900000053', 2, 'Active', TRUE),
('US54', '0900000054', '0900000054', 2, 'Active', TRUE),
('US55', '0900000055', '0900000055', 2, 'Active', TRUE),
('US56', '0900000056', '0900000056', 2, 'Active', TRUE),
('US57', '0900000057', '0900000057', 2, 'Active', TRUE),
('US58', '0900000058', '0900000058', 2, 'Active', TRUE),
('US59', '0900000059', '0900000059', 2, 'Active', TRUE),
('US60', '0900000060', '0900000060', 2, 'Active', TRUE),
('US61', '0900000061', '0900000061', 2, 'Active', TRUE),
('US62', '0900000062', '0900000062', 2, 'Active', TRUE),
('US63', '0900000063', '0900000063', 2, 'Active', TRUE),
('US64', '0900000064', '0900000064', 2, 'Active', TRUE),
('US65', '0900000065', '0900000065', 2, 'Active', TRUE),
('US66', '0900000066', '0900000066', 2, 'Active', TRUE),
('US67', '0900000067', '0900000067', 2, 'Active', TRUE),
('US68', '0900000068', '0900000068', 2, 'Active', TRUE),
('US69', '0900000069', '0900000069', 2, 'Active', TRUE),
('US70', '0900000070', '0900000070', 2, 'Active', TRUE),
('US71', '0900000071', '0900000071', 2, 'Active', TRUE),
('US72', '0900000072', '0900000072', 2, 'Active', TRUE),
('US73', '0900000073', '0900000073', 2, 'Active', TRUE),
('US74', '0900000074', '0900000074', 2, 'Active', TRUE),
('US75', '0900000075', '0900000075', 2, 'Active', TRUE),
('US76', '0900000076', '0900000076', 2, 'Active', TRUE),
('US77', '0900000077', '0900000077', 2, 'Active', TRUE),
('US78', '0900000078', '0900000078', 2, 'Active', TRUE),
('US79', '0900000079', '0900000079', 2, 'Active', TRUE),
('US80', '0900000080', '0900000080', 2, 'Active', TRUE),
('US81', '0900000081', '0900000081', 2, 'Active', TRUE),
('US82', '0900000082', '0900000082', 2, 'Active', TRUE),
('US83', '0900000083', '0900000083', 2, 'Active', TRUE),
('US84', '0900000084', '0900000084', 2, 'Active', TRUE),
('US85', '0900000085', '0900000085', 2, 'Active', TRUE),
('US86', '0900000086', '0900000086', 2, 'Active', TRUE),
('US87', '0900000087', '0900000087', 2, 'Active', TRUE),
('US88', '0900000088', '0900000088', 2, 'Active', TRUE),
('US89', '0900000089', '0900000089', 2, 'Active', TRUE),
('US90', '0900000090', '0900000090', 2, 'Active', TRUE),
('US91', '0900000091', '0900000091', 2, 'Active', TRUE),
('US92', '0900000092', '0900000092', 2, 'Active', TRUE),
('US93', '0900000093', '0900000093', 2, 'Active', TRUE),
('US94', '0900000094', '0900000094', 2, 'Active', TRUE),
('US95', '0900000095', '0900000095', 2, 'Active', TRUE),
('US96', '0900000096', '0900000096', 2, 'Active', TRUE),
('US97', '0900000097', '0900000097', 2, 'Active', TRUE),
('US98', '0900000098', '0900000098', 2, 'Active', TRUE),
('US99', '0900000099', '0900000099', 2, 'Active', TRUE),
('US100', '0900000100', '0900000100', 2, 'Active', TRUE),
('US101', '0900000101', '0900000101', 2, 'Active', TRUE),
('US102', '0900000102', '0900000102', 2, 'Active', TRUE),
('US103', '0900000103', '0900000103', 2, 'Active', TRUE),
('US104', '0900000104', '0900000104', 2, 'Active', TRUE),
('US105', '0900000105', '0900000105', 2, 'Active', TRUE),
('US106', '0900000106', '0900000106', 2, 'Active', TRUE),
('US107', '0900000107', '0900000107', 2, 'Active', TRUE),
('US108', '0900000108', '0900000108', 2, 'Active', TRUE),
('US109', '0900000109', '0900000109', 2, 'Active', TRUE),
('US110', '0900000110', '0900000110', 2, 'Active', TRUE),
('US111', '0900000111', '0900000111', 2, 'Active', TRUE),
('US112', '0900000112', '0900000112', 2, 'Active', TRUE),
('US113', '0900000113', '0900000113', 2, 'Active', TRUE),
('US114', '0900000114', '0900000114', 2, 'Active', TRUE),
('US115', '0900000115', '0900000115', 2, 'Active', TRUE),
('US116', '0900000116', '0900000116', 2, 'Active', TRUE),
('US117', '0900000117', '0900000117', 2, 'Active', TRUE),
('US118', '0900000118', '0900000118', 2, 'Active', TRUE),
('US119', '0900000119', '0900000119', 2, 'Active', TRUE),
('US120', '0900000120', '0900000120', 2, 'Active', TRUE),
('US121', '0900000121', '0900000121', 2, 'Active', TRUE),
('US122', '0900000122', '0900000122', 2, 'Active', TRUE),
('US123', '0900000123', '0900000123', 2, 'Active', TRUE),
('US124', '0900000124', '0900000124', 2, 'Active', TRUE),
('US125', '0900000125', '0900000125', 2, 'Active', TRUE),
('US126', '0900000126', '0900000126', 2, 'Active', TRUE),
('US127', '0900000127', '0900000127', 2, 'Active', TRUE),
('US128', '0900000128', '0900000128', 2, 'Active', TRUE),
('US129', '0900000129', '0900000129', 2, 'Active', TRUE),
('US130', '0900000130', '0900000130', 2, 'Active', TRUE),
('US131', '0900000131', '0900000131', 2, 'Active', TRUE),
('US132', '0900000132', '0900000132', 2, 'Active', TRUE),
('US133', '0900000133', '0900000133', 2, 'Active', TRUE),
('US134', '0900000134', '0900000134', 2, 'Active', TRUE),
('US135', '0900000135', '0900000135', 2, 'Active', TRUE),
('US136', '0900000136', '0900000136', 2, 'Active', TRUE),
('US137', '0900000137', '0900000137', 2, 'Active', TRUE),
('US138', '0900000138', '0900000138', 2, 'Active', TRUE),
('US139', '0900000139', '0900000139', 2, 'Active', TRUE),
('US140', '0900000140', '0900000140', 2, 'Active', TRUE),
('US141', '0900000141', '0900000141', 2, 'Active', TRUE),
('US142', '0900000142', '0900000142', 2, 'Active', TRUE),
('US143', '0900000143', '0900000143', 2, 'Active', TRUE),
('US144', '0900000144', '0900000144', 2, 'Active', TRUE),
('US145', '0900000145', '0900000145', 2, 'Active', TRUE),
('US146', '0900000146', '0900000146', 2, 'Active', TRUE),
('US147', '0900000147', '0900000147', 2, 'Active', TRUE),
('US148', '0900000148', '0900000148', 2, 'Active', TRUE),
('US149', '0900000149', '0900000149', 2, 'Active', TRUE),
('US150', '0900000150', '0900000150', 2, 'Active', TRUE),
('US151', '0900000151', '0900000151', 2, 'Active', TRUE),
('US152', '0900000152', '0900000152', 2, 'Active', TRUE),
('US153', '0900000153', '0900000153', 2, 'Active', TRUE),
('US154', '0900000154', '0900000154', 2, 'Active', TRUE),
('US155', '0900000155', '0900000155', 2, 'Active', TRUE),
('US156', '0900000156', '0900000156', 2, 'Active', TRUE),
('US157', '0900000157', '0900000157', 2, 'Active', TRUE),
('US158', '0900000158', '0900000158', 2, 'Active', TRUE),
('US159', '0900000159', '0900000159', 2, 'Active', TRUE),
('US160', '0900000160', '0900000160', 2, 'Active', TRUE),
('US161', '0900000161', '0900000161', 2, 'Active', TRUE),
('US162', '0900000162', '0900000162', 2, 'Active', TRUE),
('US163', '0900000163', '0900000163', 2, 'Active', TRUE),
('US164', '0900000164', '0900000164', 2, 'Active', TRUE),
('US165', '0900000165', '0900000165', 2, 'Active', TRUE),
('US166', '0900000166', '0900000166', 2, 'Active', TRUE),
('US167', '0900000167', '0900000167', 2, 'Active', TRUE),
('US168', '0900000168', '0900000168', 2, 'Active', TRUE),
('US169', '0900000169', '0900000169', 2, 'Active', TRUE),
('US170', '0900000170', '0900000170', 2, 'Active', TRUE),
('US171', '0900000171', '0900000171', 2, 'Active', TRUE),
('US172', '0900000172', '0900000172', 2, 'Active', TRUE),
('US173', '0900000173', '0900000173', 2, 'Active', TRUE),
('US174', '0900000174', '0900000174', 2, 'Active', TRUE),
('US175', '0900000175', '0900000175', 2, 'Active', TRUE),
('US176', '0900000176', '0900000176', 2, 'Active', TRUE),
('US177', '0900000177', '0900000177', 2, 'Active', TRUE),
('US178', '0900000178', '0900000178', 2, 'Active', TRUE),
('US179', '0900000179', '0900000179', 2, 'Active', TRUE),
('US180', '0900000180', '0900000180', 2, 'Active', TRUE),
('US181', '0900000181', '0900000181', 2, 'Active', TRUE),
('US182', '0900000182', '0900000182', 2, 'Active', TRUE),
('US183', '0900000183', '0900000183', 2, 'Active', TRUE),
('US184', '0900000184', '0900000184', 2, 'Active', TRUE),
('US185', '0900000185', '0900000185', 2, 'Active', TRUE),
('US186', '0900000186', '0900000186', 2, 'Active', TRUE),
('US187', '0900000187', '0900000187', 2, 'Active', TRUE),
('US188', '0900000188', '0900000188', 2, 'Active', TRUE),
('US189', '0900000189', '0900000189', 2, 'Active', TRUE),
('US190', '0900000190', '0900000190', 2, 'Active', TRUE),
('US191', '0900000191', '0900000191', 2, 'Active', TRUE),
('US192', '0900000192', '0900000192', 2, 'Active', TRUE),
('US193', '0900000193', '0900000193', 2, 'Active', TRUE),
('US194', '0900000194', '0900000194', 2, 'Active', TRUE),
('US195', '0900000195', '0900000195', 2, 'Active', TRUE),
('US196', '0900000196', '0900000196', 2, 'Active', TRUE),
('US197', '0900000197', '0900000197', 2, 'Active', TRUE),
('US198', '0900000198', '0900000198', 2, 'Active', TRUE),
('US199', '0900000199', '0900000199', 2, 'Active', TRUE),
('US200', '0900000200', '0900000200', 2, 'Active', TRUE);
-- Warehouse
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('US201', 'WH01', 'WH01', 3, 'Active', TRUE),
('US202', 'WH02', 'WH02', 3, 'Active', TRUE),
('US203', 'WH03', 'WH03', 3, 'Active', TRUE);

-- Sales
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('US204', 'SALE1', 'SALE1', 4, 'Active', TRUE),
('US205', 'SALE2', 'SALE2', 4, 'Active', TRUE),
('US206', 'SALE3', 'SALE3', 4, 'Active', TRUE);

-- Online Sales
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('US207', 'OS01', 'OS01', 5, 'Active', TRUE),
('US208', 'OS02', 'OS02', 5, 'Active', TRUE),
('US209', 'OS03', 'OS03', 5, 'Active', TRUE);

-- Shipper
INSERT IGNORE INTO `users` (`user_id`, `username`, `password_hash`, `role_id`, `status`, `must_change_password`) VALUES
('US210', 'SHIP01', 'SHIP01', 6, 'Active', TRUE),
('US211', 'SHIP02', 'SHIP02', 6, 'Active', TRUE),
('US212', 'SHIP03', 'SHIP03', 6, 'Active', TRUE);

INSERT IGNORE INTO `employees`
(employee_id, user_id, full_name, email, phone, date_of_birth, address, start_date, employee_type, department, base_salary, commission_rate)
VALUES
-- Warehouse
('WH01', 'US201', 'Phạm Văn Hùng',   'wh01@store.com', '0901000001', '1990-01-01', 'Hà Nội', '2024-08-01', 'Full-time', 'Warehouse', 8000000, 0.0000),
('WH02', 'US202', 'Đỗ Thị Lan',      'wh02@store.com', '0901000002', '1991-02-02', 'Hà Nội', '2024-08-01', 'Full-time', 'Warehouse', 8000000, 0.0000),
('WH03', 'US203', 'Nguyễn Văn Tuấn','wh03@store.com', '0901000003', '1992-03-03', 'Hà Nội', '2024-08-01', 'Full-time', 'Warehouse', 8000000, 0.0000),

-- Sales
('SALE1', 'US204', 'Lê Thị Ngọc Anh', 'sa01@store.com', '0902000001', '1990-04-01', 'Hà Nội', '2024-08-01', 'Full-time', 'Sales', 7000000, 0.0500),
('SALE2', 'US205', 'Trần Văn Minh',   'sa02@store.com', '0902000002', '1991-05-02', 'Hà Nội', '2024-08-01', 'Full-time', 'Sales', 7000000, 0.0500),
('SALE3', 'US206', 'Phạm Thị Hương',  'sa03@store.com', '0902000003', '1992-06-03', 'Hà Nội', '2024-08-01', 'Full-time', 'Sales', 7000000, 0.0500),


-- Online Sales
('OS01', 'US207', 'Nguyễn Văn Dũng', 'os01@store.com', '0903000001', '1990-07-01', 'Hà Nội', '2024-08-01', 'Full-time', 'Online Sales', 7000000, 0.0500),
('OS02', 'US208', 'Lê Thị Thu Trang','os02@store.com', '0903000002', '1991-08-02', 'Hà Nội', '2024-08-01', 'Full-time', 'Online Sales', 7000000, 0.0500),
('OS03', 'US209', 'Trần Văn Khánh',  'os03@store.com', '0903000003', '1992-09-03', 'Hà Nội', '2024-08-01', 'Full-time', 'Online Sales', 7000000, 0.0500),


-- Shipper
('SHIP01', 'US210', 'Nguyễn Văn Hoàng', 'ship01@store.com', '0904000001', '1990-10-01', 'Hà Nội', '2024-08-01', 'Full-time', 'Shipper', 6000000, 0.0000),
('SHIP02', 'US211', 'Lê Thị Kim Oanh',  'ship02@store.com', '0904000002', '1991-11-02', 'Hà Nội', '2024-08-01', 'Full-time', 'Shipper', 6000000, 0.0000),
('SHIP03', 'US212', 'Trần Văn Phúc',    'ship03@store.com', '0904000003', '1992-12-03', 'Hà Nội', '2024-08-01', 'Full-time', 'Shipper', 6000000, 0.0000);

INSERT INTO `salaries` 
(salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202411','WH01','2024-11-01',8000000,0,500000,0,'2024-11-30','Paid'),
('SAL-WH02-202411','WH02','2024-11-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202411','WH03','2024-11-01',8000000,0,0,0,NULL,'Unpaid'),

('SAL-SALE1-202411','SALE1','2024-11-01',7000000,350000,200000,0,'2024-11-30','Paid'),
('SAL-SALE2-202411','SALE2','2024-11-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202411','SALE3','2024-11-01',7000000,300000,100000,0,NULL,'Unpaid'),

('SAL-OS01-202411','OS01','2024-11-01',7000000,300000,200000,0,'2024-11-30','Paid'),
('SAL-OS02-202411','OS02','2024-11-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202411','OS03','2024-11-01',7000000,200000,100000,0,NULL,'Unpaid'),

('SAL-SHIP01-202411','SHIP01','2024-11-01',6000000,0,0,0,'2024-11-30','Paid'),
('SAL-SHIP02-202411','SHIP02','2024-11-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202411','SHIP03','2024-11-01',6000000,0,0,0,NULL,'Unpaid');
INSERT INTO `salaries` 
(salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
-- Warehouse
('SAL-WH01-202412','WH01','2024-12-01',8000000,0,600000,0,'2024-12-30','Paid'),
('SAL-WH02-202412','WH02','2024-12-01',8000000,0,400000,0,NULL,'Unpaid'),
('SAL-WH03-202412','WH03','2024-12-01',8000000,0,0,0,NULL,'Unpaid'),

-- Sales
('SAL-SALE1-202412','SALE1','2024-12-01',7000000,360000,250000,0,'2024-12-30','Paid'),
('SAL-SALE2-202412','SALE2','2024-12-01',7000000,420000,200000,0,NULL,'Unpaid'),
('SAL-SALE3-202412','SALE3','2024-12-01',7000000,310000,150000,0,NULL,'Unpaid'),

-- Online Sales
('SAL-OS01-202412','OS01','2024-12-01',7000000,320000,250000,0,'2024-12-30','Paid'),
('SAL-OS02-202412','OS02','2024-12-01',7000000,270000,200000,0,NULL,'Unpaid'),
('SAL-OS03-202412','OS03','2024-12-01',7000000,220000,150000,0,NULL,'Unpaid'),

-- Shipper
('SAL-SHIP01-202412','SHIP01','2024-12-01',6000000,0,0,0,'2024-12-30','Paid'),
('SAL-SHIP02-202412','SHIP02','2024-12-01',6000000,0,60000,0,NULL,'Unpaid'),
('SAL-SHIP03-202412','SHIP03','2024-12-01',6000000,0,0,0,NULL,'Unpaid');
-- DỮ LIỆU LƯƠNG NĂM 2025

-- Tháng 01
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202501','WH01','2025-01-01',8000000,0,500000,0,'2025-01-31','Paid'),
('SAL-WH02-202501','WH02','2025-01-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202501','WH03','2025-01-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202501','SALE1','2025-01-01',7000000,350000,200000,0,'2025-01-31','Paid'),
('SAL-SALE2-202501','SALE2','2025-01-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202501','SALE3','2025-01-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202501','OS01','2025-01-01',7000000,300000,200000,0,'2025-01-31','Paid'),
('SAL-OS02-202501','OS02','2025-01-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202501','OS03','2025-01-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202501','SHIP01','2025-01-01',6000000,0,0,0,'2025-01-31','Paid'),
('SAL-SHIP02-202501','SHIP02','2025-01-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202501','SHIP03','2025-01-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 02
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202502','WH01','2025-02-01',8000000,0,500000,0,'2025-02-28','Paid'),
('SAL-WH02-202502','WH02','2025-02-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202502','WH03','2025-02-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202502','SALE1','2025-02-01',7000000,350000,200000,0,'2025-02-28','Paid'),
('SAL-SALE2-202502','SALE2','2025-02-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202502','SALE3','2025-02-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202502','OS01','2025-02-01',7000000,300000,200000,0,'2025-02-28','Paid'),
('SAL-OS02-202502','OS02','2025-02-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202502','OS03','2025-02-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202502','SHIP01','2025-02-01',6000000,0,0,0,'2025-02-28','Paid'),
('SAL-SHIP02-202502','SHIP02','2025-02-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202502','SHIP03','2025-02-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 03
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202503','WH01','2025-03-01',8000000,0,500000,0,'2025-03-31','Paid'),
('SAL-WH02-202503','WH02','2025-03-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202503','WH03','2025-03-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202503','SALE1','2025-03-01',7000000,350000,200000,0,'2025-03-31','Paid'),
('SAL-SALE2-202503','SALE2','2025-03-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202503','SALE3','2025-03-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202503','OS01','2025-03-01',7000000,300000,200000,0,'2025-03-31','Paid'),
('SAL-OS02-202503','OS02','2025-03-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202503','OS03','2025-03-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202503','SHIP01','2025-03-01',6000000,0,0,0,'2025-03-31','Paid'),
('SAL-SHIP02-202503','SHIP02','2025-03-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202503','SHIP03','2025-03-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 04
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202504','WH01','2025-04-01',8000000,0,500000,0,'2025-04-30','Paid'),
('SAL-WH02-202504','WH02','2025-04-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202504','WH03','2025-04-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202504','SALE1','2025-04-01',7000000,350000,200000,0,'2025-04-30','Paid'),
('SAL-SALE2-202504','SALE2','2025-04-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202504','SALE3','2025-04-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202504','OS01','2025-04-01',7000000,300000,200000,0,'2025-04-30','Paid'),
('SAL-OS02-202504','OS02','2025-04-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202504','OS03','2025-04-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202504','SHIP01','2025-04-01',6000000,0,0,0,'2025-04-30','Paid'),
('SAL-SHIP02-202504','SHIP02','2025-04-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202504','SHIP03','2025-04-01',6000000,0,0,0,NULL,'Unpaid');
-- Tháng 05/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202505','WH01','2025-05-01',8000000,0,500000,0,'2025-05-31','Paid'),
('SAL-WH02-202505','WH02','2025-05-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202505','WH03','2025-05-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202505','SALE1','2025-05-01',7000000,350000,200000,0,'2025-05-31','Paid'),
('SAL-SALE2-202505','SALE2','2025-05-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202505','SALE3','2025-05-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202505','OS01','2025-05-01',7000000,300000,200000,0,'2025-05-31','Paid'),
('SAL-OS02-202505','OS02','2025-05-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202505','OS03','2025-05-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202505','SHIP01','2025-05-01',6000000,0,0,0,'2025-05-31','Paid'),
('SAL-SHIP02-202505','SHIP02','2025-05-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202505','SHIP03','2025-05-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 06/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202506','WH01','2025-06-01',8000000,0,500000,0,'2025-06-30','Paid'),
('SAL-WH02-202506','WH02','2025-06-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202506','WH03','2025-06-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202506','SALE1','2025-06-01',7000000,350000,200000,0,'2025-06-30','Paid'),
('SAL-SALE2-202506','SALE2','2025-06-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202506','SALE3','2025-06-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202506','OS01','2025-06-01',7000000,300000,200000,0,'2025-06-30','Paid'),
('SAL-OS02-202506','OS02','2025-06-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202506','OS03','2025-06-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202506','SHIP01','2025-06-01',6000000,0,0,0,'2025-06-30','Paid'),
('SAL-SHIP02-202506','SHIP02','2025-06-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202506','SHIP03','2025-06-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 07/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202507','WH01','2025-07-01',8000000,0,500000,0,'2025-07-31','Paid'),
('SAL-WH02-202507','WH02','2025-07-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202507','WH03','2025-07-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202507','SALE1','2025-07-01',7000000,350000,200000,0,'2025-07-31','Paid'),
('SAL-SALE2-202507','SALE2','2025-07-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202507','SALE3','2025-07-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202507','OS01','2025-07-01',7000000,300000,200000,0,'2025-07-31','Paid'),
('SAL-OS02-202507','OS02','2025-07-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202507','OS03','2025-07-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202507','SHIP01','2025-07-01',6000000,0,0,0,'2025-07-31','Paid'),
('SAL-SHIP02-202507','SHIP02','2025-07-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202507','SHIP03','2025-07-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 08/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202508','WH01','2025-08-01',8000000,0,500000,0,'2025-08-31','Paid'),
('SAL-WH02-202508','WH02','2025-08-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202508','WH03','2025-08-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202508','SALE1','2025-08-01',7000000,350000,200000,0,'2025-08-31','Paid'),
('SAL-SALE2-202508','SALE2','2025-08-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202508','SALE3','2025-08-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202508','OS01','2025-08-01',7000000,300000,200000,0,'2025-08-31','Paid'),
('SAL-OS02-202508','OS02','2025-08-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202508','OS03','2025-08-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202508','SHIP01','2025-08-01',6000000,0,0,0,'2025-08-31','Paid'),
('SAL-SHIP02-202508','SHIP02','2025-08-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202508','SHIP03','2025-08-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 09/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202509','WH01','2025-09-01',8000000,0,500000,0,'2025-09-30','Paid'),
('SAL-WH02-202509','WH02','2025-09-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202509','WH03','2025-09-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202509','SALE1','2025-09-01',7000000,350000,200000,0,'2025-09-30','Paid'),
('SAL-SALE2-202509','SALE2','2025-09-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202509','SALE3','2025-09-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202509','OS01','2025-09-01',7000000,300000,200000,0,'2025-09-30','Paid'),
('SAL-OS02-202509','OS02','2025-09-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202509','OS03','2025-09-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202509','SHIP01','2025-09-01',6000000,0,0,0,'2025-09-30','Paid'),
('SAL-SHIP02-202509','SHIP02','2025-09-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202509','SHIP03','2025-09-01',6000000,0,0,0,NULL,'Unpaid');

-- Tháng 10/2025
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202510','WH01','2025-10-01',8000000,0,500000,0,'2025-10-31','Paid'),
('SAL-WH02-202510','WH02','2025-10-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202510','WH03','2025-10-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202510','SALE1','2025-10-01',7000000,350000,200000,0,'2025-10-31','Paid'),
('SAL-SALE2-202510','SALE2','2025-10-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202510','SALE3','2025-10-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202510','OS01','2025-10-01',7000000,300000,200000,0,'2025-10-31','Paid'),
('SAL-OS02-202510','OS02','2025-10-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202510','OS03','2025-10-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202510','SHIP01','2025-10-01',6000000,0,0,0,'2025-10-31','Paid'),
('SAL-SHIP02-202510','SHIP02','2025-10-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202510','SHIP03','2025-10-01',6000000,0,0,0,NULL,'Unpaid');
-- Tháng 11 (tất cả Unpaid)
INSERT INTO `salaries` (salary_id, employee_id, month_year, base_salary, sales_commission, bonus, deductions, paid_at, paid_status)
VALUES
('SAL-WH01-202511','WH01','2025-11-01',8000000,0,500000,0,NULL,'Unpaid'),
('SAL-WH02-202511','WH02','2025-11-01',8000000,0,300000,0,NULL,'Unpaid'),
('SAL-WH03-202511','WH03','2025-11-01',8000000,0,0,0,NULL,'Unpaid'),
('SAL-SALE1-202511','SALE1','2025-11-01',7000000,350000,200000,0,NULL,'Unpaid'),
('SAL-SALE2-202511','SALE2','2025-11-01',7000000,400000,150000,0,NULL,'Unpaid'),
('SAL-SALE3-202511','SALE3','2025-11-01',7000000,300000,100000,0,NULL,'Unpaid'),
('SAL-OS01-202511','OS01','2025-11-01',7000000,300000,200000,0,NULL,'Unpaid'),
('SAL-OS02-202511','OS02','2025-11-01',7000000,250000,150000,0,NULL,'Unpaid'),
('SAL-OS03-202511','OS03','2025-11-01',7000000,200000,100000,0,NULL,'Unpaid'),
('SAL-SHIP01-202511','SHIP01','2025-11-01',6000000,0,0,0,NULL,'Unpaid'),
('SAL-SHIP02-202511','SHIP02','2025-11-01',6000000,0,50000,0,NULL,'Unpaid'),
('SAL-SHIP03-202511','SHIP03','2025-11-01',6000000,0,0,0,NULL,'Unpaid');
-- Categories
INSERT IGNORE INTO `categories` (`category_name`,`description`) VALUES
('Thời trang nữ', 'Các sản phẩm quần áo dành cho nữ'),
('Thời trang nam', 'Các sản phẩm quần áo dành cho nam'),
('Thời trang trẻ em', 'Quần áo và phụ kiện dành cho trẻ em'),
('Giày dép', 'Giày, dép, sandal cho nam và nữ'),
('Phụ kiện thời trang', 'Túi xách, ví, thắt lưng, mũ, kính'),
('Mỹ phẩm trang điểm', 'Sản phẩm makeup dành cho mặt, mắt, môi'),
('Chăm sóc da', 'Các sản phẩm skincare như serum, toner, kem dưỡng'),
('Chăm sóc tóc – cơ thể', 'Dầu gội, dầu xả, sữa tắm, lotion'),
('Nước hoa', 'Nước hoa nam, nữ, unisex'),
('Đồ lót', 'Đồ lót nam nữ và đồ ngủ'),
('Trang sức', 'Phụ kiện trang sức: vòng, nhẫn, bông tai'),
('Túi xách – Balo', 'Các loại túi xách và balo thời trang'),
('Set quà tặng', 'Hộp quà mỹ phẩm, combo sản phẩm'),
('Phụ kiện điện thoại', 'Ốp lưng, kính cường lực (nếu cửa hàng có bán)'),
('Đồ thể thao', 'Quần áo và phụ kiện thể thao'),
('Đồ ngủ – Pijama', 'Bộ đồ ngủ cho nam, nữ'),
('Sandal – Dép', 'Các loại dép và sandal thời trang'),
('Sneaker – Giày thời trang', 'Giày sneaker và giày casual cho mọi giới');


SET FOREIGN_KEY_CHECKS = 1;
-- Tắt kiểm tra khóa ngoại
-- Tắt kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 0;


-- 1. Chèn dữ liệu bảng STOCK_IN (Phiếu nhập kho)
INSERT INTO stock_in (stock_in_id, supplier_name, import_date, total_cost, user_id) VALUES
-- 08/2024 (Nhập tồn đầu kỳ lớn)
('SI0001','Công ty Thời Trang A',   '2024-08-01 09:00:00', 250000000, 'WH01'),
('SI0002','Công ty May Mặc B',      '2024-08-10 10:00:00', 380000000, 'WH02'),
('SI0003','Công ty Giày C',         '2024-08-20 08:30:00', 450000000, 'WH03'),

-- 09/2024
('SI0004','Công ty D',              '2024-09-01 09:00:00', 180000000, 'WH01'),
('SI0005','Công ty E',              '2024-09-10 10:00:00', 150000000, 'WH02'),
('SI0006','Công ty F',              '2024-09-20 08:30:00', 220000000, 'WH03'),

-- 10/2024 (Chuẩn bị hàng cho mùa sale cuối năm)
('SI0007','Công ty G',              '2024-10-01 09:00:00', 300000000, 'WH01'),
('SI0008','Công ty H',              '2024-10-10 10:00:00', 280000000, 'WH02'),
('SI0009','Công ty I',              '2024-10-20 08:30:00', 190000000, 'WH03'),

-- 11/2024
('SI0010','Công ty J',              '2024-11-01 09:00:00', 150000000, 'WH01'),
('SI0011','Công ty A',              '2024-11-10 10:00:00', 200000000, 'WH02'),
('SI0012','Công ty B',              '2024-11-20 08:30:00', 120000000, 'WH03'),

-- 12/2024
('SI0013','Công ty C',              '2024-12-01 09:00:00', 180000000, 'WH01'),
('SI0014','Công ty D',              '2024-12-10 10:00:00', 450000000, 'WH02'), -- Nhập nhiều nước hoa
('SI0015','Công ty Sữa E',          '2024-12-20 08:30:00', 110000000, 'WH03'),

-- 01/2025
('SI0016','Công ty F',              '2025-01-01 09:00:00', 250000000, 'WH01'),
('SI0017','Công ty G',              '2025-01-10 10:00:00', 150000000, 'WH02'),
('SI0018','Công ty H',              '2025-01-20 08:30:00', 320000000, 'WH03'),

-- 02/2025
('SI0019','Công ty I',              '2025-02-01 09:00:00', 140000000, 'WH01'),
('SI0020','Công ty J',              '2025-02-10 10:00:00', 280000000, 'WH02'),
('SI0021','Công ty A',              '2025-02-20 08:30:00', 190000000, 'WH03'),

-- 03/2025
('SI0022','Công ty B',              '2025-03-01 09:00:00', 210000000, 'WH01'),
('SI0023','Công ty C',              '2025-03-10 10:00:00', 160000000, 'WH02'),
('SI0024','Công ty D',              '2025-03-20 08:30:00', 180000000, 'WH03'),

-- 04/2025
('SI0025','Công ty E',              '2025-04-01 09:00:00', 150000000, 'WH01'),
('SI0026','Công ty F',              '2025-04-10 10:00:00', 200000000, 'WH02'),
('SI0027','Công ty G',              '2025-04-20 08:30:00', 170000000, 'WH03'),

-- 05/2025
('SI0028','Công ty H',              '2025-05-01 09:00:00', 220000000, 'WH01'),
('SI0029','Công ty I',              '2025-05-10 10:00:00', 350000000, 'WH02'),
('SI0030','Công ty J',              '2025-05-20 08:30:00', 180000000, 'WH03'),

-- 06/2025
('SI0031','Công ty A',              '2025-06-01 09:00:00', 160000000, 'WH01'),
('SI0032','Công ty B',              '2025-06-10 10:00:00', 190000000, 'WH02'),
('SI0033','Công ty C',              '2025-06-20 08:30:00', 210000000, 'WH03'),

-- 07/2025
('SI0034','Công ty D',              '2025-07-01 09:00:00', 140000000, 'WH01'),
('SI0035','Công ty E',              '2025-07-10 10:00:00', 150000000, 'WH02'),
('SI0036','Công ty F',              '2025-07-20 08:30:00', 300000000, 'WH03'),

-- 08/2025
('SI0037','Công ty G',              '2025-08-01 09:00:00', 280000000, 'WH01'),
('SI0038','Công ty H',              '2025-08-10 10:00:00', 220000000, 'WH02'),
('SI0039','Công ty I',              '2025-08-20 08:30:00', 130000000, 'WH03'),

-- 09/2025
('SI0040','Công ty J',              '2025-09-01 09:00:00', 190000000, 'WH01'),
('SI0041','Công ty A',              '2025-09-10 10:00:00', 250000000, 'WH02'),
('SI0042','Công ty Rau củ B',       '2025-09-20 08:30:00', 160000000, 'WH03'),

-- 10/2025
('SI0043','Công ty C',              '2025-10-01 09:00:00', 210000000, 'WH01'),
('SI0044','Công ty D',              '2025-10-10 10:00:00', 180000000, 'WH02'),
('SI0045','Công ty E',              '2025-10-20 08:30:00', 220000000, 'WH03'),

-- 11/2025
('SI0046','Công ty F',              '2025-11-01 09:00:00', 200000000, 'WH01'),
('SI0047','Công ty G',              '2025-11-10 10:00:00', 150000000, 'WH02'),
('SI0048','Công ty H',              '2025-11-20 08:30:00', 400000000, 'WH03');
-- 2. Chèn dữ liệu bảng STOCK_IN_DETAILS (Chi tiết nhập kho)
-- Mỗi phiếu nhập 5 sản phẩm, bạn có thể thay product_id phù hợp với bảng products
-- ============================
-- BẢNG STOCK_IN_DETAILS (FULL 144 DÒNG)
-- ============================

INSERT INTO stock_in_details (stock_in_id, variant_id, quantity, cost_price) VALUES
-- SI0001 (Thời trang)
('SI0001','V001_1', 200, 250000), ('SI0001','V002_1', 500, 80000), ('SI0001','V003_1', 300, 350000),
-- SI0002 (Blazer & Váy)
('SI0002','V004_1', 300, 100000), ('SI0002','V005_1', 600, 500000), ('SI0002','V006_1', 200, 200000),
-- SI0003 (Giày)
('SI0003','V007_1', 300, 280000), ('SI0003','V008_1', 400, 300000), ('SI0003','V009_1', 500, 150000),
-- SI0004
('SI0004','V010_1', 100, 450000), ('SI0004','V011_1', 300, 150000), ('SI0004','V012_1', 300, 100000),
-- SI0005
('SI0005','V013_1', 400, 70000),  ('SI0005','V014_1', 400, 200000), ('SI0005','V015_1', 500, 50000),
-- SI0006
('SI0006','V016_1', 200, 280000), ('SI0006','V017_1', 200, 400000), ('SI0006','V018_1', 100, 800000),
-- SI0007
('SI0007','V019_1', 300, 300000), ('SI0007','V020_1', 300, 200000), ('SI0007','V021_1', 300, 400000),
-- SI0008
('SI0008','V022_1', 300, 400000), ('SI0008','V023_1', 200, 500000), ('SI0008','V024_1', 200, 150000),
-- SI0009
('SI0009','V025_1', 100, 250000), ('SI0009','V026_1', 500, 100000), ('SI0009','V027_1', 500, 200000),
-- SI0010
('SI0010','V028_1', 300, 150000), ('SI0010','V029_1', 200, 250000), ('SI0010','V030_1', 300, 110000),
-- SI0011
('SI0011','V031_1', 400, 200000), ('SI0011','V032_1', 200, 600000), ('SI0011','V033_1', 200, 200000),
-- SI0012
('SI0012','V034_1', 200, 300000), ('SI0012','V035_1', 300, 180000), ('SI0012','V036_1', 200, 140000),
-- SI0013
('SI0013','V037_1', 300, 160000), ('SI0013','V038_1', 400, 110000), ('SI0013','V039_1', 500, 90000),
-- SI0014 (Nước hoa)
('SI0014','V040_1', 100, 80000),  ('SI0014','V041_1', 100, 1800000), ('SI0014','V042_1', 100, 2500000),
-- SI0015
('SI0015','V043_1', 200, 180000), ('SI0015','V044_1', 500, 80000),  ('SI0015','V045_1', 200, 200000),
-- SI0016
('SI0016','V046_1', 300, 150000), ('SI0016','V047_1', 500, 80000),  ('SI0016','V048_1', 300, 250000),
-- SI0017
('SI0017','V049_1', 300, 60000),  ('SI0017','V050_1', 200, 300000), ('SI0017','V051_1', 300, 200000),
-- SI0018
('SI0018','V052_1', 100, 1000000), ('SI0018','V053_1', 300, 60000), ('SI0018','V054_1', 300, 100000),
-- SI0019
('SI0019','V055_1', 200, 150000), ('SI0019','V056_1', 500, 40000),  ('SI0019','V057_1', 300, 280000),
-- SI0020
('SI0020','V058_1', 200, 220000), ('SI0020','V059_1', 100, 500000), ('SI0020','V060_1', 200, 800000),
-- SI0021
('SI0021','V061_1', 200, 350000), ('SI0021','V062_1', 200, 200000), ('SI0021','V063_1', 100, 600000),
-- SI0022
('SI0022','V064_1', 200, 250000), ('SI0022','V065_1', 200, 400000), ('SI0022','V066_1', 100, 600000),
-- SI0023
('SI0023','V067_1', 500, 20000),  ('SI0023','V068_1', 500, 70000),  ('SI0023','V069_1', 300, 200000),
-- SI0024
('SI0024','V070_1', 200, 180000), ('SI0024','V071_1', 200, 250000), ('SI0024','V072_1', 200, 300000),
-- SI0025
('SI0025','V073_1', 300, 100000), ('SI0025','V074_1', 300, 80000),  ('SI0025','V075_1', 500, 40000),
-- SI0026
('SI0026','V076_1', 200, 280000), ('SI0026','V077_1', 300, 150000), ('SI0026','V078_1', 300, 180000),
-- SI0027
('SI0027','V079_1', 200, 250000), ('SI0027','V080_1', 200, 120000), ('SI0027','V081_1', 400, 200000),
-- SI0028
('SI0028','V082_1', 300, 150000), ('SI0028','V083_1', 300, 100000), ('SI0028','V084_1', 300, 250000),
-- SI0029 (Giày Sneaker hiệu)
('SI0029','V085_1', 500, 15000),  ('SI0029','V086_1', 100, 1800000), ('SI0029','V087_1', 80, 2000000),
-- SI0030
('SI0030','V088_1', 100, 900000), ('SI0030','V089_1', 100, 1200000), ('SI0030','V090_1', 100, 700000),
-- SI0031
('SI0031','V001_2', 200, 250000), ('SI0031','V002_2', 300, 80000),  ('SI0031','V003_2', 200, 350000),
-- SI0032
('SI0032','V004_2', 300, 100000), ('SI0032','V005_2', 200, 500000), ('SI0032','V006_2', 300, 200000),
-- SI0033
('SI0033','V007_2', 200, 280000), ('SI0033','V008_2', 200, 300000), ('SI0033','V009_2', 300, 150000),
-- SI0034
('SI0034','V010_2', 100, 450000), ('SI0034','V011_2', 200, 150000), ('SI0034','V012_2', 300, 100000),
-- SI0035
('SI0035','V026_2', 300, 100000), ('SI0035','V027_2', 200, 200000), ('SI0035','V028_2', 300, 150000),
-- SI0036 (Nước hoa)
('SI0036','V041_2', 80, 1800000), ('SI0036','V042_2', 80, 2500000), ('SI0036','V043_2', 200, 180000),
-- SI0037
('SI0037','V016_2', 200, 280000), ('SI0037','V086_2', 100, 1800000), ('SI0037','V087_2', 80, 2000000),
-- SI0038
('SI0038','V056_2', 300, 40000),  ('SI0038','V057_2', 200, 280000),  ('SI0038','V060_2', 150, 800000),
-- SI0039
('SI0039','V046_2', 200, 150000), ('SI0039','V047_2', 300, 80000),  ('SI0039','V049_2', 300, 60000),
-- SI0040
('SI0040','V031_1', 200, 200000), ('SI0040','V032_2', 150, 600000), ('SI0040','V034_2', 200, 300000),
-- SI0041
('SI0041','V022_2', 200, 400000), ('SI0041','V025_2', 200, 250000), ('SI0041','V066_2', 100, 600000),
-- SI0042
('SI0042','V081_2', 300, 200000), ('SI0042','V082_2', 300, 150000), ('SI0042','V083_2', 300, 100000),
-- SI0043
('SI0043','V026_1', 300, 100000), ('SI0043','V029_2', 200, 250000), ('SI0043','V030_2', 300, 110000),
-- SI0044
('SI0044','V074_2', 200, 80000),  ('SI0044','V075_1', 500, 40000),  ('SI0044','V071_2', 200, 250000),
-- SI0045
('SI0045','V036_2', 300, 140000), ('SI0045','V037_2', 300, 160000), ('SI0045','V040_2', 300, 80000),
-- SI0046
('SI0046','V066_1', 100, 600000), ('SI0046','V067_2', 300, 20000),  ('SI0046','V068_2', 300, 70000),
-- SI0047
('SI0047','V076_2', 200, 280000), ('SI0047','V077_2', 200, 150000), ('SI0047','V079_2', 200, 250000),
-- SI0048
('SI0048','V088_2', 100, 900000), ('SI0048','V089_2', 100, 1200000), ('SI0048','V090_2', 100, 700000);

INSERT INTO orders (order_id, customer_id, order_date, completed_date, order_channel, direct_delivery, subtotal, shipping_cost, final_total, status, payment_status, payment_method, staff_id, delivery_staff_id) VALUES
-- THÁNG 11/2024 (Tổng ~150 Triệu)
('ORD001','CUS1','2024-11-05 10:00:00','2024-11-06 14:00:00','Online',FALSE, 45000000, 50000, 45050000, 'Hoàn Thành','Đã Thanh Toán','Chuyển khoản','SALE1','SHIP01'),
('ORD002','CUS2','2024-11-07 11:30:00','2024-11-07 12:00:00','Trực tiếp',TRUE, 8200000, 0, 8200000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD003','CUS3','2024-11-10 09:45:00','2024-11-11 12:30:00','Online',FALSE, 62000000, 100000, 62100000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),
('ORD004','CUS4','2024-11-15 14:00:00',NULL,'Trực tiếp',TRUE, 15000000, 0, 15000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE1',NULL),
('ORD005','CUS5','2024-11-20 13:20:00','2024-11-21 10:00:00','Online',FALSE, 25000000, 30000, 25030000, 'Hoàn Thành','Đã Thanh Toán','Chuyển khoản','SALE2','SHIP01'),

-- THÁNG 12/2024 (Tổng ~180 Triệu)
('ORD006','CUS6','2024-12-02 09:15:00','2024-12-03 11:30:00','Online',FALSE, 55000000, 50000, 55050000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS01','SHIP02'),
('ORD007','CUS7','2024-12-05 10:20:00',NULL,'Trực tiếp',TRUE, 22000000, 0, 22000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD008','CUS8','2024-12-12 11:45:00','2024-12-13 14:50:00','Online',FALSE, 48000000, 40000, 48040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS03','SHIP03'),
('ORD009','CUS9','2024-12-20 14:10:00',NULL,'Trực tiếp',TRUE, 35000000, 0, 35000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE1',NULL),
('ORD010','CUS10','2024-12-25 10:05:00','2024-12-26 13:20:00','Online',FALSE, 25000000, 30000, 25030000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS02','SHIP01'),

-- THÁNG 01/2025 (Tổng ~130 Triệu)
('ORD011','CUS11','2025-01-05 10:00:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD012','CUS12','2025-01-10 15:30:00','2025-01-11 16:20:00','Online',FALSE, 38000000, 40000, 38040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS03','SHIP01'),
('ORD013','CUS13','2025-01-15 09:50:00','2025-01-16 11:40:00','Online',FALSE, 32000000, 30000, 32030000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE1','SHIP02'),
('ORD014','CUS14','2025-01-25 15:10:00',NULL,'Trực tiếp',TRUE, 28000000, 0, 28000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),

-- THÁNG 02/2025 (Tổng ~110 Triệu)
('ORD015','CUS15','2025-02-05 09:30:00','2025-02-06 12:00:00','Online',FALSE, 45000000, 40000, 45040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD016','CUS16','2025-02-14 10:45:00',NULL,'Trực tiếp',TRUE, 55000000, 0, 55000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD017','CUS17','2025-02-20 11:50:00','2025-02-21 14:20:00','Online',FALSE, 12000000, 20000, 12020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 03/2025 (Tổng ~105 Triệu)
('ORD018','CUS18','2025-03-05 09:30:00','2025-03-06 12:00:00','Online',FALSE, 65000000, 40000, 65040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD019','CUS19','2025-03-14 10:45:00',NULL,'Trực tiếp',TRUE, 30000000, 0, 30000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD020','CUS20','2025-03-20 11:50:00','2025-03-21 14:20:00','Online',FALSE, 12000000, 20000, 12020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 04/2025 (Tổng ~110 Triệu)
('ORD021','CUS21','2025-04-05 09:30:00','2025-04-06 12:00:00','Online',FALSE, 55000000, 40000, 55040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD022','CUS22','2025-04-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD023','CUS23','2025-04-20 11:50:00','2025-04-21 14:20:00','Online',FALSE, 15000000, 20000, 15020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 05/2025 (Tổng ~120 Triệu)
('ORD024','CUS24','2025-05-05 09:30:00','2025-05-06 12:00:00','Online',FALSE, 60000000, 40000, 60040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD025','CUS25','2025-05-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD026','CUS26','2025-05-20 11:50:00','2025-05-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 06/2025 (Tổng ~115 Triệu)
('ORD027','CUS27','2025-06-05 09:30:00','2025-06-06 12:00:00','Online',FALSE, 55000000, 40000, 55040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD028','CUS28','2025-06-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD029','CUS29','2025-06-20 11:50:00','2025-06-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 07/2025 (Tổng ~105 Triệu)
('ORD030','CUS30','2025-07-05 09:30:00','2025-07-06 12:00:00','Online',FALSE, 45000000, 40000, 45040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD031','CUS31','2025-07-14 10:45:00',NULL,'Trực tiếp',TRUE, 35000000, 0, 35000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD032','CUS32','2025-07-20 11:50:00','2025-07-21 14:20:00','Online',FALSE, 25000000, 20000, 25020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 08/2025 (Tổng ~120 Triệu)
('ORD033','CUS33','2025-08-05 09:30:00','2025-08-06 12:00:00','Online',FALSE, 60000000, 40000, 60040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD034','CUS34','2025-08-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD035','CUS35','2025-08-20 11:50:00','2025-08-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 09/2025 (Tổng ~125 Triệu)
('ORD036','CUS36','2025-09-05 09:30:00','2025-09-06 12:00:00','Online',FALSE, 65000000, 40000, 65040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD037','CUS37','2025-09-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD038','CUS38','2025-09-20 11:50:00','2025-09-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 10/2025 (Tổng ~110 Triệu)
('ORD039','CUS39','2025-10-05 09:30:00','2025-10-06 12:00:00','Online',FALSE, 50000000, 40000, 50040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD040','CUS40','2025-10-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD041','CUS41','2025-10-20 11:50:00','2025-10-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02'),

-- THÁNG 11/2025 (Tổng ~115 Triệu)
('ORD042','CUS42','2025-11-05 09:30:00','2025-11-06 12:00:00','Online',FALSE, 55000000, 40000, 55040000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','OS01','SHIP01'),
('ORD043','CUS43','2025-11-14 10:45:00',NULL,'Trực tiếp',TRUE, 40000000, 0, 40000000, 'Hoàn Thành','Đã Thanh Toán','Tiền mặt','SALE2',NULL),
('ORD044','CUS44','2025-11-20 11:50:00','2025-11-21 14:20:00','Online',FALSE, 20000000, 20000, 20020000, 'Hoàn Thành','Đã Thanh Toán','Thẻ tín dụng','OS03','SHIP02');
INSERT INTO order_details (order_id, variant_id, quantity, price_at_order) VALUES
-- ORD001 (45 Triệu - Khách sỉ mua Giày & Áo)
('ORD001','V086_1', 10, 2500000), -- 10 đôi AF1 (25tr)
('ORD001','V005_1', 20, 1000000), -- 20 Blazer (20tr)

-- ORD002 (8.2 Triệu)
('ORD002','V041_1', 2, 2500000),  -- 2 Nước hoa GoodGirl (5tr)
('ORD002','V042_1', 1, 3200000),  -- 1 Chanel Bleu (3.2tr)

-- ORD003 (62 Triệu - Đơn sỉ Mỹ phẩm)
('ORD003','V032_2', 50, 850000),  -- 50 Toner Kiehl (42.5tr)
('ORD003','V034_1', 30, 450000),  -- 30 Kem B5 (13.5tr)
('ORD003','V026_1', 30, 200000),  -- 30 Son (6tr)

-- ORD004 (15 Triệu)
('ORD004','V059_1', 10, 850000),  -- 10 Túi kẹp nách (8.5tr)
('ORD004','V022_1', 10, 650000),  -- 10 Mũ NY (6.5tr)

-- ORD005 (25 Triệu)
('ORD005','V087_1', 5, 3000000),  -- 5 Giày Boost (15tr)
('ORD005','V060_1', 5, 1200000),  -- 5 Vali (6tr)
('ORD005','V066_1', 4, 1000000),  -- 4 Ốp UAG (4tr)

-- ORD006 (55 Triệu - Đơn sỉ Nước hoa)
('ORD006','V042_1', 10, 3200000), -- 10 Chanel Bleu (32tr)
('ORD006','V041_1', 8, 2500000),  -- 8 GoodGirl (20tr)
('ORD006','V021_1', 1, 3000000),  -- Kính (3tr)

-- ORD007 (22 Triệu)
('ORD007','V089_1', 10, 1800000), -- 10 Giày MLB (18tr)
('ORD007','V057_1', 8, 500000),   -- 8 Túi chéo (4tr)

-- ORD008 (48 Triệu - Giày hiệu)
('ORD008','V086_1', 10, 2500000), -- 10 AF1 (25tr)
('ORD008','V087_1', 5, 3000000),  -- 5 Boost (15tr)
('ORD008','V090_1', 5, 1200000),  -- 5 Vans (6tr)
('ORD008','V066_1', 2, 1000000),  -- 2 Ốp (2tr)

-- ORD009 (35 Triệu)
('ORD009','V005_1', 20, 1000000), -- 20 Blazer (20tr)
('ORD009','V001_1', 20, 500000),  -- 20 Đầm (10tr)
('ORD009','V003_1', 10, 500000),  -- 10 Jeans (5tr)

-- ORD010 (25 Triệu)
('ORD010','V060_2', 10, 1200000), -- 10 Vali xanh (12tr)
('ORD010','V058_1', 20, 400000),  -- 20 Balo (8tr)
('ORD010','V056_1', 50, 100000),  -- 50 Tote (5tr)

-- ORD011 (40 Triệu)
('ORD011','V042_1', 10, 3200000), -- 10 Chanel (32tr)
('ORD011','V022_1', 10, 650000),  -- 10 Mũ (6.5tr)
('ORD011','V025_1', 3, 500000),   -- 3 Ví (1.5tr)

-- ORD012 (38 Triệu)
('ORD012','V088_1', 10, 1500000), -- 10 Converse (15tr)
('ORD012','V089_1', 10, 1800000), -- 10 MLB (18tr)
('ORD012','V021_1', 1, 5000000),  -- 1 Kính hiệu (5tr)

-- ORD013 (32 Triệu)
('ORD013','V032_2', 20, 850000),  -- 20 Toner (17tr)
('ORD013','V034_1', 20, 500000),  -- 20 Kem (10tr)
('ORD013','V035_1', 10, 300000),  -- 10 KCN (3tr)
('ORD013','V026_1', 10, 200000),  -- 10 Son (2tr)

-- ORD014 (28 Triệu)
('ORD014','V006_1', 20, 400000),  -- 20 Sơ mi (8tr)
('ORD014','V007_1', 20, 500000),  -- 20 Quần âu (10tr)
('ORD014','V008_1', 10, 600000),  -- 10 Polo (6tr)
('ORD014','V018_1', 2, 2000000),  -- 2 Giày tây (4tr)

-- ORD015 (45 Triệu)
('ORD015','V041_1', 10, 2500000), -- 10 GoodGirl (25tr)
('ORD015','V086_1', 8, 2500000),  -- 8 AF1 (20tr)

-- ORD016 (55 Triệu - Valentine)
('ORD016','V061_1', 50, 600000),  -- 50 Set quà (30tr)
('ORD016','V042_1', 5, 3200000),  -- 5 Chanel (16tr)
('ORD016','V025_1', 10, 500000),  -- 10 Ví (5tr)
('ORD016','V026_1', 20, 200000),  -- 20 Son (4tr)

-- ORD017 (12 Triệu)
('ORD017','V001_1', 10, 500000),  -- 10 Đầm (5tr)
('ORD017','V016_1', 10, 500000),  -- 10 Cao gót (5tr)
('ORD017','V025_1', 4, 500000),   -- 4 Ví (2tr)

-- ORD018 (65 Triệu)
('ORD018','V087_1', 15, 3000000), -- 15 Boost (45tr)
('ORD018','V086_1', 8, 2500000),  -- 8 AF1 (20tr)

-- ORD019 (30 Triệu)
('ORD019','V005_1', 20, 1000000), -- 20 Blazer (20tr)
('ORD019','V004_1', 20, 500000),  -- 20 Váy (10tr)

-- ORD020 (12 Triệu)
('ORD020','V060_2', 10, 1200000), -- 10 Vali (12tr)

-- ORD021 (55 Triệu)
('ORD021','V041_1', 10, 2500000), -- 10 GoodGirl (25tr)
('ORD021','V042_1', 5, 3200000),  -- 5 Chanel (16tr)
('ORD021','V089_1', 8, 1800000),  -- 8 MLB (14.4tr)

-- ORD022 (40 Triệu)
('ORD022','V086_1', 16, 2500000), -- 16 AF1 (40tr)

-- ORD023 (15 Triệu)
('ORD023','V032_2', 10, 850000),  -- 10 Toner (8.5tr)
('ORD023','V034_1', 10, 450000),  -- 10 Kem (4.5tr)
('ORD023','V026_1', 10, 200000),  -- 10 Son (2tr)

-- ORD024 (60 Triệu)
('ORD024','V087_1', 20, 3000000), -- 20 Boost (60tr)

-- ORD025 (40 Triệu)
('ORD025','V042_1', 10, 3200000), -- 10 Chanel (32tr)
('ORD025','V059_1', 10, 800000),  -- 10 Túi (8tr)

-- ORD026 (20 Triệu)
('ORD026','V005_1', 20, 1000000), -- 20 Blazer (20tr)

-- ORD027 (55 Triệu)
('ORD027','V086_1', 22, 2500000), -- 22 AF1 (55tr)

-- ORD028 (40 Triệu)
('ORD028','V041_1', 16, 2500000), -- 16 GoodGirl (40tr)

-- ORD029 (20 Triệu)
('ORD029','V060_1', 10, 1200000), -- 10 Vali Hồng (12tr)
('ORD029','V058_1', 20, 400000),  -- 20 Balo (8tr)

-- ORD030 (45 Triệu)
('ORD030','V087_1', 15, 3000000), -- 15 Boost (45tr)

-- ORD031 (35 Triệu)
('ORD031','V042_1', 10, 3200000), -- 10 Chanel (32tr)
('ORD031','V021_1', 1, 3000000),  -- 1 Kính (3tr)

-- ORD032 (25 Triệu)
('ORD032','V086_1', 10, 2500000), -- 10 AF1 (25tr)

-- ORD033 (60 Triệu)
('ORD033','V087_1', 20, 3000000), -- 20 Boost (60tr)

-- ORD034 (40 Triệu)
('ORD034','V041_1', 16, 2500000), -- 16 GoodGirl (40tr)

-- ORD035 (20 Triệu)
('ORD035','V005_1', 20, 1000000), -- 20 Blazer (20tr)

-- ORD036 (65 Triệu)
('ORD036','V086_1', 26, 2500000), -- 26 AF1 (65tr)

-- ORD037 (40 Triệu)
('ORD037','V042_1', 12, 3200000), -- 12 Chanel (38.4tr)
('ORD037','V026_1', 8, 200000),   -- 8 Son (1.6tr)

-- ORD038 (20 Triệu)
('ORD038','V060_2', 10, 1200000), -- 10 Vali xanh (12tr)
('ORD038','V058_1', 20, 400000),  -- 20 Balo (8tr)

-- ORD039 (50 Triệu)
('ORD039','V087_1', 10, 3000000), -- 10 Boost (30tr)
('ORD039','V086_1', 8, 2500000),  -- 8 AF1 (20tr)

-- ORD040 (40 Triệu)
('ORD040','V041_1', 16, 2500000), -- 16 GoodGirl (40tr)

-- ORD041 (20 Triệu)
('ORD041','V005_1', 20, 1000000), -- 20 Blazer (20tr)

-- ORD042 (55 Triệu)
('ORD042','V086_1', 22, 2500000), -- 22 AF1 (55tr)

-- ORD043 (40 Triệu)
('ORD043','V042_1', 12, 3200000), -- 12 Chanel (38.4tr)
('ORD043','V026_1', 8, 200000),   -- 8 Son (1.6tr)

-- ORD044 (20 Triệu)
('ORD044','V060_1', 10, 1200000), -- 10 Vali Hồng (12tr)
('ORD044','V058_1', 20, 400000);  -- 20 Balo (8tr)

-- chèn sản phẩm
INSERT INTO products (product_id, name, category_id, description, brand, base_price, cost_price) VALUES
-- 1. Thời trang nữ (P001-P005)
('P001', 'Đầm Maxi Voan Hoa', 1, 'Đầm đi biển', 'Zara', 450000, 250000),
('P002', 'Áo Croptop Nữ', 1, 'Thun cotton', 'H&M', 150000, 80000),
('P003', 'Quần Jeans Ống Rộng', 1, 'Hack dáng', 'Levis', 550000, 350000),
('P004', 'Chân Váy Tennis', 1, 'Xếp ly ngắn', 'Local', 190000, 100000),
('P005', 'Blazer Hàn Quốc', 1, 'Khoác nhẹ', 'Elise', 850000, 500000),

-- 2. Thời trang nam (P006-P010)
('P006', 'Sơ Mi Trắng Nam', 2, 'Oxford', 'Owen', 350000, 200000),
('P007', 'Quần Âu Slimfit', 2, 'Vải không nhăn', 'Viettien', 450000, 280000),
('P008', 'Áo Polo Cá Sấu', 2, 'Basic', 'Lacoste', 550000, 300000),
('P009', 'Quần Short Kaki', 2, 'Dạo phố', 'Uniqlo', 250000, 150000),
('P010', 'Áo Khoác Bomber', 2, 'Gió dù', 'Adidas', 750000, 450000),

-- 3. Thời trang trẻ em (P011-P015)
('P011', 'Váy Công Chúa', 3, 'Cho bé gái', 'BabyShop', 250000, 150000),
('P012', 'Đồ Bộ Siêu Nhân', 3, 'Cho bé trai', 'Marvel', 180000, 100000),
('P013', 'Áo Thun Hình Thú', 3, 'Cotton', 'Canifa', 120000, 70000),
('P014', 'Quần Yếm Jeans', 3, 'Dễ thương', 'Gap', 320000, 200000),
('P015', 'Body Chip Sơ Sinh', 3, 'Mềm mại', 'Nous', 90000, 50000),

-- 4. Giày dép (P016-P020)
('P016', 'Giày Cao Gót 7cm', 4, 'Mũi nhọn', 'Juno', 480000, 280000),
('P017', 'Boot Da Cổ Thấp', 4, 'Phong cách', 'Zara', 650000, 400000),
('P018', 'Giày Tây Nam', 4, 'Da bò', 'Đông Hải', 1200000, 800000),
('P019', 'Giày Lười Loafer', 4, 'Êm chân', 'Gucci Fake', 550000, 300000),
('P020', 'Giày Búp Bê Nơ', 4, 'Nhẹ nhàng', 'Vascara', 350000, 200000),

-- 5. Phụ kiện thời trang (P021-P025)
('P021', 'Kính Mát Chống UV', 5, 'Thời trang', 'GentleM', 550000, 400000),
('P022', 'Mũ Lưỡi Trai NY', 5, 'Thêu logo', 'MLB', 650000, 400000),
('P023', 'Thắt Lưng Da', 5, 'Khóa tự động', 'Pedro', 850000, 500000),
('P024', 'Khăn Choàng Len', 5, 'Giữ ấm', 'Acne', 300000, 150000),
('P025', 'Ví Da Mini', 5, 'Đựng thẻ', 'Charles&K', 450000, 250000),

-- 6. Mỹ phẩm trang điểm (P026-P030)
('P026', 'Son Kem Lì', 6, 'Màu đỏ gạch', 'BlackRouge', 180000, 100000),
('P027', 'Cushion Kiềm Dầu', 6, 'Che phủ tốt', 'Lime', 320000, 200000),
('P028', 'Kẻ Mắt Nước', 6, 'Không trôi', 'KissMe', 250000, 150000),
('P029', 'Bảng Phấn Mắt', 6, 'Tone cam', '3CE', 380000, 250000),
('P030', 'Má Hồng Kem', 6, 'Tự nhiên', 'Canmake', 190000, 110000),

-- 7. Chăm sóc da (P031-P035)
('P031', 'Sữa Rửa Mặt', 7, 'Dịu nhẹ', 'Cerave', 350000, 200000),
('P032', 'Toner Hoa Cúc', 7, 'Cân bằng da', 'Kiehl', 850000, 600000),
('P033', 'Serum Vitamin C', 7, 'Sáng da', 'Klairs', 350000, 200000),
('P034', 'Kem Dưỡng B5', 7, 'Phục hồi', 'LaRoche', 450000, 300000),
('P035', 'Kem Chống Nắng', 7, 'Nâng tone', 'Skin1004', 280000, 180000),

-- 8. Chăm sóc tóc – cơ thể (P036-P040)
('P036', 'Dầu Gội Bưởi', 8, 'Giảm rụng', 'Cocoon', 220000, 140000),
('P037', 'Sữa Tắm Nước Hoa', 8, 'Thơm lâu', 'Tesori', 250000, 160000),
('P038', 'Dầu Xả Mượt Tóc', 8, 'Phục hồi', 'Tsubaki', 180000, 110000),
('P039', 'Tẩy Tế Bào Chết', 8, 'Cafe Đắk Lắk', 'Cocoon', 150000, 90000),
('P040', 'Dưỡng Thể Body', 8, 'Trắng da', 'Vaseline', 130000, 80000),

-- 9. Nước hoa (P041-P045)
('P041', 'Nước Hoa GoodGirl', 9, 'Sexy', 'Carolina', 2500000, 1800000),
('P042', 'Nước Hoa Bleu', 9, 'Nam tính', 'Chanel', 3200000, 2500000),
('P043', 'Body Mist', 9, 'Hương hoa', 'Bath&Body', 280000, 180000),
('P044', 'Nước Hoa Chiết', 9, '10ml', 'NoBrand', 150000, 80000),
('P045', 'Sáp Thơm Phòng', 9, 'Thư giãn', 'Yankee', 350000, 200000),

-- 10. Đồ lót (P046-P050)
('P046', 'Áo Bra Ren', 10, 'Nâng ngực', 'Victoria', 350000, 150000),
('P047', 'Quần Lót Cotton', 10, 'Set 3 cái', 'Muji', 150000, 80000),
('P048', 'Đồ Ngủ 2 Dây', 10, 'Lụa satin', 'Vera', 450000, 250000),
('P049', 'Boxer Nam', 10, 'Thun lạnh', 'Freeman', 120000, 60000),
('P050', 'Áo Choàng Ngủ', 10, 'Sang trọng', 'Zara', 550000, 300000),

-- 11. Trang sức (P051-P055)
('P051', 'Nhẫn Bạc 925', 11, 'Đính đá', 'PNJ', 350000, 200000),
('P052', 'Dây Chuyền', 11, 'Cỏ 4 lá', 'Swarovski', 1500000, 1000000),
('P053', 'Bông Tai', 11, 'Ngọc trai', 'Local', 120000, 60000),
('P054', 'Vòng Tay', 11, 'Phong thủy', 'Handmade', 250000, 100000),
('P055', 'Lắc Chân', 11, 'Chuông kêu', 'PNJ', 280000, 150000),

-- 12. Túi xách – Balo (P056-P060)
('P056', 'Túi Tote Vải', 12, 'Đựng A4', 'Local', 80000, 40000),
('P057', 'Túi Đeo Chéo', 12, 'Da PU', 'Zara', 450000, 280000),
('P058', 'Balo Laptop', 12, 'Chống sốc', 'Xiaomi', 350000, 220000),
('P059', 'Túi Kẹp Nách', 12, 'Hot trend', 'JW Pei', 850000, 500000),
('P060', 'Vali Du Lịch', 12, 'Size 20', 'Lock&Lock', 1200000, 800000),

-- 13. Set quà tặng (P061-P065)
('P061', 'Set Sinh Nhật', 13, 'Son + Hoa', 'GiftShop', 550000, 350000),
('P062', 'Hộp Valentine', 13, 'Socola', 'Meow', 350000, 200000),
('P063', 'Combo Skincare', 13, '3 món', 'Innisfree', 850000, 600000),
('P064', 'Set Nến Thơm', 13, 'Chill', 'Yankee', 450000, 250000),
('P065', 'Quà Doanh Nghiệp', 13, 'Sổ bút', 'Biz', 650000, 400000),

-- 14. Phụ kiện điện thoại (P066-P070)
('P066', 'Ốp Lưng IP15', 14, 'Trong suốt', 'UAG', 950000, 600000),
('P067', 'Kính Cường Lực', 14, 'Kingkong', 'Kingkong', 50000, 20000),
('P068', 'Cáp Sạc Nhanh', 14, 'Type-C', 'Baseus', 120000, 70000),
('P069', 'Tai Nghe BT', 14, 'Hoco', 'Hoco', 350000, 200000),
('P070', 'Sạc Dự Phòng', 14, '10000mAh', 'Xiaomi', 250000, 180000),

-- 15. Đồ thể thao (P071-P075)
('P071', 'Áo Tập Gym', 15, 'Bra Sport', 'Nike', 450000, 250000),
('P072', 'Legging Yoga', 15, 'Co giãn', 'Adidas', 550000, 300000),
('P073', 'Áo Bóng Đá', 15, 'Thoáng khí', 'Puma', 200000, 100000),
('P074', 'Găng Tay Gym', 15, 'Chống chai', 'GymShark', 150000, 80000),
('P075', 'Tất Thể Thao', 15, 'Dày dặn', 'Nike', 80000, 40000),

-- 16. Đồ ngủ – Pijama (P076-P080)
('P076', 'Pijama Lụa', 16, 'Dài tay', 'Winny', 450000, 280000),
('P077', 'Đồ Bộ Cotton', 16, 'Mặc nhà', 'Sunfly', 250000, 150000),
('P078', 'Váy Ngủ Thun', 16, 'Dáng suông', 'Uniqlo', 300000, 180000),
('P079', 'Pijama Nam Kẻ', 16, 'Cổ điển', 'Owen', 400000, 250000),
('P080', 'Áo Ngủ Hình Thú', 16, 'Khủng long', 'Taobao', 220000, 120000),

-- 17. Sandal – Dép (P081-P085)
('P081', 'Dép Quai Ngang', 17, 'Nhựa mềm', 'Adidas', 350000, 200000),
('P082', 'Sandal Đế Cói', 17, 'Vintage', 'ShoeX', 250000, 150000),
('P083', 'Dép Sục Crocs', 17, 'Sticker', 'Crocs', 180000, 100000),
('P084', 'Sandal Chiến Binh', 17, 'Cá tính', 'Zara', 400000, 250000),
('P085', 'Dép Tổ Ong', 17, 'Huyền thoại', 'VN', 30000, 15000),

-- 18. Sneaker – Giày thời trang (P086-P090)
('P086', 'Sneaker AF1', 18, 'Trắng', 'Nike', 2500000, 1800000),
('P087', 'Giày Chạy Bộ', 18, 'Boost', 'Adidas', 3000000, 2000000),
('P088', 'Giày Canvas', 18, 'Cổ cao', 'Converse', 1500000, 900000),
('P089', 'Giày Chunky', 18, 'Đế độn', 'MLB', 1800000, 1200000),
('P090', 'Giày Slip-on', 18, 'Caro', 'Vans', 1200000, 700000);

INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity, additional_price) VALUES
-- P001: Đầm Maxi (2 Màu x 3 Size = 6 biến thể)
('V001_1', 'P001', 'Trắng', 'S', 10, 0), ('V001_2', 'P001', 'Trắng', 'M', 10, 0), ('V001_3', 'P001', 'Trắng', 'L', 10, 0),
('V001_4', 'P001', 'Vàng', 'S', 8, 0), ('V001_5', 'P001', 'Vàng', 'M', 8, 0), ('V001_6', 'P001', 'Vàng', 'L', 8, 0),

-- P002: Áo Croptop (3 Màu x 2 Size = 6 biến thể)
('V002_1', 'P002', 'Đen', 'S', 20, 0), ('V002_2', 'P002', 'Đen', 'M', 20, 0),
('V002_3', 'P002', 'Trắng', 'S', 20, 0), ('V002_4', 'P002', 'Trắng', 'M', 20, 0),
('V002_5', 'P002', 'Hồng', 'S', 15, 0), ('V002_6', 'P002', 'Hồng', 'M', 15, 0),

-- P003: Quần Jeans (2 Màu x 3 Size = 6 biến thể)
('V003_1', 'P003', 'Xanh Nhạt', '26', 12, 0), ('V003_2', 'P003', 'Xanh Nhạt', '27', 12, 0), ('V003_3', 'P003', 'Xanh Nhạt', '28', 12, 0),
('V003_4', 'P003', 'Xanh Đậm', '26', 10, 0), ('V003_5', 'P003', 'Xanh Đậm', '27', 10, 0), ('V003_6', 'P003', 'Xanh Đậm', '28', 10, 0),

-- P004 (4 biến thể) & P005 (3 biến thể)
('V004_1', 'P004', 'Trắng', 'S', 25, 0), ('V004_2', 'P004', 'Trắng', 'M', 25, 0), ('V004_3', 'P004', 'Đen', 'S', 25, 0), ('V004_4', 'P004', 'Đen', 'M', 25, 0),
('V005_1', 'P005', 'Be', 'S', 15, 0), ('V005_2', 'P005', 'Be', 'M', 15, 0), ('V005_3', 'P005', 'Nâu', 'S', 10, 0),

-- P006: Sơ mi nam (2 Màu x 3 Size = 6 biến thể)
('V006_1', 'P006', 'Trắng', '39', 20, 0), ('V006_2', 'P006', 'Trắng', '40', 20, 0), ('V006_3', 'P006', 'Trắng', '41', 20, 0),
('V006_4', 'P006', 'Xanh Biển', '39', 15, 0), ('V006_5', 'P006', 'Xanh Biển', '40', 15, 0), ('V006_6', 'P006', 'Xanh Biển', '41', 15, 0),

-- P007, P008, P009, P010 (Nam - 4 đến 5 biến thể)
('V007_1', 'P007', 'Đen', '29', 20, 0), ('V007_2', 'P007', 'Đen', '30', 20, 0), ('V007_3', 'P007', 'Đen', '31', 20, 0), ('V007_4', 'P007', 'Xám', '29', 15, 0), ('V007_5', 'P007', 'Xám', '30', 15, 0),
('V008_1', 'P008', 'Trắng', 'L', 30, 0), ('V008_2', 'P008', 'Trắng', 'XL', 30, 0), ('V008_3', 'P008', 'Đen', 'L', 30, 0), ('V008_4', 'P008', 'Đen', 'XL', 30, 0),
('V009_1', 'P009', 'Kaki', '30', 25, 0), ('V009_2', 'P009', 'Kaki', '31', 25, 0), ('V009_3', 'P009', 'Rêu', '30', 25, 0),
('V010_1', 'P010', 'Đen', 'L', 10, 0), ('V010_2', 'P010', 'Đen', 'XL', 10, 0), ('V010_3', 'P010', 'Xanh Rêu', 'L', 10, 0), ('V010_4', 'P010', 'Xanh Rêu', 'XL', 10, 0),

-- Trẻ em (P011-P015)
('V011_1', 'P011', 'Hồng', 'Size 2', 10, 0), ('V011_2', 'P011', 'Hồng', 'Size 4', 10, 0), ('V011_3', 'P011', 'Trắng', 'Size 2', 10, 0), ('V011_4', 'P011', 'Trắng', 'Size 4', 10, 0),
('V012_1', 'P012', 'Đỏ', 'S', 20, 0), ('V012_2', 'P012', 'Đỏ', 'M', 20, 0), ('V012_3', 'P012', 'Xanh', 'S', 20, 0),
('V013_1', 'P013', 'Vàng', '10kg', 30, 0), ('V013_2', 'P013', 'Cam', '10kg', 30, 0), ('V013_3', 'P013', 'Vàng', '15kg', 30, 0),
('V014_1', 'P014', 'Jeans', 'Size 2', 15, 0), ('V014_2', 'P014', 'Jeans', 'Size 4', 15, 0),
('V015_1', 'P015', 'Hồng', '0-3M', 50, 0), ('V015_2', 'P015', 'Xanh', '0-3M', 50, 0), ('V015_3', 'P015', 'Trắng', '3-6M', 50, 0),

-- Đồ lót (P046-P050)
('V046_1', 'P046', 'Đen', '34B', 20, 0), ('V046_2', 'P046', 'Đen', '36B', 20, 0), ('V046_3', 'P046', 'Da', '34B', 20, 0), ('V046_4', 'P046', 'Da', '36B', 20, 0),
('V047_1', 'P047', 'Mix', 'M', 100, 0), ('V047_2', 'P047', 'Mix', 'L', 100, 0),
('V048_1', 'P048', 'Đỏ', 'Freesize', 20, 0), ('V048_2', 'P048', 'Đen', 'Freesize', 20, 0), ('V048_3', 'P048', 'Hồng', 'Freesize', 20, 0),
('V049_1', 'P049', 'Xám', 'L', 50, 0), ('V049_2', 'P049', 'Xám', 'XL', 50, 0), ('V049_3', 'P049', 'Đen', 'L', 50, 0), ('V049_4', 'P049', 'Đen', 'XL', 50, 0),
('V050_1', 'P050', 'Trắng', 'Freesize', 10, 0), ('V050_2', 'P050', 'Hồng Nhạt', 'Freesize', 10, 0),

-- Thể thao (P071-P075)
('V071_1', 'P071', 'Đen', 'M', 30, 0), ('V071_2', 'P071', 'Đen', 'L', 30, 0), ('V071_3', 'P071', 'Hồng', 'M', 30, 0), ('V071_4', 'P071', 'Hồng', 'L', 30, 0),
('V072_1', 'P072', 'Đen', 'S', 25, 0), ('V072_2', 'P072', 'Đen', 'M', 25, 0), ('V072_3', 'P072', 'Xanh Than', 'S', 25, 0),
('V073_1', 'P073', 'Đỏ', 'L', 40, 0), ('V073_2', 'P073', 'Đỏ', 'XL', 40, 0), ('V073_3', 'P073', 'Trắng', 'L', 40, 0),
('V074_1', 'P074', 'Đen', 'M', 15, 0), ('V074_2', 'P074', 'Đen', 'L', 15, 0),
('V075_1', 'P075', 'Trắng', 'Freesize', 100, 0), ('V075_2', 'P075', 'Đen', 'Freesize', 100, 0),

-- Đồ ngủ (P076-P080)
('V076_1', 'P076', 'Hồng', 'L', 20, 0), ('V076_2', 'P076', 'Hồng', 'XL', 20, 0), ('V076_3', 'P076', 'Xanh Navy', 'L', 20, 0),
('V077_1', 'P077', 'Vàng', 'M', 25, 0), ('V077_2', 'P077', 'Vàng', 'L', 25, 0), ('V077_3', 'P077', 'Cam', 'M', 25, 0),
('V078_1', 'P078', 'Tím', 'Freesize', 30, 0), ('V078_2', 'P078', 'Hồng', 'Freesize', 30, 0),
('V079_1', 'P079', 'Kẻ Xanh', 'L', 20, 0), ('V079_2', 'P079', 'Kẻ Xanh', 'XL', 20, 0), ('V079_3', 'P079', 'Kẻ Đỏ', 'L', 20, 0),
('V080_1', 'P080', 'Xanh', 'Freesize', 15, 0), ('V080_2', 'P080', 'Vàng', 'Freesize', 15, 0);
INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity, additional_price) VALUES
-- P016: Cao gót (5 biến thể size)
('V016_1', 'P016', 'Đen', '35', 10, 0), ('V016_2', 'P016', 'Đen', '36', 15, 0), ('V016_3', 'P016', 'Đen', '37', 15, 0), ('V016_4', 'P016', 'Đen', '38', 10, 0), ('V016_5', 'P016', 'Đen', '39', 5, 0),

-- P017: Boot (4 biến thể)
('V017_1', 'P017', 'Nâu', '37', 10, 0), ('V017_2', 'P017', 'Nâu', '38', 10, 0), ('V017_3', 'P017', 'Đen', '37', 10, 0), ('V017_4', 'P017', 'Đen', '38', 10, 0),

-- P018: Giày tây (6 biến thể)
('V018_1', 'P018', 'Đen', '39', 8, 0), ('V018_2', 'P018', 'Đen', '40', 8, 0), ('V018_3', 'P018', 'Đen', '41', 8, 0),
('V018_4', 'P018', 'Nâu', '39', 8, 0), ('V018_5', 'P018', 'Nâu', '40', 8, 0), ('V018_6', 'P018', 'Nâu', '41', 8, 0),

-- P019, P020
('V019_1', 'P019', 'Đen', '39', 10, 0), ('V019_2', 'P019', 'Đen', '40', 10, 0), ('V019_3', 'P019', 'Đen', '41', 10, 0),
('V020_1', 'P020', 'Kem', '36', 15, 0), ('V020_2', 'P020', 'Kem', '37', 15, 0), ('V020_3', 'P020', 'Hồng', '36', 15, 0), ('V020_4', 'P020', 'Hồng', '37', 15, 0),

-- Sandal (P081-P085)
('V081_1', 'P081', 'Đen', '39', 40, 0), ('V081_2', 'P081', 'Đen', '40', 40, 0), ('V081_3', 'P081', 'Trắng', '39', 40, 0), ('V081_4', 'P081', 'Trắng', '40', 40, 0),
('V082_1', 'P082', 'Be', '36', 20, 0), ('V082_2', 'P082', 'Be', '37', 20, 0), ('V082_3', 'P082', 'Be', '38', 20, 0),
('V083_1', 'P083', 'Trắng', '36', 30, 0), ('V083_2', 'P083', 'Trắng', '37', 30, 0), ('V083_3', 'P083', 'Hồng', '36', 30, 0), ('V083_4', 'P083', 'Hồng', '37', 30, 0),
('V084_1', 'P084', 'Đen', '37', 15, 0), ('V084_2', 'P084', 'Đen', '38', 15, 0), ('V084_3', 'P084', 'Nâu', '37', 15, 0),
('V085_1', 'P085', 'Vàng', 'L', 50, 0), ('V085_2', 'P085', 'Xanh', 'XL', 50, 0),

-- Sneaker (P086-P090) - 6 size mỗi mẫu
('V086_1', 'P086', 'Trắng', '37', 10, 0), ('V086_2', 'P086', 'Trắng', '38', 10, 0), ('V086_3', 'P086', 'Trắng', '39', 10, 0), ('V086_4', 'P086', 'Trắng', '40', 10, 0), ('V086_5', 'P086', 'Trắng', '41', 10, 0), ('V086_6', 'P086', 'Trắng', '42', 5, 20000),
('V087_1', 'P087', 'Đen', '40', 10, 0), ('V087_2', 'P087', 'Đen', '41', 10, 0), ('V087_3', 'P087', 'Đen', '42', 10, 20000), ('V087_4', 'P087', 'Xám', '40', 10, 0), ('V087_5', 'P087', 'Xám', '41', 10, 0),
('V088_1', 'P088', 'Vàng', '37', 15, 0), ('V088_2', 'P088', 'Vàng', '38', 15, 0), ('V088_3', 'P088', 'Đen', '37', 15, 0), ('V088_4', 'P088', 'Đen', '38', 15, 0),
('V089_1', 'P089', 'Trắng', '37', 10, 0), ('V089_2', 'P089', 'Trắng', '38', 10, 0), ('V089_3', 'P089', 'Trắng', '39', 10, 0),
('V090_1', 'P090', 'Caro', '39', 20, 0), ('V090_2', 'P090', 'Caro', '40', 20, 0), ('V090_3', 'P090', 'Caro', '41', 20, 0);
INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity, additional_price) VALUES
-- P026: Son (5 màu)
('V026_1', 'P026', 'A12 - Đỏ Nâu', 'Thỏi', 50, 0), ('V026_2', 'P026', 'A06 - Đỏ Gạch', 'Thỏi', 50, 0),
('V026_3', 'P026', 'A03 - Đỏ Cam', 'Thỏi', 50, 0), ('V026_4', 'P026', 'A21 - Hồng Đất', 'Thỏi', 30, 0), ('V026_5', 'P026', 'A37 - Cam Cháy', 'Thỏi', 30, 0),

-- P027: Cushion (3 tone)
('V027_1', 'P027', 'Tone 10', 'Hộp', 40, 0), ('V027_2', 'P027', 'Tone 20', 'Hộp', 40, 0), ('V027_3', 'P027', 'Tone 30', 'Hộp', 20, 0),

-- P028, P029, P030
('V028_1', 'P028', 'Đen', 'Cây', 50, 0), ('V028_2', 'P028', 'Nâu', 'Cây', 50, 0),
('V029_1', 'P029', 'Tone Cam', 'Hộp', 25, 0), ('V029_2', 'P029', 'Tone Hồng', 'Hộp', 25, 0), ('V029_3', 'P029', 'Tone Nâu', 'Hộp', 15, 0),
('V030_1', 'P030', 'Hồng Đào', 'Hộp', 30, 0), ('V030_2', 'P030', 'Đỏ Rượu', 'Hộp', 30, 0),

-- P031-P035 (Skincare - Thường có 2 dung tích)
('V031_1', 'P031', 'Xanh', '150ml', 50, 0),
('V032_1', 'P032', 'Vàng', '250ml', 30, 0), ('V032_2', 'P032', 'Vàng', '500ml', 20, 150000),
('V033_1', 'P033', 'Trong suốt', '35ml', 40, 0),
('V034_1', 'P034', 'Trắng', '50ml', 40, 0), ('V034_2', 'P034', 'Trắng', '100ml', 20, 120000),
('V035_1', 'P035', 'Vàng', '50ml', 50, 0), ('V035_2', 'P035', 'Vàng', '100ml', 30, 100000),

-- P036-P040 (Tóc)
('V036_1', 'P036', 'Xanh', '300ml', 30, 0), ('V036_2', 'P036', 'Xanh', '500ml', 20, 50000),
('V037_1', 'P037', 'Hoa Sen', '500ml', 40, 0), ('V037_2', 'P037', 'Xạ Hương', '500ml', 40, 0), ('V037_3', 'P037', 'Thanh Long', '500ml', 40, 0),
('V038_1', 'P038', 'Vàng', '450ml', 30, 0),
('V039_1', 'P039', 'Nâu', '200ml', 35, 0), ('V039_2', 'P039', 'Nâu', '600ml', 20, 100000),
('V040_1', 'P040', 'Hồng', '350ml', 50, 0), ('V040_2', 'P040', 'Vàng', '350ml', 50, 0),

-- P041-P045 (Nước hoa - 3 dung tích)
('V041_1', 'P041', 'Xanh', '30ml', 15, 0), ('V041_2', 'P041', 'Xanh', '50ml', 10, 800000), ('V041_3', 'P041', 'Xanh', '100ml', 5, 1500000),
('V042_1', 'P042', 'Đen', '50ml', 10, 0), ('V042_2', 'P042', 'Đen', '100ml', 5, 900000),
('V043_1', 'P043', 'Hồng', '236ml', 30, 0), ('V043_2', 'P043', 'Tím', '236ml', 30, 0),
('V044_1', 'P044', 'GoodGirl', '10ml', 50, 0), ('V044_2', 'P044', 'Chanel', '10ml', 50, 0), ('V044_3', 'P044', 'Dior', '10ml', 50, 0),
('V045_1', 'P045', 'Lavender', 'Hũ', 40, 0), ('V045_2', 'P045', 'Chanh Sả', 'Hũ', 40, 0);
INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity, additional_price) VALUES
-- P021-P025
('V021_1', 'P021', 'Đen', 'Freesize', 10, 0), ('V021_2', 'P021', 'Trà', 'Freesize', 10, 0), ('V021_3', 'P021', 'Trong', 'Freesize', 10, 0),
('V022_1', 'P022', 'Đen', 'Freesize', 25, 0), ('V022_2', 'P022', 'Trắng', 'Freesize', 25, 0), ('V022_3', 'P022', 'Xanh', 'Freesize', 25, 0),
('V023_1', 'P023', 'Đen', '110cm', 20, 0), ('V023_2', 'P023', 'Đen', '120cm', 15, 0),
('V024_1', 'P024', 'Xám', 'Freesize', 20, 0), ('V024_2', 'P024', 'Be', 'Freesize', 20, 0), ('V024_3', 'P024', 'Đỏ', 'Freesize', 20, 0),
('V025_1', 'P025', 'Đen', 'Mini', 30, 0), ('V025_2', 'P025', 'Hồng', 'Mini', 30, 0),

-- P051-P055 (Trang sức - Size nhẫn)
('V051_1', 'P051', 'Bạc', 'Size 9', 10, 0), ('V051_2', 'P051', 'Bạc', 'Size 10', 10, 0), ('V051_3', 'P051', 'Bạc', 'Size 11', 10, 0),
('V052_1', 'P052', 'Vàng', '45cm', 5, 0), ('V052_2', 'P052', 'Bạc', '45cm', 5, -100000),
('V053_1', 'P053', 'Trắng', 'Freesize', 20, 0),
('V054_1', 'P054', 'Nâu', '10mm', 15, 0), ('V054_2', 'P054', 'Đen', '12mm', 15, 0), ('V054_3', 'P054', 'Xanh', '10mm', 15, 0),
('V055_1', 'P055', 'Bạc', 'Freesize', 12, 0),

-- P056-P060 (Túi)
('V056_1', 'P056', 'Trắng', 'A4', 80, 0), ('V056_2', 'P056', 'Đen', 'A4', 80, 0),
('V057_1', 'P057', 'Đen', 'Size 20', 20, 0), ('V057_2', 'P057', 'Nâu', 'Size 20', 20, 0),
('V058_1', 'P058', 'Xám', '14 inch', 30, 0), ('V058_2', 'P058', 'Xám', '15.6 inch', 30, 20000), ('V058_3', 'P058', 'Đen', '15.6 inch', 30, 20000),
('V059_1', 'P059', 'Tím', 'Size 22', 15, 0), ('V059_2', 'P059', 'Trắng', 'Size 22', 15, 0),
('V060_1', 'P060', 'Hồng', 'Size 20', 10, 0), ('V060_2', 'P060', 'Xanh', 'Size 24', 8, 200000), ('V060_3', 'P060', 'Đen', 'Size 28', 5, 400000),

-- P061-P065 (Quà)
('V061_1', 'P061', 'Đỏ', 'Hộp', 10, 0), ('V061_2', 'P061', 'Hồng', 'Hộp', 10, 0),
('V062_1', 'P062', 'Nâu', 'Hộp', 15, 0),
('V063_1', 'P063', 'Xanh', 'Set', 20, 0),
('V064_1', 'P064', 'Trắng', 'Set 3', 25, 0), ('V064_2', 'P064', 'Đỏ', 'Set 3', 25, 0),
('V065_1', 'P065', 'Đen', 'Set', 10, 0),

-- P066-P070 (Điện thoại - 6 biến thể đời máy)
('V066_1', 'P066', 'Trong', 'IP13', 30, 0), ('V066_2', 'P066', 'Trong', 'IP14', 30, 0), ('V066_3', 'P066', 'Trong', 'IP15', 30, 0), ('V066_4', 'P066', 'Trong', 'IP15 Pro', 30, 10000),
('V067_1', 'P067', 'Trong', 'IP13', 50, 0), ('V067_2', 'P067', 'Trong', 'IP14', 50, 0), ('V067_3', 'P067', 'Trong', 'IP15', 50, 0),
('V068_1', 'P068', 'Trắng', '1m', 80, 0), ('V068_2', 'P068', 'Trắng', '2m', 60, 20000), ('V068_3', 'P068', 'Đen', '1m', 80, 0),
('V069_1', 'P069', 'Trắng', 'Freesize', 40, 0), ('V069_2', 'P069', 'Đen', 'Freesize', 40, 0),
('V070_1', 'P070', 'Đen', '10000mAh', 30, 0), ('V070_2', 'P070', 'Trắng', '20000mAh', 20, 100000), ('V070_3', 'P070', 'Hồng', '10000mAh', 30, 0);

INSERT INTO product_images (product_id, color, image_url, sort_order) VALUES
-- P001: Đầm Maxi
('P001', 'Trắng', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500', 1),
('P001', 'Vàng', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', 2),
-- P002: Áo Croptop
('P002', 'Đen', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500', 1),
('P002', 'Trắng', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 2),
-- P003: Quần Jeans
('P003', 'Xanh Nhạt', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', 1),
-- P004: Chân váy
('P004', 'Trắng', 'https://images.unsplash.com/photo-1582142327527-5e819b972e8f?w=500', 1),
-- P005: Blazer
('P005', 'Be', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 1),

-- P006: Sơ mi nam
('P006', 'Trắng', 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=500', 1),
-- P007: Quần âu
('P007', 'Đen', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500', 1),
-- P008: Polo
('P008', 'Trắng', 'https://images.unsplash.com/photo-1626557981101-aae6f84aa6a8?w=500', 1),
-- P009: Short
('P009', 'Kaki', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500', 1),
-- P010: Bomber
('P010', 'Đen', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', 1),

-- P011: Váy bé gái
('P011', 'Hồng', 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500', 1),
-- P012: Đồ siêu nhân (Đại diện)
('P012', 'Đỏ', 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500', 1),
-- P013: Áo thun bé
('P013', 'Vàng', 'https://images.unsplash.com/photo-1519278409-1f56fdda78bf?w=500', 1),
-- P014: Yếm
('P014', 'Jeans', 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500', 1),
-- P015: Body sơ sinh
('P015', 'Trắng', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500', 1),

-- P046: Bra
('P046', 'Đen', 'https://images.unsplash.com/photo-1574660948957-c3132e850eb2?w=500', 1),
-- P047: Quần lót
('P047', 'Mix', 'https://images.unsplash.com/photo-1598522194689-535359149021?w=500', 1),
-- P048: Đồ ngủ dây
('P048', 'Đỏ', 'https://images.unsplash.com/photo-1605763240004-7e93b172d754?w=500', 1),
-- P049: Boxer nam
('P049', 'Xám', 'https://images.unsplash.com/photo-1582260656094-1a9807567781?w=500', 1),
-- P050: Áo choàng
('P050', 'Trắng', 'https://images.unsplash.com/photo-1584208076634-1cb81c01540d?w=500', 1),

-- P071: Gym Bra
('P071', 'Đen', 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=500', 1),
-- P072: Legging
('P072', 'Đen', 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=500', 1),
-- P073: Áo bóng đá
('P073', 'Đỏ', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500', 1),
-- P074: Găng tay
('P074', 'Đen', 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500', 1),
-- P075: Tất
('P075', 'Trắng', 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500', 1),

-- P076: Pijama Lụa
('P076', 'Hồng', 'https://images.unsplash.com/photo-1588670139196-8acdd5743a6d?w=500', 1),
-- P077: Đồ bộ
('P077', 'Vàng', 'https://images.unsplash.com/photo-1582234057917-0628e93297a0?w=500', 1),
-- P078: Váy ngủ
('P078', 'Tím', 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=500', 1),
-- P079: Pijama nam
('P079', 'Kẻ Xanh', 'https://images.unsplash.com/photo-1530999088686-2187f48cb94b?w=500', 1),
-- P080: Hình thú
('P080', 'Xanh', 'https://images.unsplash.com/photo-1606132773410-74cb42f1f83c?w=500', 1);
INSERT INTO product_images (product_id, color, image_url, sort_order) VALUES
-- P016: Cao gót
('P016', 'Đen', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500', 1),
-- P017: Boot
('P017', 'Nâu', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500', 1),
-- P018: Giày tây
('P018', 'Đen', 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500', 1),
-- P019: Loafer
('P019', 'Đen', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500', 1),
-- P020: Búp bê
('P020', 'Kem', 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=500', 1),

-- P081: Dép quai ngang
('P081', 'Đen', 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500', 1),
-- P082: Sandal cói
('P082', 'Be', 'https://images.unsplash.com/photo-1603487742187-560248443567?w=500', 1),
-- P083: Crocs (Sục)
('P083', 'Trắng', 'https://images.unsplash.com/photo-1598305096536-24e532b2609c?w=500', 1),
-- P084: Sandal chiến binh
('P084', 'Đen', 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=500', 1),
-- P085: Tổ ong (Sử dụng ảnh dép nhựa đại diện)
('P085', 'Vàng', 'https://images.unsplash.com/photo-1549646960-e4a806952724?w=500', 1),

-- P086: Sneaker AF1
('P086', 'Trắng', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 1),
-- P087: Boost
('P087', 'Đen', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500', 1),
-- P088: Converse Canvas
('P088', 'Vàng', 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500', 1),
-- P089: Chunky (MLB Style)
('P089', 'Trắng', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500', 1),
-- P090: Slip-on (Vans Style)
('P090', 'Caro', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500', 1);
INSERT INTO product_images (product_id, color, image_url, sort_order) VALUES
-- P026: Son
('P026', 'A12 - Đỏ Nâu', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500', 1),
-- P027: Cushion
('P027', 'Tone 10', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500', 1),
-- P028: Kẻ mắt
('P028', 'Đen', 'https://images.unsplash.com/photo-1631214503851-a51e50f3ec5f?w=500', 1),
-- P029: Phấn mắt
('P029', 'Tone Cam', 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=500', 1),
-- P030: Má hồng
('P030', 'Hồng Đào', 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=500', 1),

-- P031: Sữa rửa mặt
('P031', 'Xanh', 'https://images.unsplash.com/photo-1556228578-8d89f5538338?w=500', 1),
-- P032: Toner
('P032', 'Vàng', 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=500', 1),
-- P033: Serum
('P033', 'Trong suốt', 'https://images.unsplash.com/photo-1620917670397-4477b767d603?w=500', 1),
-- P034: Kem dưỡng
('P034', 'Trắng', 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=500', 1),
-- P035: Kem chống nắng
('P035', 'Vàng', 'https://images.unsplash.com/photo-1563632997-748439da5252?w=500', 1),

-- P036: Dầu gội
('P036', 'Xanh', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500', 1),
-- P037: Sữa tắm
('P037', 'Hoa Sen', 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?w=500', 1),
-- P038: Dầu xả
('P038', 'Vàng', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500', 1),
-- P039: Tẩy da chết
('P039', 'Nâu', 'https://images.unsplash.com/photo-1610464670267-36e3c03a9749?w=500', 1),
-- P040: Dưỡng thể
('P040', 'Hồng', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500', 1),

-- P041: Nước hoa (Guốc)
('P041', 'Xanh', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', 1),
-- P042: Nước hoa nam (Chanel vibe)
('P042', 'Đen', 'https://images.unsplash.com/photo-1523293188086-b512669486ad?w=500', 1),
-- P043: Mist
('P043', 'Hồng', 'https://images.unsplash.com/photo-1622359247656-749e70197931?w=500', 1),
-- P044: Nước hoa chiết
('P044', 'GoodGirl', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', 1),
-- P045: Nến thơm
('P045', 'Lavender', 'https://images.unsplash.com/photo-1602143407151-0111419516eb?w=500', 1);
INSERT INTO product_images (product_id, color, image_url, sort_order) VALUES
-- P021: Kính
('P021', 'Đen', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500', 1),
-- P022: Mũ
('P022', 'Đen', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500', 1),
-- P023: Thắt lưng
('P023', 'Đen', 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500', 1),
-- P024: Khăn
('P024', 'Xám', 'https://images.unsplash.com/photo-1608460596395-57d0774a382c?w=500', 1),
-- P025: Ví
('P025', 'Đen', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 1),

-- P051: Nhẫn
('P051', 'Bạc', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500', 1),
-- P052: Dây chuyền
('P052', 'Vàng', 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?w=500', 1),
-- P053: Bông tai
('P053', 'Trắng', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500', 1),
-- P054: Vòng tay
('P054', 'Nâu', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500', 1),
-- P055: Lắc chân
('P055', 'Bạc', 'https://images.unsplash.com/photo-1618403088890-3d13418274a4?w=500', 1),

-- P056: Tote
('P056', 'Trắng', 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=500', 1),
-- P057: Túi chéo
('P057', 'Đen', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 1),
-- P058: Balo
('P058', 'Xám', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 1),
-- P059: Kẹp nách
('P059', 'Tím', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', 1),
-- P060: Vali
('P060', 'Hồng', 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500', 1),

-- P061: Quà sinh nhật
('P061', 'Đỏ', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', 1),
-- P062: Valentine
('P062', 'Nâu', 'https://images.unsplash.com/photo-1544521094-a15d045d614d?w=500', 1),
-- P063: Set skincare
('P063', 'Xanh', 'https://images.unsplash.com/photo-1617897903246-719242758050?w=500', 1),
-- P064: Nến thơm
('P064', 'Trắng', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500', 1),
-- P065: Sổ bút
('P065', 'Đen', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500', 1),

-- P066: Ốp lưng
('P066', 'Trong', 'https://images.unsplash.com/photo-1603539276945-4702f7823e44?w=500', 1),
-- P067: Cường lực (Minh họa)
('P067', 'Trong', 'https://images.unsplash.com/photo-1616423664045-667746979203?w=500', 1),
-- P068: Cáp sạc
('P068', 'Trắng', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500', 1),
-- P069: Tai nghe
('P069', 'Trắng', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 1),
-- P070: Sạc dự phòng
('P070', 'Đen', 'https://images.unsplash.com/photo-1609560029280-99b50e2c1a85?w=500', 1);

-- khách hàng
INSERT INTO customers (customer_id, user_id, full_name, email, phone, address, created_at, updated_at) VALUES
('CUS1', 'US1', 'Đặng Thị Ngọc', 'dặngthingoc@example.com', '0900000001', '87 Nguyễn Trãi, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS2', 'US2', 'Phạm Văn Quang', 'phamvanquang@example.com', '0900000002', '88 Trần Hưng Đạo, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS3', 'US3', 'Đỗ Thị Thu', 'dỗthithu@example.com', '0900000003', '27 Hai Bà Trưng, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS4', 'US4', 'Đỗ Văn Đông', 'dỗvandong@example.com', '0900000004', '187 Bà Triệu, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS5', 'US5', 'Võ Văn Tùng', 'vovantung@example.com', '0900000005', '179 Phan Chu Trinh, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS6', 'US6', 'Đỗ Văn Kiên', 'dỗvankien@example.com', '0900000006', '125 Nguyễn Du, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS7', 'US7', 'Hoàng Văn Đông', 'hoangvandong@example.com', '0900000007', '168 Trần Phú, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS8', 'US8', 'Trương Văn Huy', 'truongvanhuy@example.com', '0900000008', '13 Lý Thường Kiệt, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS9', 'US9', 'Lê Văn Cường', 'levancuờng@example.com', '0900000009', '13 Lê Lợi, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS10', 'US10', 'Đặng Văn An', 'dặngvanan@example.com', '0900000010', '144 Nguyễn Trãi, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS11', 'US11', 'Trần Thị Lan', 'trầnthilan@example.com', '0900000011', '128 Trần Hưng Đạo, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS12', 'US12', 'Đặng Văn Cường', 'dặngvancuờng@example.com', '0900000012', '96 Hai Bà Trưng, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS13', 'US13', 'Đặng Thị Bình', 'dặngthibinh@example.com', '0900000013', '131 Bà Triệu, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS14', 'US14', 'Phạm Văn Hoàng', 'phamvanhoang@example.com', '0900000014', '120 Phan Chu Trinh, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS15', 'US15', 'Đỗ Văn Huy', 'dỗvanhuy@example.com', '0900000015', '182 Nguyễn Du, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS16', 'US16', 'Hoàng Văn An', 'hoangvanan@example.com', '0900000016', '92 Trần Phú, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS17', 'US17', 'Nguyễn Văn Nam', 'nguyễnvannam@example.com', '0900000017', '145 Lý Thường Kiệt, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS18', 'US18', 'Trần Thị Hạnh', 'trầnthihanh@example.com', '0900000018', '83 Lê Lợi, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS19', 'US19', 'Lê Văn Tùng', 'levantung@example.com', '0900000019', '95 Nguyễn Trãi, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS20', 'US20', 'Đỗ Văn Quang', 'dỗvanquang@example.com', '0900000020', '133 Trần Hưng Đạo, Hà Nội', '2024-11-20', '2024-11-20'),
('CUS21', 'US21', 'Đặng Thị Phương', 'dặngthiphuong@example.com', '0900000021', '62 Hai Bà Trưng, Hà Nội', '2024-11-21', '2024-11-21'),
('CUS22', 'US22', 'Phạm Thị Phương', 'phamthiphuong@example.com', '0900000022', '10 Bà Triệu, Hà Nội', '2024-11-22', '2024-11-22'),
('CUS23', 'US23', 'Lê Văn Kiên', 'levankien@example.com', '0900000023', '158 Phan Chu Trinh, Hà Nội', '2024-11-23', '2024-11-23'),
('CUS24', 'US24', 'Lê Văn Phúc', 'levanphuc@example.com', '0900000024', '3 Nguyễn Du, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS25', 'US25', 'Nguyễn Thị Ngọc', 'nguyễnthingoc@example.com', '0900000025', '134 Trần Phú, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS26', 'US26', 'Phan Thị Dung', 'phanthidung@example.com', '0900000026', '120 Lý Thường Kiệt, Hà Nội', '2024-11-26', '2024-11-26'),
('CUS27', 'US27', 'Trương Văn Quang', 'truongvanquang@example.com', '0900000027', '70 Lê Lợi, Hà Nội', '2024-11-27', '2024-11-27'),
('CUS28', 'US28', 'Lê Thị Lan', 'lethilan@example.com', '0900000028', '20 Nguyễn Trãi, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS29', 'US29', 'Phạm Văn Kiên', 'phamvankien@example.com', '0900000029', '189 Trần Hưng Đạo, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS30', 'US30', 'Nguyễn Thị Mai', 'nguyễnthimai@example.com', '0900000030', '184 Hai Bà Trưng, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS31', 'US31', 'Trương Thị Phương', 'truongthiphuong@example.com', '0900000031', '169 Bà Triệu, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS32', 'US32', 'Hoàng Thị Lan', 'hoangthilan@example.com', '0900000032', '89 Phan Chu Trinh, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS33', 'US33', 'Phạm Thị Hạnh', 'phamthihanh@example.com', '0900000033', '124 Nguyễn Du, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS34', 'US34', 'Võ Văn Phúc', 'vovanphuc@example.com', '0900000034', '163 Trần Phú, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS35', 'US35', 'Võ Thị Lan', 'vothilan@example.com', '0900000035', '72 Lý Thường Kiệt, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS36', 'US36', 'Hoàng Văn Hoàng', 'hoangvanhoang@example.com', '0900000036', '97 Lê Lợi, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS37', 'US37', 'Hoàng Văn Phúc', 'hoangvanphuc@example.com', '0900000037', '9 Nguyễn Trãi, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS38', 'US38', 'Hoàng Văn Cường', 'hoangvancuờng@example.com', '0900000038', '137 Trần Hưng Đạo, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS39', 'US39', 'Nguyễn Văn Cường', 'nguyễnvancuờng@example.com', '0900000039', '2 Hai Bà Trưng, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS40', 'US40', 'Phạm Văn Kiên', 'phamvankien@example.com', '0900000040', '83 Bà Triệu, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS41', 'US41', 'Võ Thị Ngọc', 'vothingoc@example.com', '0900000041', '145 Phan Chu Trinh, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS42', 'US42', 'Đỗ Thị Hạnh', 'dỗthihanh@example.com', '0900000042', '127 Nguyễn Du, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS43', 'US43', 'Lê Thị Phương', 'lethiphuong@example.com', '0900000043', '129 Trần Phú, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS44', 'US44', 'Hoàng Văn Nam', 'hoangvannam@example.com', '0900000044', '135 Lý Thường Kiệt, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS45', 'US45', 'Đặng Thị Ngọc', 'dặngthingoc@example.com', '0900000045', '136 Lê Lợi, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS46', 'US46', 'Lê Văn Tùng', 'levantung@example.com', '0900000046', '140 Nguyễn Trãi, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS47', 'US47', 'Lê Thị Hạnh', 'lethihanh@example.com', '0900000047', '112 Trần Hưng Đạo, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS48', 'US48', 'Võ Thị Lan', 'vothilan@example.com', '0900000048', '116 Hai Bà Trưng, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS49', 'US49', 'Hoàng Thị Thu', 'hoangthithu@example.com', '0900000049', '189 Bà Triệu, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS50', 'US50', 'Nguyễn Thị Ngọc', 'nguyễnthingoc@example.com', '0900000050', '71 Phan Chu Trinh, Hà Nội', '2024-11-20', '2024-11-20'),
('CUS51', 'US51', 'Võ Văn Kiên', 'vovankien@example.com', '0900000051', '178 Nguyễn Du, Hà Nội', '2024-11-21', '2024-11-21'),
('CUS52', 'US52', 'Trương Văn Phúc', 'truongvanphuc@example.com', '0900000052', '57 Trần Phú, Hà Nội', '2024-11-22', '2024-11-22'),
('CUS53', 'US53', 'Nguyễn Văn Cường', 'nguyễnvancuờng@example.com', '0900000053', '64 Lý Thường Kiệt, Hà Nội', '2024-11-23', '2024-11-23'),
('CUS54', 'US54', 'Phạm Thị Lan', 'phamthilan@example.com', '0900000054', '23 Lê Lợi, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS55', 'US55', 'Trương Thị Hạnh', 'truongthihanh@example.com', '0900000055', '191 Nguyễn Trãi, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS56', 'US56', 'Phan Thị Ngọc', 'phanthingoc@example.com', '0900000056', '118 Trần Hưng Đạo, Hà Nội', '2024-11-26', '2024-11-26'),
('CUS57', 'US57', 'Hoàng Thị Mai', 'hoangthimai@example.com', '0900000057', '164 Hai Bà Trưng, Hà Nội', '2024-11-27', '2024-11-27'),
('CUS58', 'US58', 'Hoàng Văn Kiên', 'hoangvankien@example.com', '0900000058', '166 Bà Triệu, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS59', 'US59', 'Phan Văn Quang', 'phanvanquang@example.com', '0900000059', '179 Phan Chu Trinh, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS60', 'US60', 'Nguyễn Văn Kiên', 'nguyễnvankien@example.com', '0900000060', '122 Nguyễn Du, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS61', 'US61', 'Hoàng Thị Lan', 'hoangthilan@example.com', '0900000061', '46 Trần Phú, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS62', 'US62', 'Trương Văn Đông', 'truongvandong@example.com', '0900000062', '181 Lý Thường Kiệt, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS63', 'US63', 'Lê Thị Lan', 'lethilan@example.com', '0900000063', '164 Lê Lợi, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS64', 'US64', 'Trần Thị Bình', 'trầnthibinh@example.com', '0900000064', '48 Nguyễn Trãi, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS65', 'US65', 'Đặng Thị Lan', 'dặngthilan@example.com', '0900000065', '39 Trần Hưng Đạo, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS66', 'US66', 'Hoàng Văn Tùng', 'hoangvantung@example.com', '0900000066', '13 Hai Bà Trưng, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS67', 'US67', 'Đỗ Văn An', 'dỗvanan@example.com', '0900000067', '31 Bà Triệu, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS68', 'US68', 'Phan Thị Phương', 'phanthiphuong@example.com', '0900000068', '87 Phan Chu Trinh, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS69', 'US69', 'Nguyễn Văn Quang', 'nguyễnvanquang@example.com', '0900000069', '85 Nguyễn Du, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS70', 'US70', 'Hoàng Thị Phương', 'hoangthiphuong@example.com', '0900000070', '11 Trần Phú, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS71', 'US71', 'Phan Thị Mai', 'phanthimai@example.com', '0900000071', '117 Lý Thường Kiệt, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS72', 'US72', 'Võ Thị Dung', 'vothidung@example.com', '0900000072', '30 Lê Lợi, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS73', 'US73', 'Đặng Văn Đông', 'dặngvandong@example.com', '0900000073', '1 Nguyễn Trãi, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS74', 'US74', 'Hoàng Văn An', 'hoangvanan@example.com', '0900000074', '69 Trần Hưng Đạo, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS75', 'US75', 'Phạm Văn Cường', 'phamvancuờng@example.com', '0900000075', '9 Hai Bà Trưng, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS76', 'US76', 'Trần Văn Nam', 'trầnvannam@example.com', '0900000076', '44 Bà Triệu, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS77', 'US77', 'Võ Văn Bình', 'vovanbinh@example.com', '0900000077', '15 Phan Chu Trinh, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS78', 'US78', 'Hoàng Thị Thu', 'hoangthithu@example.com', '0900000078', '115 Nguyễn Du, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS79', 'US79', 'Phan Văn Tùng', 'phanvantung@example.com', '0900000079', '156 Trần Phú, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS80', 'US80', 'Đỗ Văn An', 'dỗvanan@example.com', '0900000080', '182 Lý Thường Kiệt, Hà Nội', '2024-11-20', '2024-11-20'),
('CUS81', 'US81', 'Nguyễn Thị Thu', 'nguyễnthithu@example.com', '0900000081', '86 Lê Lợi, Hà Nội', '2024-11-21', '2024-11-21'),
('CUS82', 'US82', 'Đỗ Thị Dung', 'dỗthidung@example.com', '0900000082', '37 Nguyễn Trãi, Hà Nội', '2024-11-22', '2024-11-22'),
('CUS83', 'US83', 'Trương Thị Hạnh', 'truongthihanh@example.com', '0900000083', '182 Trần Hưng Đạo, Hà Nội', '2024-11-23', '2024-11-23'),
('CUS84', 'US84', 'Phạm Văn Bình', 'phamvanbinh@example.com', '0900000084', '24 Hai Bà Trưng, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS85', 'US85', 'Phan Thị Bình', 'phanthibinh@example.com', '0900000085', '127 Bà Triệu, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS86', 'US86', 'Võ Thị Lan', 'vothilan@example.com', '0900000086', '41 Phan Chu Trinh, Hà Nội', '2024-11-26', '2024-11-26'),
('CUS87', 'US87', 'Phạm Thị Bình', 'phamthibinh@example.com', '0900000087', '174 Nguyễn Du, Hà Nội', '2024-11-27', '2024-11-27'),
('CUS88', 'US88', 'Đỗ Thị Lan', 'dỗthilan@example.com', '0900000088', '60 Trần Phú, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS89', 'US89', 'Võ Văn Hoàng', 'vovanhoang@example.com', '0900000089', '158 Lý Thường Kiệt, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS90', 'US90', 'Nguyễn Văn Cường', 'nguyễnvancuờng@example.com', '0900000090', '196 Lê Lợi, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS91', 'US91', 'Đỗ Văn Nam', 'dỗvannam@example.com', '0900000091', '176 Nguyễn Trãi, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS92', 'US92', 'Phan Văn Đông', 'phanvandong@example.com', '0900000092', '173 Trần Hưng Đạo, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS93', 'US93', 'Hoàng Văn Đông', 'hoangvandong@example.com', '0900000093', '92 Hai Bà Trưng, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS94', 'US94', 'Phan Văn Hoàng', 'phanvanhoang@example.com', '0900000094', '199 Bà Triệu, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS95', 'US95', 'Lê Thị Lan', 'lethilan@example.com', '0900000095', '155 Phan Chu Trinh, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS96', 'US96', 'Lê Thị Phương', 'lethiphuong@example.com', '0900000096', '90 Nguyễn Du, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS97', 'US97', 'Trương Văn Cường', 'truongvancuờng@example.com', '0900000097', '151 Trần Phú, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS98', 'US98', 'Trương Thị Dung', 'truongthidung@example.com', '0900000098', '43 Lý Thường Kiệt, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS99', 'US99', 'Lê Văn Tùng', 'levantung@example.com', '0900000099', '181 Lê Lợi, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS100', 'US100', 'Nguyễn Văn Hoàng', 'nguyễnvanhoang@example.com', '0900000100', '16 Nguyễn Trãi, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS101', 'US101', 'Đỗ Văn Tùng', 'dỗvantung@example.com', '0900000101', '22 Trần Hưng Đạo, Hà Nội', '2024-11-11', '2025-11-17'),
('CUS102', 'US102', 'Trương Văn Quang', 'truongvanquang@example.com', '0900000102', '187 Hai Bà Trưng, Hà Nội', '2024-11-12', '2025-11-18'),
('CUS103', 'US103', 'Nguyễn Văn Kiên', 'nguyễnvankien@example.com', '0900000103', '43 Bà Triệu, Hà Nội', '2024-11-13', '2025-11-19'),
('CUS104', 'US104', 'Lê Thị Mai', 'lethimai@example.com', '0900000104', '87 Phan Chu Trinh, Hà Nội', '2024-11-14', '2025-11-20'),
('CUS105', 'US105', 'Hoàng Văn Cường', 'hoangvancuờng@example.com', '0900000105', '134 Nguyễn Du, Hà Nội', '2024-11-15', '2025-11-21'),
('CUS106', 'US106', 'Phạm Thị Ngọc', 'phamthingoc@example.com', '0900000106', '141 Trần Phú, Hà Nội', '2024-11-16', '2025-11-22'),
('CUS107', 'US107', 'Trương Thị Dung', 'truongthidung@example.com', '0900000107', '166 Lý Thường Kiệt, Hà Nội', '2024-11-17', '2025-11-23'),
('CUS108', 'US108', 'Phạm Văn Tùng', 'phamvantung@example.com', '0900000108', '151 Lê Lợi, Hà Nội', '2024-11-18', '2025-11-24'),
('CUS109', 'US109', 'Võ Văn Đông', 'vovandong@example.com', '0900000109', '130 Nguyễn Trãi, Hà Nội', '2024-11-19', '2025-11-26'),
('CUS110', 'US110', 'Đặng Văn Kiên', 'dặngvankien@example.com', '0900000110', '171 Trần Hưng Đạo, Hà Nội', '2024-11-20', '2025-11-26'),
('CUS111', 'US111', 'Trương Thị Lan', 'truongthilan@example.com', '0900000111', '186 Hai Bà Trưng, Hà Nội', '2024-11-21', '2025-11-26'),
('CUS112', 'US112', 'Phan Văn Nam', 'phanvannam@example.com', '0900000112', '164 Bà Triệu, Hà Nội', '2024-11-22', '2025-11-26'),
('CUS113', 'US113', 'Nguyễn Văn Nam', 'nguyễnvannam@example.com', '0900000113', '114 Phan Chu Trinh, Hà Nội', '2025-11-26', '2025-11-26'),
('CUS114', 'US114', 'Võ Văn Quang', 'vovanquang@example.com', '0900000114', '73 Nguyễn Du, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS115', 'US115', 'Trần Thị Dung', 'trầnthidung@example.com', '0900000115', '157 Trần Phú, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS116', 'US116', 'Trương Văn Quang', 'truongvanquang@example.com', '0900000116', '186 Lý Thường Kiệt, Hà Nội', '2024-11-26', '2025-11-15'),
('CUS117', 'US117', 'Trần Văn Phúc', 'trầnvanphuc@example.com', '0900000117', '52 Lê Lợi, Hà Nội', '2024-11-27', '2025-11-16'),
('CUS118', 'US118', 'Lê Thị Mai', 'lethimai@example.com', '0900000118', '148 Nguyễn Trãi, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS119', 'US119', 'Phạm Thị Lan', 'phamthilan@example.com', '0900000119', '173 Trần Hưng Đạo, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS120', 'US120', 'Đỗ Văn An', 'dỗvanan@example.com', '0900000120', '197 Hai Bà Trưng, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS121', 'US121', 'Hoàng Thị Phương', 'hoangthiphuong@example.com', '0900000121', '29 Bà Triệu, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS122', 'US122', 'Võ Thị Hạnh', 'vothihanh@example.com', '0900000122', '164 Phan Chu Trinh, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS123', 'US123', 'Lê Văn Huy', 'levanhuy@example.com', '0900000123', '199 Nguyễn Du, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS124', 'US124', 'Phan Văn Huy', 'phanvanhuy@example.com', '0900000124', '183 Trần Phú, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS125', 'US125', 'Võ Thị Lan', 'vothilan@example.com', '0900000125', '70 Lý Thường Kiệt, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS126', 'US126', 'Đặng Thị Hạnh', 'dặngthihanh@example.com', '0900000126', '156 Lê Lợi, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS127', 'US127', 'Võ Thị Thu', 'vothithu@example.com', '0900000127', '30 Nguyễn Trãi, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS128', 'US128', 'Nguyễn Thị Ngọc', 'nguyễnthingoc@example.com', '0900000128', '116 Trần Hưng Đạo, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS129', 'US129', 'Phan Thị Thu', 'phanthithu@example.com', '0900000129', '153 Hai Bà Trưng, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS130', 'US130', 'Hoàng Thị Hạnh', 'hoangthihanh@example.com', '0900000130', '120 Bà Triệu, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS131', 'US131', 'Phạm Văn Kiên', 'phamvankien@example.com', '0900000131', '80 Phan Chu Trinh, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS132', 'US132', 'Võ Văn Kiên', 'vovankien@example.com', '0900000132', '141 Nguyễn Du, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS133', 'US133', 'Phan Thị Dung', 'phanthidung@example.com', '0900000133', '148 Trần Phú, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS134', 'US134', 'Đặng Thị Hạnh', 'dặngthihanh@example.com', '0900000134', '95 Lý Thường Kiệt, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS135', 'US135', 'Lê Thị Mai', 'lethimai@example.com', '0900000135', '44 Lê Lợi, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS136', 'US136', 'Lê Văn Cường', 'levancuờng@example.com', '0900000136', '102 Nguyễn Trãi, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS137', 'US137', 'Nguyễn Thị Thu', 'nguyễnthithu@example.com', '0900000137', '154 Trần Hưng Đạo, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS138', 'US138', 'Nguyễn Thị Mai', 'nguyễnthimai@example.com', '0900000138', '103 Hai Bà Trưng, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS139', 'US139', 'Trương Văn Phúc', 'truongvanphuc@example.com', '0900000139', '19 Bà Triệu, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS140', 'US140', 'Nguyễn Thị Hạnh', 'nguyễnthihanh@example.com', '0900000140', '166 Phan Chu Trinh, Hà Nội', '2024-11-20', '2024-11-20'),
('CUS141', 'US141', 'Trần Thị Hạnh', 'trầnthihanh@example.com', '0900000141', '167 Nguyễn Du, Hà Nội', '2024-11-21', '2024-11-21'),
('CUS142', 'US142', 'Đỗ Thị Lan', 'dỗthilan@example.com', '0900000142', '111 Trần Phú, Hà Nội', '2024-11-22', '2024-11-22'),
('CUS143', 'US143', 'Đỗ Văn Cường', 'dỗvancuờng@example.com', '0900000143', '6 Lý Thường Kiệt, Hà Nội', '2024-11-23', '2024-11-23'),
('CUS144', 'US144', 'Trương Văn Quang', 'truongvanquang@example.com', '0900000144', '135 Lê Lợi, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS145', 'US145', 'Nguyễn Văn Hoàng', 'nguyễnvanhoang@example.com', '0900000145', '77 Nguyễn Trãi, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS146', 'US146', 'Đặng Thị Hạnh', 'dặngthihanh@example.com', '0900000146', '133 Trần Hưng Đạo, Hà Nội', '2024-11-26', '2024-11-26'),
('CUS147', 'US147', 'Võ Văn Tùng', 'vovantung@example.com', '0900000147', '111 Hai Bà Trưng, Hà Nội', '2024-11-27', '2024-11-27'),
('CUS148', 'US148', 'Hoàng Thị Bình', 'hoangthibinh@example.com', '0900000148', '133 Bà Triệu, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS149', 'US149', 'Phan Thị Lan', 'phanthilan@example.com', '0900000149', '179 Phan Chu Trinh, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS150', 'US150', 'Lê Văn Nam', 'levannam@example.com', '0900000150', '145 Nguyễn Du, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS151', 'US151', 'Lê Thị Dung', 'lethidung@example.com', '0900000151', '130 Trần Phú, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS152', 'US152', 'Hoàng Thị Mai', 'hoangthimai@example.com', '0900000152', '63 Lý Thường Kiệt, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS153', 'US153', 'Lê Văn Huy', 'levanhuy@example.com', '0900000153', '35 Lê Lợi, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS154', 'US154', 'Nguyễn Văn Bình', 'nguyễnvanbinh@example.com', '0900000154', '195 Nguyễn Trãi, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS155', 'US155', 'Phan Thị Lan', 'phanthilan@example.com', '0900000155', '137 Trần Hưng Đạo, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS156', 'US156', 'Đỗ Văn Đông', 'dỗvandong@example.com', '0900000156', '93 Hai Bà Trưng, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS157', 'US157', 'Lê Thị Dung', 'lethidung@example.com', '0900000157', '102 Bà Triệu, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS158', 'US158', 'Hoàng Thị Mai', 'hoangthimai@example.com', '0900000158', '101 Phan Chu Trinh, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS159', 'US159', 'Trương Thị Thu', 'truongthithu@example.com', '0900000159', '41 Nguyễn Du, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS160', 'US160', 'Đỗ Thị Bình', 'dỗthibinh@example.com', '0900000160', '24 Trần Phú, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS161', 'US161', 'Đỗ Văn Quang', 'dỗvanquang@example.com', '0900000161', '48 Lý Thường Kiệt, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS162', 'US162', 'Nguyễn Văn Bình', 'nguyễnvanbinh@example.com', '0900000162', '43 Lê Lợi, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS163', 'US163', 'Phạm Văn Phúc', 'phamvanphuc@example.com', '0900000163', '200 Nguyễn Trãi, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS164', 'US164', 'Phạm Văn Tùng', 'phamvantung@example.com', '0900000164', '133 Trần Hưng Đạo, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS165', 'US165', 'Phan Văn Bình', 'phanvanbinh@example.com', '0900000165', '28 Hai Bà Trưng, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS166', 'US166', 'Đỗ Văn An', 'dỗvanan@example.com', '0900000166', '170 Bà Triệu, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS167', 'US167', 'Trần Thị Dung', 'trầnthidung@example.com', '0900000167', '115 Phan Chu Trinh, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS168', 'US168', 'Trương Thị Bình', 'truongthibinh@example.com', '0900000168', '105 Nguyễn Du, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS169', 'US169', 'Phan Thị Mai', 'phanthimai@example.com', '0900000169', '93 Trần Phú, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS170', 'US170', 'Hoàng Văn Bình', 'hoangvanbinh@example.com', '0900000170', '161 Lý Thường Kiệt, Hà Nội', '2024-11-20', '2024-11-20'),
('CUS171', 'US171', 'Trần Thị Mai', 'trầnthimai@example.com', '0900000171', '129 Lê Lợi, Hà Nội', '2024-11-21', '2024-11-21'),
('CUS172', 'US172', 'Nguyễn Văn Quang', 'nguyễnvanquang@example.com', '0900000172', '46 Nguyễn Trãi, Hà Nội', '2024-11-22', '2024-11-22'),
('CUS173', 'US173', 'Trần Thị Ngọc', 'trầnthingoc@example.com', '0900000173', '17 Trần Hưng Đạo, Hà Nội', '2024-11-23', '2024-11-23'),
('CUS174', 'US174', 'Đặng Thị Lan', 'dặngthilan@example.com', '0900000174', '30 Hai Bà Trưng, Hà Nội', '2024-11-24', '2024-11-24'),
('CUS175', 'US175', 'Phạm Văn Hoàng', 'phamvanhoang@example.com', '0900000175', '26 Bà Triệu, Hà Nội', '2024-11-25', '2024-11-25'),
('CUS176', 'US176', 'Phạm Thị Hạnh', 'phamthihanh@example.com', '0900000176', '30 Phan Chu Trinh, Hà Nội', '2024-11-26', '2024-11-26'),
('CUS177', 'US177', 'Hoàng Thị Phương', 'hoangthiphuong@example.com', '0900000177', '56 Nguyễn Du, Hà Nội', '2024-11-27', '2024-11-27'),
('CUS178', 'US178', 'Phạm Văn Bình', 'phamvanbinh@example.com', '0900000178', '189 Trần Phú, Hà Nội', '2024-11-28', '2024-11-28'),
('CUS179', 'US179', 'Võ Thị Bình', 'vothibinh@example.com', '0900000179', '175 Lý Thường Kiệt, Hà Nội', '2024-11-29', '2024-11-29'),
('CUS180', 'US180', 'Võ Văn Huy', 'vovanhuy@example.com', '0900000180', '166 Lê Lợi, Hà Nội', '2024-11-30', '2024-11-30'),
('CUS181', 'US181', 'Võ Văn Bình', 'vovanbinh@example.com', '0900000181', '124 Nguyễn Trãi, Hà Nội', '2024-11-01', '2024-11-01'),
('CUS182', 'US182', 'Nguyễn Thị Hạnh', 'nguyễnthihanh@example.com', '0900000182', '97 Trần Hưng Đạo, Hà Nội', '2024-11-02', '2024-11-02'),
('CUS183', 'US183', 'Trương Thị Lan', 'truongthilan@example.com', '0900000183', '17 Hai Bà Trưng, Hà Nội', '2024-11-03', '2024-11-03'),
('CUS184', 'US184', 'Phan Thị Lan', 'phanthilan@example.com', '0900000184', '2 Bà Triệu, Hà Nội', '2024-11-04', '2024-11-04'),
('CUS185', 'US185', 'Võ Văn Huy', 'vovanhuy@example.com', '0900000185', '129 Phan Chu Trinh, Hà Nội', '2024-11-05', '2024-11-05'),
('CUS186', 'US186', 'Phạm Văn Huy', 'phamvanhuy@example.com', '0900000186', '159 Nguyễn Du, Hà Nội', '2024-11-06', '2024-11-06'),
('CUS187', 'US187', 'Hoàng Văn Huy', 'hoangvanhuy@example.com', '0900000187', '146 Trần Phú, Hà Nội', '2024-11-07', '2024-11-07'),
('CUS188', 'US188', 'Trần Văn Huy', 'trầnvanhuy@example.com', '0900000188', '170 Lý Thường Kiệt, Hà Nội', '2024-11-08', '2024-11-08'),
('CUS189', 'US189', 'Lê Thị Mai', 'lethimai@example.com', '0900000189', '69 Lê Lợi, Hà Nội', '2024-11-09', '2024-11-09'),
('CUS190', 'US190', 'Hoàng Văn Quang', 'hoangvanquang@example.com', '0900000190', '29 Nguyễn Trãi, Hà Nội', '2024-11-10', '2024-11-10'),
('CUS191', 'US191', 'Võ Văn Huy', 'vovanhuy@example.com', '0900000191', '54 Trần Hưng Đạo, Hà Nội', '2024-11-11', '2024-11-11'),
('CUS192', 'US192', 'Phan Thị Lan', 'phanthilan@example.com', '0900000192', '22 Hai Bà Trưng, Hà Nội', '2024-11-12', '2024-11-12'),
('CUS193', 'US193', 'Lê Thị Lan', 'lethilan@example.com', '0900000193', '154 Bà Triệu, Hà Nội', '2024-11-13', '2024-11-13'),
('CUS194', 'US194', 'Hoàng Văn Quang', 'hoangvanquang@example.com', '0900000194', '108 Phan Chu Trinh, Hà Nội', '2024-11-14', '2024-11-14'),
('CUS195', 'US195', 'Phạm Văn Phúc', 'phamvanphuc@example.com', '0900000195', '89 Nguyễn Du, Hà Nội', '2024-11-15', '2024-11-15'),
('CUS196', 'US196', 'Trần Thị Mai', 'trầnthimai@example.com', '0900000196', '144 Trần Phú, Hà Nội', '2024-11-16', '2024-11-16'),
('CUS197', 'US197', 'Trần Thị Dung', 'trầnthidung@example.com', '0900000197', '37 Lý Thường Kiệt, Hà Nội', '2024-11-17', '2024-11-17'),
('CUS198', 'US198', 'Phạm Văn Bình', 'phamvanbinh@example.com', '0900000198', '198 Lê Lợi, Hà Nội', '2024-11-18', '2024-11-18'),
('CUS199', 'US199', 'Nguyễn Thị Bình', 'nguyễnthibinh@example.com', '0900000199', '59 Nguyễn Trãi, Hà Nội', '2024-11-19', '2024-11-19'),
('CUS200', 'US200', 'Lê Thị Hạnh', 'lethihanh@example.com', '0900000200', '73 Trần Hưng Đạo, Hà Nội', '2024-11-20', '2024-11-20');

-- Bật lại kiểm tra khóa ngoại
-- 1. Thêm cột full_name vào bảng users
UPDATE product_variants v
SET stock_quantity = (
    IFNULL((SELECT SUM(quantity) FROM stock_in_details WHERE variant_id = v.variant_id), 0)
    - 
    IFNULL((SELECT SUM(quantity) FROM order_details WHERE variant_id = v.variant_id), 0)
);



-- 2. Cập nhật dữ liệu tên cho tài khoản OS01 (để đăng nhập không bị lỗi hiển thị)

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;



