require('dotenv').config();
const db = require('../config/db.config');

(async () => {
  try {
    await db.query("ALTER TABLE order_details ADD COLUMN variant_id VARCHAR(25) COLLATE utf8mb4_unicode_ci NULL AFTER order_id");
  } catch (e) {
    if (!e.message.includes('Duplicate column name')) console.error('Add column error:', e.message);
  }
  try {
    await db.query("CREATE INDEX idx_od_variant ON order_details(variant_id)");
  } catch (e) {
    if (!e.message.includes('Duplicate key name')) console.error('Create index error:', e.message);
  }
  try {
    await db.query("ALTER TABLE order_details ADD CONSTRAINT order_details_variant_fk FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE RESTRICT");
  } catch (e) {
    if (!e.message.includes('errno: 121') && !e.message.includes('Duplicate')) console.error('Add FK error:', e.message);
  }
  console.log('Done attempts to add variant_id and FK (check messages above if any)');
  process.exit(0);
})();