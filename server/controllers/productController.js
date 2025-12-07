// server/controllers/productController.js
const productModel = require('../models/productModel');
const db = require('../config/db.config');

const productController = {
    // 1. GET List (List products with variants)
    listProducts: async (req, res) => {
        const { category_id, search_term } = req.query;
        
        // DEFAULT: Select all (1=1) so Admin can see "Inactive" products and re-enable them
        let filterConditions = "1=1"; 
        const queryParams = [];

        if (category_id && category_id !== 'all') {
            filterConditions += " AND p.category_id = ?";
            queryParams.push(category_id);
        }

        if (search_term) {
            filterConditions += " AND (p.name LIKE ? OR p.product_id LIKE ?)";
            queryParams.push(`%${search_term}%`, `%${search_term}%`);
        }

        const query = `
            SELECT 
                p.product_id, p.name, p.category_id, 
                p.base_price, -- ✅ FIXED: Dùng tên cột chính xác trong DB (bỏ p.price)
                p.cost_price, 
                p.is_active,  -- Added to let Frontend know status
                pv.variant_id, pv.color, pv.size, pv.stock_quantity, pv.additional_price
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE ${filterConditions}
            ORDER BY p.created_at DESC, pv.variant_id;
        `;
        
        try {
            const [rows] = await db.query(query, queryParams);
            
            // CONVERT FLAT DATA TO NESTED STRUCTURE
            const productsMap = {};
            rows.forEach(row => {
                const { product_id, name, base_price, cost_price, is_active, brand, category_id, ...variant } = row; 
                
                if (!productsMap[product_id]) {
                    productsMap[product_id] = {
                        product_id, 
                        name, 
                        base_price, 
                        cost_price,
                        is_active, 
                        brand,
                        category_id,
                        variants: []
                    };
                }
                
                // Add variant only if it exists
                if (variant.variant_id) {
                    productsMap[product_id].variants.push({
                        variant_id: variant.variant_id,
                        color: variant.color,
                        size: variant.size,
                        stock_quantity: variant.stock_quantity,
                        additional_price: variant.additional_price,
                        price: parseFloat(base_price) + parseFloat(variant.additional_price || 0)
                    });
                }
            });

            const finalProducts = Object.values(productsMap);
            res.status(200).json(finalProducts);

        } catch (error) {
            console.error("Error listing products:", error);
            res.status(500).json({ message: "Backend error while loading products.", details: error.message });
        }
    },

    // 2. GET Detail
    getProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await productModel.getProductById(id);
            if (!product) return res.status(404).json({ message: 'Product not found.' });
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // 3. GET VARIANTS (For Stock In screen)
    listVariants: async (req, res) => {
        try {
            const variants = await productModel.getAllVariants();
            res.status(200).json(variants);
        } catch (error) {
            console.error("List Variants Error:", error);
            res.status(500).json({ message: 'Server error while fetching variant list.' });
        }
    },

    // 4. CREATE (Updated to handle images with colors)
    createProduct: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // images is now an array of objects [{url: '...', color: '...'}, ...]
            let { id, name, categoryId, price, costPrice, isActive, sizes, colors, brand, description, material, stockQuantity, images } = req.body;
            const initialStock = Number(stockQuantity) || 0;

            if (!id || id.trim() === '') id = await productModel.generateNextId();
            if (!name) throw new Error('Product Name is required.');

            // 1. Create Header
            await productModel.createProductHeader({
                id, name, categoryId, price, costPrice, isActive, brand, description, material
            }, conn);

            // 2. Create Variants
            const hasOptions = (sizes && sizes.trim()) || (colors && colors.trim());
            if (hasOptions) {
                await productModel.createVariantsBulk(id, sizes, colors, conn);
            } else {
                await productModel.createSingleVariant({ productId: id, stock: initialStock }, conn);
            }

            // 3. Handle Images (NEW LOGIC)
            if (images && Array.isArray(images) && images.length > 0) {
                for (const imgItem of images) {
                    // Only save if URL exists. Default color if missing.
                    if(imgItem.url && imgItem.url.trim()) {
                        const colorToSave = imgItem.color && imgItem.color.trim() ? imgItem.color.trim() : 'Default';
                        await productModel.addProductImage(id, colorToSave, imgItem.url.trim(), conn);
                    }
                }
            }

            await conn.commit();
            res.status(201).json({ success: true, message: 'Created successfully.', productId: id });

        } catch (error) {
            await conn.rollback();
            console.error('Create Error:', error);
            res.status(500).json({ message: error.message });
        } finally {
            conn.release();
        }
    },

    // 5. UPDATE (Updated to handle image with color & Sync Variants)
    updateProduct: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            const { id } = req.params;
            // Get sizes and colors from body to sync variants
            const { name, categoryId, price, costPrice, isActive, brand, description, material, images, colors, sizes } = req.body;
            
            // 1. Update General Info
            await productModel.updateProductHeader(id, {
                name, categoryId, price, costPrice, isActive, brand, description, material
            });

            // 2. --- SYNC VARIANTS (NEW) ---
            // Only sync if sizes and colors are sent
            if (typeof sizes !== 'undefined' && typeof colors !== 'undefined') {
                await productModel.syncVariants(id, sizes, colors, conn);
            }
            // --------------------------------

            // 3. Handle Image Update (Delete old -> Add new)
            if (images && Array.isArray(images)) {
                await productModel.deleteProductImages(id, conn);
                for (const imgItem of images) {
                    if(imgItem.url && imgItem.url.trim()) {
                         const colorToSave = imgItem.color && imgItem.color.trim() ? imgItem.color.trim() : 'Default';
                        await productModel.addProductImage(id, colorToSave, imgItem.url.trim(), conn);
                    }
                }
            }
            
            await conn.commit();
            res.status(200).json({ message: 'Update successful.' });
        } catch (error) {
            await conn.rollback();
            // Catch Foreign Key Constraint Error (if trying to delete a variant that has orders)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ 
                    message: 'Cannot delete Color/Size because there are related orders. Please just hide the product or keep that variant.' 
                });
            }
            console.error("Update Error:", error);
            res.status(500).json({ message: error.message });
        } finally {
            conn.release();
        }
    },

    // 6. DELETE
    deleteProduct: async (req, res) => {
        try {
            await productModel.deleteProduct(req.params.id);
            res.status(200).json({ message: 'Product deleted.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 7. TOGGLE STATUS (NEW: Quick Status Change)
    toggleProductStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body; // true/false from frontend
            
            // Call updateStatus in Model
            await productModel.updateStatus(id, is_active);
            
            res.status(200).json({ 
                success: true, 
                message: `Product is now ${is_active ? 'Active' : 'Inactive'}.` 
            });
        } catch (error) {
            console.error("Toggle Status Error:", error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = productController;