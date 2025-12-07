require('dotenv').config();
const db = require('../config/db.config');

(async () => {
  try {
    const sql = `INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity, additional_price) VALUES ('VTEST1','P0001','Đỏ','M',10,0) ON DUPLICATE KEY UPDATE stock_quantity=VALUES(stock_quantity)`;
    await db.query(sql);
    console.log('Inserted/updated test variant VTEST1');
    process.exit(0);
  } catch (e) {
    console.error('Error inserting test variant:', e.message);
    process.exit(1);
  }
})();