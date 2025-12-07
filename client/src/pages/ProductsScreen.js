// client/src/pages/ProductsScreen.js

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ChevronDown, Eye, RefreshCw } from 'lucide-react'; 
import { getProducts, getCategories, deleteProduct, updateProductStatus } from '../services/api'; 
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';
import ProductFormModal from '../components/ProductFormModal';

export const ProductsScreen = ({ userRoleName }) => {
    const [products, setProducts] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentProductData, setCurrentProductData] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false); 

    // State loading khi đang bấm nút đổi trạng thái
    const [isToggling, setIsToggling] = useState(null);

    const canEdit = [ROLES.OWNER.name, ROLES.WAREHOUSE.name].includes(userRoleName);
    const canDelete = userRoleName === ROLES.OWNER.name;

    // Load Categories
    useEffect(() => {
        getCategories().then(cats => setCategories(cats || [])).catch(console.error);
    }, []);

    // Load Products
    const loadProducts = async (category, search) => {
        setIsLoading(true);
        try {
            const prods = await getProducts(category, search); 
            setProducts(prods || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Lỗi tải dữ liệu sản phẩm.');
        } finally {
            setIsLoading(false);
            setIsLoadingInitial(false);
        }
    };

    // Gọi API khi category hoặc searchTerm thay đổi (debounce)
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            const catParam = selectedCategory === 'all' ? null : selectedCategory;
            loadProducts(catParam, searchTerm);
        }, 300); 
        return () => clearTimeout(delaySearch);
    }, [selectedCategory, searchTerm]);

    // Auto refresh event listener
    useEffect(() => {
        const handler = () => loadProducts(selectedCategory, searchTerm);
        window.addEventListener('products:updated', handler);
        return () => window.removeEventListener('products:updated', handler);
    }, [selectedCategory, searchTerm]);

    // --- HANDLERS ---

    const handleToggleStatus = async (productId, currentStatus) => {
        if (!canEdit) return;
        const newStatus = !currentStatus;
        
        setProducts(prev => prev.map(p => 
            p.product_id === productId ? { ...p, is_active: newStatus } : p
        ));

        try {
            setIsToggling(productId); 
            await updateProductStatus(productId, newStatus);
        } catch (err) {
            alert('Không thể cập nhật trạng thái: ' + err.message);
            setProducts(prev => prev.map(p => 
                p.product_id === productId ? { ...p, is_active: currentStatus } : p
            ));
        } finally {
            setIsToggling(null); 
        }
    };

    const handleAddNew = () => {
        setCurrentProductData(null); 
        setIsViewMode(false); 
        setShowAddModal(true);
    };

    const handleViewClick = (p) => {
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(true); 
        setShowAddModal(true);
    };

    const handleEditClick = (p) => {
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(false); 
        setShowAddModal(true);
    };

    // Map dữ liệu để truyền vào Modal
    const mapProductToForm = (p) => {
        const totalStock = p.variants && p.variants.length > 0 
            ? p.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
            : 0;

        const uniqueColors = p.variants ? [...new Set(p.variants.map(v => v.color))].filter(c => c !== 'Default').join(', ') : '';
        const uniqueSizes = p.variants ? [...new Set(p.variants.map(v => v.size))].filter(s => s !== 'Free').join(', ') : '';

        return {
            id: p.product_id,
            name: p.name || '',
            categoryId: p.category_id || '',
            price: p.base_price || 0,
            costPrice: p.cost_price || 0,
            brand: p.brand || '',
            description: p.description || '',
            material: p.material || '',
            isActive: p.is_active, 
            variants: p.variants || [], 
            stockQuantity: totalStock,
            sizes: uniqueSizes, 
            colors: uniqueColors, 
        };
    };

    const handleDelete = async (id) => {
        if (!window.confirm('CẢNH BÁO: Xóa sản phẩm sẽ xóa toàn bộ tồn kho và hình ảnh liên quan!')) return;
        try {
            await deleteProduct(id);
            window.dispatchEvent(new Event('products:updated'));
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa');
        }
    };

    const displayedProducts = useMemo(() => {
        const lowerSearch = normalizeSearchableValue(searchTerm);
        
        return products.filter(p => {
            if (!lowerSearch) return true;
            const content = `${p.product_id} ${p.name} ${p.brand}`.toLowerCase();
            return normalizeSearchableValue(content).includes(lowerSearch);
        }).map(p => {
            const categoryName = categories.find(c => c.category_id === p.category_id)?.category_name || '-';
            
            let summaryVariants = "Mặc định";
            let totalStock = 0;
            
            if (p.variants && p.variants.length > 0) {
                const colors = [...new Set(p.variants.map(v => v.color))].filter(c => c !== 'Default');
                const sizes = [...new Set(p.variants.map(v => v.size))].filter(s => s !== 'Free');
                totalStock = p.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

                if (colors.length > 0 || sizes.length > 0) {
                    summaryVariants = `${colors.length} Màu, ${sizes.length} Size`;
                }
            }

            return {
                ...p,
                categoryName,
                summaryVariants,
                totalStock
            };
        });
    }, [products, searchTerm, categories]);


    if (isLoadingInitial) return <div className="p-8 text-center text-blue-600 animate-pulse">Đang tải dữ liệu...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6 p-4 md:p-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                    <p className="text-gray-500 text-sm mt-1">Tổng cộng: <span className="font-semibold">{products.length}</span> sản phẩm</p>
                </div>
                {canEdit && (
                    <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all font-medium">
                        <Plus className="w-5 h-5" /> Thêm sản phẩm
                    </button>
                )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm (Mã/Tên/Thương hiệu)..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                    </div>
                    <div className="w-full sm:w-64 relative">
                        <select 
                            value={selectedCategory} 
                            onChange={e => setSelectedCategory(e.target.value)} 
                            className="w-full appearance-none bg-gray-50 border border-gray-200 py-2.5 pl-4 pr-10 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
                        >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map(c => (<option key={c.category_id} value={c.category_id}>{c.category_name}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                {/* --- THAY ĐỔI Ở ĐÂY: DANH MỤC -> THƯƠNG HIỆU --- */}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thương hiệu</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Phân loại</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá bán</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tổng Tồn</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayedProducts.map((item) => (
                                <tr 
                                    key={item.product_id} 
                                    className="hover:bg-blue-50/50 transition-colors group"
                                >
                                    {/* Cột 1: Tên & Mã */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-sm group-hover:text-blue-700">{item.name}</span>
                                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-xs border border-gray-200 mt-1 w-fit">{item.product_id}</span>
                                        </div>
                                    </td>

                                    {/* --- THAY ĐỔI Ở ĐÂY: HIỂN THỊ BRAND --- */}
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                        {item.brand || <span className="text-gray-400 italic">--</span>}
                                    </td>

                                    {/* Cột 3: Phân loại (Biến thể tóm tắt) */}
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                            {item.summaryVariants}
                                        </span>
                                    </td>

                                    {/* Cột 4: Giá bán */}
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed">
                                        <div className="text-sm font-bold text-gray-900">{formatCurrency(item.base_price)}</div>
                                        {canEdit && <div className="text-xs text-gray-500 mt-0.5">Vốn: {formatCurrency(item.cost_price)}</div>}
                                    </td>

                                    {/* Cột 5: Tổng tồn kho */}
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.totalStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.totalStock > 0 ? `${item.totalStock} sp` : 'Hết hàng'}
                                        </span>
                                    </td>
                                    
                                    {/* Cột 6: Trạng thái (Clickable) */}
                                    <td className="px-6 py-4 whitespace-normal break-words text-center leading-relaxed">
                                        <button
                                            onClick={() => handleToggleStatus(item.product_id, item.is_active)}
                                            disabled={!canEdit || isToggling === item.product_id}
                                            className={`
                                                px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1 mx-auto
                                                ${item.is_active 
                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                }
                                                ${canEdit ? 'cursor-pointer hover:shadow-sm' : 'cursor-default opacity-70'}
                                                ${isToggling === item.product_id ? 'opacity-50 cursor-wait' : ''}
                                            `}
                                            title={canEdit ? "Nhấn để đổi trạng thái" : ""}
                                        >
                                            {isToggling === item.product_id && <RefreshCw className="w-3 h-3 animate-spin"/>}
                                            {item.is_active ? 'Đang bán' : 'Ngừng bán'}
                                        </button>
                                    </td>

                                    {/* Cột 7: Thao tác */}
                                    <td className="px-6 py-4 whitespace-normal break-words text-right text-sm font-medium leading-relaxed">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleViewClick(item)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title="Xem chi tiết">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {canEdit && (
                                                <button onClick={() => handleEditClick(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Sửa">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => handleDelete(item.product_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {displayedProducts.length === 0 && <tr><td colSpan="7" className="px-6 py-16 text-center text-gray-500">Không tìm thấy sản phẩm nào</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductFormModal 
                open={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSaved={() => window.dispatchEvent(new Event('products:updated'))} 
                initialData={currentProductData} 
                viewOnly={isViewMode} 
            />
        </div>
    );
};