require('dotenv').config();
const db = require('../config/db.config');

const sql = `CREATE TABLE IF NOT EXISTS product_variants (
  variant_id VARCHAR(25) PRIMARY KEY,
  product_id VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  color VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  additional_price DECIMAL(18,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE (product_id, color, size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

(async () => {
  try {
    await db.query(sql);
    console.log('Created product_variants (or already exists)');
    process.exit(0);
  } catch (e) {
    console.error('Error creating table:', e.message);
    process.exit(1);
  }
})();
