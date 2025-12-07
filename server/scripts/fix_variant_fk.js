require('dotenv').config();
const db = require('../config/db.config');

(async () => {
  try {
    await db.query("ALTER TABLE order_details MODIFY COLUMN variant_id VARCHAR(25) COLLATE utf8mb4_0900_ai_ci NULL");
    console.log('Modified variant_id collation');
  } catch (e) {
    console.error('Modify column error:', e.message);
  }
  try {
    await db.query("ALTER TABLE order_details ADD CONSTRAINT order_details_variant_fk FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT");
    console.log('Added FK order_details_variant_fk');
  } catch (e) {
    console.error('Add FK error:', e.message);
  }
  process.exit(0);
})();