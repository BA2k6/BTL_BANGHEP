// server/models/productModel.js
const db = require('../config/db.config');

const productModel = {
    // 1. Get Product List (Supports filtering & search)
    getAllProducts: async (options = {}) => {
        const params = [];
        // Default to select all (1=1) so Admin can see hidden products too
        let whereClause = 'WHERE 1=1'; 

        if (options.categoryId && options.categoryId !== 'all') {
            whereClause += ' AND p.category_id = ?';
            params.push(options.categoryId);
        }

        const query = `
            SELECT 
                p.product_id, p.name, p.category_id, p.base_price, p.cost_price,
                p.is_active as isActive,
                p.category_id as categoryId,
                c.category_name as categoryName,
                p.brand,
                p.created_at,
                -- Total stock from variants table
                (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.product_id) as stockQuantity,
                -- Group Size/Color for summary display
                (SELECT GROUP_CONCAT(DISTINCT size ORDER BY size ASC SEPARATOR ', ') FROM product_variants WHERE product_id = p.product_id) as sizes,
                (SELECT GROUP_CONCAT(DISTINCT color SEPARATOR ', ') FROM product_variants WHERE product_id = p.product_id) as colors
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ${whereClause}
            ORDER BY p.created_at DESC
        `;

        const [rows] = await db.query(query, params);
        return rows;
    },

    // 2. Get Product Detail + Variants + Images
    getProductById: async (id) => {
        try {
            // Query 1: Product General Info (Added material)
            const queryProduct = `
                SELECT 
                    p.product_id as id,
                    p.name,
                    p.description,
                    p.material, -- Added material field
                    p.base_price as price,
                    p.cost_price as costPrice,
                    p.is_active as isActive,
                    p.category_id as categoryId,
                    c.category_name as categoryName,
                    p.brand,
                    p.created_at,
                    p.avg_rating as avgRating,
                    p.review_count as reviewCount
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE p.product_id = ?
            `;
            
            // Query 2: Variants List
            const queryVariants = `
                SELECT variant_id, color, size, stock_quantity, additional_price
                FROM product_variants 
                WHERE product_id = ?
                ORDER BY color, size
            `;

            // Query 3: Images List
            const queryImages = `
                SELECT image_id, image_url, color 
                FROM product_images 
                WHERE product_id = ? 
                ORDER BY sort_order ASC
            `;

            const [productRows] = await db.query(queryProduct, [id]);
            const [variantRows] = await db.query(queryVariants, [id]);
            const [imageRows] = await db.query(queryImages, [id]);

            if (productRows.length === 0) return null;

            const product = productRows[0];
            product.variants = variantRows;
            product.images = imageRows; // Attach images to product object
            
            // Re-calculate aggregates for convenience
            product.stockQuantity = variantRows.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
            product.sizes = [...new Set(variantRows.map(v => v.size))].join(', ');
            product.colors = [...new Set(variantRows.map(v => v.color))].join(', ');

            return product;
        } catch (error) {
            console.error("SQL Error getProductById:", error);
            throw error;
        }
    },

    // 3. Get All Variants (For Stock In/Sales screens)
    getAllVariants: async () => {
        const query = `
            SELECT 
                pv.variant_id, 
                pv.product_id, 
                pv.color, 
                pv.size, 
                pv.stock_quantity, 
                p.name AS product_name,
                p.cost_price,
                p.base_price
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            ORDER BY p.created_at DESC, pv.variant_id ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 4. Generate Auto Product ID (P001, P002...)
    generateNextId: async () => {
        const query = `
            SELECT product_id 
            FROM products 
            WHERE product_id REGEXP '^P[0-9]+$' 
            ORDER BY CAST(SUBSTRING(product_id, 2) AS UNSIGNED) DESC 
            LIMIT 1
        `;
        const [rows] = await db.query(query);
        
        let nextId = 'P001';
        if (rows.length > 0) {
            const lastId = rows[0].product_id; 
            const numberPart = parseInt(lastId.substring(1), 10); 
            const nextNumber = numberPart + 1; 
            nextId = 'P' + String(nextNumber).padStart(3, '0');
        }
        return nextId;
    },

    // 5. Create Header (Products table) - Added 'material'
    createProductHeader: async (product, conn) => {
        const { id, name, categoryId, price, costPrice, isActive, brand, description, material } = product;
        const query = `
            INSERT INTO products (product_id, name, category_id, base_price, cost_price, is_active, brand, description, material)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Support transaction if 'conn' is provided
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [id, name, categoryId || null, price, costPrice, isActive ? 1 : 0, brand || null, description || null, material || null]);
    },

    // 6.1 Create Single Variant (Default if no Size/Color options)
    createSingleVariant: async ({ productId, stock }, conn) => {
        const variantId = `${productId}_DEF`.substring(0, 25);
        const query = `
            INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
            VALUES (?, ?, 'Default', 'Free', ?)
        `;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [variantId, productId, stock]);
    },

    // 6.2 Create Bulk Variants (Optimized Bulk Insert)
    createVariantsBulk: async (productId, sizeStr, colorStr, conn) => {
        if (!sizeStr && !colorStr) return;

        // Convert input strings to arrays
        let sizes = sizeStr ? sizeStr.split(',').map(s => s.trim()).filter(Boolean) : ['Free'];
        let colors = colorStr ? colorStr.split(',').map(c => c.trim()).filter(Boolean) : ['Default'];
        
        if (sizes.length === 0) sizes = ['Free'];
        if (colors.length === 0) colors = ['Default'];

        const executor = conn ? conn.query.bind(conn) : db.query;

        // Prepare data array for Bulk Insert
        const values = [];
        let index = 1;

        for (const color of colors) {
            for (const size of sizes) {
                // Generate Variant ID: P001_1, P001_2...
                const variantId = `${productId}_${index}`; 
                // [variant_id, product_id, color, size, stock_quantity]
                values.push([variantId, productId, color, size, 0]);
                index++;
            }
        }

        if (values.length > 0) {
            const sql = `
                INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
                VALUES ?
            `;
            // MySQL bulk insert syntax requires nested array [[...]]
            await executor(sql, [values]);
        }
    },

    // 7. Update General Product Info - Added 'material'
    updateProductHeader: async (id, product) => {
        const { name, categoryId, price, costPrice, isActive, brand, description, material } = product;
        const query = `
            UPDATE products 
            SET name=?, category_id=?, base_price=?, cost_price=?, is_active=?, brand=?, description=?, material=?
            WHERE product_id=?
        `;
        const [result] = await db.query(query, [name, categoryId, price, costPrice, isActive ? 1 : 0, brand, description, material, id]);
        return result;
    },

    // 8. Quick Update Status (Toggle Active/Inactive)
    updateStatus: async (id, status) => {
        const query = `UPDATE products SET is_active = ? WHERE product_id = ?`;
        // status: true/false -> convert to 1/0
        const [result] = await db.query(query, [status ? 1 : 0, id]);
        return result;
    },

    // 9. Delete Product
    deleteProduct: async (id) => {
        // FK CASCADE will automatically delete variants and images
        const query = `DELETE FROM products WHERE product_id = ?`;
        const [result] = await db.query(query, [id]);
        return result;
    },

    // 10. Add Product Image (Used for both Create and Update)
    addProductImage: async (productId, color, imageUrl, conn) => {
        const query = `
            INSERT INTO product_images (product_id, color, image_url, sort_order)
            VALUES (?, ?, ?, 0)
        `;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [productId, color, imageUrl]);
    },
    
    // 11. Delete all images of a product (Used during Update to clear old images)
    deleteProductImages: async (productId, conn) => {
        const query = `DELETE FROM product_images WHERE product_id = ?`;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [productId]);
    },

    // 12. Sync Variants (Add new / Delete old based on new colors/sizes list)
    syncVariants: async (productId, sizeStr, colorStr, conn) => {
        // 1. Normalize Input
        let newSizes = sizeStr ? sizeStr.split(',').map(s => s.trim()).filter(Boolean) : ['Free'];
        let newColors = colorStr ? colorStr.split(',').map(c => c.trim()).filter(Boolean) : ['Default'];
        
        if (newSizes.length === 0) newSizes = ['Free'];
        if (newColors.length === 0) newColors = ['Default'];

        const executor = conn ? conn.query.bind(conn) : db.query;

        // 2. DELETE variants that are not in the new list
        // Note: If a variant has orders (foreign key constraint), this might fail or not delete.
        // Handled via try-catch in controller.
        const deleteQuery = `
            DELETE FROM product_variants 
            WHERE product_id = ? 
            AND (color NOT IN (?) OR size NOT IN (?))
        `;
        // Pass arrays to placeholders (?) for IN clause
        await executor(deleteQuery, [productId, newColors, newSizes]);

        // 3. ADD new variants (if they don't exist)
        const values = [];
        let index = 1;
        // Use timestamp to make ID more unique to avoid collision when adding repeatedly
        const timePart = Date.now().toString().slice(-4); 

        for (const color of newColors) {
            for (const size of newSizes) {
                // Generate Dynamic ID: P001_timestamp_index
                const dynamicId = `${productId}_${timePart}${index}`;
                
                // [variant_id, product_id, color, size, stock_quantity]
                values.push([dynamicId, productId, color, size, 0]);
                index++;
            }
        }

        if (values.length > 0) {
            // Loop insert each row with ON DUPLICATE KEY UPDATE to handle existing variants gracefully
            for (const row of values) {
                const [vId, pId, col, sz, stock] = row;
                const sqlSingle = `
                    INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE stock_quantity = stock_quantity -- Keep existing stock
                `;
                await executor(sqlSingle, [vId, pId, col, sz, stock]);
            }
        }
    }
};

module.exports = productModel;