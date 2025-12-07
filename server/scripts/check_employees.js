const db = require('../config/db.config');

async function checkEmployees() {
    try {
        console.log('Checking employees...\n');
        
        const [rows] = await db.query(`
            SELECT user_id, full_name, role FROM employees LIMIT 20
        `);
        
        if (rows.length === 0) {
            console.log('❌ No employees found in database!');
        } else {
            console.log('✅ Employees found:');
            console.table(rows);
        }
        
        // Also check if OWNER exists
        console.log('\n\nChecking specific employee "OWNER"...');
        const [ownerRows] = await db.query(`
            SELECT * FROM employees WHERE user_id = 'OWNER'
        `);
        
        if (ownerRows.length === 0) {
            console.log('❌ "OWNER" not found');
        } else {
            console.log('✅ OWNER found:', ownerRows[0]);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkEmployees();