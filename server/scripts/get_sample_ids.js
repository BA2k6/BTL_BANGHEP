require('dotenv').config();
const db = require('../config/db.config');

(async () => {
  try {
    const [custRows] = await db.query('SELECT customer_id, phone FROM customers LIMIT 1');
    console.log('Customer sample:', custRows[0] || null);
    const [userRows] = await db.query('SELECT user_id FROM users LIMIT 1');
    console.log('User sample (for staff):', userRows[0] || null);
    const [variantRows] = await db.query("SELECT variant_id FROM product_variants LIMIT 5");
    console.log('Some variants:', variantRows.map(r=>r.variant_id));
    process.exit(0);
  } catch (e) {
    console.error('Error fetching samples:', e.message);
    process.exit(1);
  }
})();