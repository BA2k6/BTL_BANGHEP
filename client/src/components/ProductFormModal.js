// client/src/components/ProductFormModal.js

import React, { useState, useEffect, useMemo } from 'react';
import { createProduct, updateProduct, getCategories, getProduct } from '../services/api';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react'; // Import icon từ lucide-react

const ProductFormModal = ({ open, onClose, onSaved, initialData, viewOnly }) => {
  const [form, setForm] = useState({ 
    id: '', name: '', categoryId: '', price: '', costPrice: '', 
    stockQuantity: '', isActive: true, sizes: '', colors: '', brand: '', description: '',
    material: '',
    // Thay thế chuỗi imageUrls bằng mảng đối tượng { url, color }
    imageList: [] 
  });
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Load danh mục khi component mount
  useEffect(() => {
    getCategories().then(cats => setCategories(cats || [])).catch(()=>{});
  }, []);

  // --- LOGIC MỚI: TÍNH TOÁN DANH SÁCH MÀU CÓ SẴN TỪ Ô INPUT ---
  const availableColors = useMemo(() => {
      if (!form.colors || form.colors.trim() === '') return ['Default'];
      // Tách chuỗi màu bằng dấu phẩy
      const cols = form.colors.split(',').map(c => c.trim()).filter(c => c !== '');
      return cols.length > 0 ? cols : ['Default'];
  }, [form.colors]);

  // --- LOGIC QUẢN LÝ DANH SÁCH ẢNH ---
  const handleAddImageRow = () => {
      // Mặc định chọn màu đầu tiên trong danh sách màu có sẵn
      setForm(prev => ({
          ...prev,
          imageList: [...prev.imageList, { url: '', color: availableColors[0] || 'Default' }]
      }));
  };

  const handleRemoveImageRow = (index) => {
      setForm(prev => ({
          ...prev,
          imageList: prev.imageList.filter((_, i) => i !== index)
      }));
  };

  const handleImageChange = (index, field, value) => {
      const newList = [...form.imageList];
      newList[index][field] = value;
      setForm(prev => ({ ...prev, imageList: newList }));
  };
  // ---------------------------------------------

  useEffect(() => {
    if (open) {
      if (initialData) {
        // --- CHẾ ĐỘ XEM / SỬA ---
        const fetchDetail = async () => {
            setFetchingDetails(true);
            try {
                // 1. Set form sơ bộ từ props
                setForm(prev => ({
                    ...prev,
                    id: initialData.id || '',
                    name: initialData.name || '',
                    categoryId: initialData.categoryId || '',
                    price: initialData.price || '',
                    costPrice: initialData.costPrice || '',
                    stockQuantity: initialData.stockQuantity || 0,
                    isActive: initialData.isActive !== undefined ? Boolean(initialData.isActive) : true,
                    sizes: initialData.sizes || '',
                    colors: initialData.colors || '', // Sẽ được update lại chính xác từ API
                    brand: initialData.brand || '',
                    description: initialData.description || '',
                    material: initialData.material || '',
                    imageList: [] // Reset để load mới
                }));

                // 2. Gọi API lấy chi tiết đầy đủ (để lấy variants và images)
const fullData = await getProduct(initialData.id);
                if (fullData) {
                    const mappedImages = fullData.images ? fullData.images.map(img => ({
                        url: img.image_url,
                        color: img.color
                    })) : [];

                    setForm(prev => ({
                        ...prev,
                        // --- [SỬA QUAN TRỌNG]: CẬP NHẬT LẠI CÁC TRƯỜNG CHÍNH ---
                        categoryId: fullData.categoryId || prev.categoryId, // Cập nhật Category
                        name: fullData.name || prev.name,
                        price: fullData.price || prev.price,
                        costPrice: fullData.costPrice || prev.costPrice,
                        // --------------------------------------------------------
                        
                        description: fullData.description || prev.description,
                        brand: fullData.brand || prev.brand,
                        material: fullData.material || '',
                        isActive: fullData.isActive !== undefined ? Boolean(fullData.isActive) : prev.isActive,
                        imageList: mappedImages,
                        colors: fullData.colors || prev.colors,
                        sizes: fullData.sizes || prev.sizes
                    }));

                    if (fullData.variants) {
                        setVariants(fullData.variants);
                        // Tính lại tổng tồn kho
                        const totalStock = fullData.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                        setForm(prev => ({ ...prev, stockQuantity: totalStock }));
                    }
                }
            } catch (err) {
                console.error("Lỗi lấy chi tiết:", err);
            } finally {
                setFetchingDetails(false);
            }
        };
        fetchDetail();
      } else {
        // --- CHẾ ĐỘ THÊM MỚI ---
        setForm({ 
            id: '', name: '', categoryId: '', price: '', costPrice: '', 
            stockQuantity: '', isActive: true, sizes: '', colors: '', brand: '', description: '',
            material: '', 
            imageList: [{ url: '', color: 'Default' }] // Mặc định có 1 dòng trống
        });
        setVariants([]);
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;

    setLoading(true);
    try {
      if (!initialData && (!form.categoryId || !form.price || !form.costPrice)) {
        alert('Vui lòng nhập đầy đủ: Danh mục, Giá bán, Giá vốn.');
        setLoading(false);
        return;
      }

      // Lọc bỏ các dòng ảnh trống URL trước khi gửi
      const validImages = form.imageList.filter(img => img.url && img.url.trim() !== '');

      const payload = {
        id: form.id ? form.id.trim() : '', 
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        price: Number(form.price) || 0,
        costPrice: Number(form.costPrice) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
        isActive: !!form.isActive,
        sizes: form.sizes || null,
        colors: form.colors || null,
        brand: form.brand || null,
        description: form.description || null,
        material: form.material || null,
        // Gửi danh sách ảnh kèm màu: [{url, color}, ...]
        images: validImages 
      };

      let res;
      if (initialData && initialData.id) {
        res = await updateProduct(initialData.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res && res.message) alert(res.message);

      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  let modalTitle = 'Thêm sản phẩm mới';
  if (initialData) modalTitle = viewOnly ? 'Chi tiết sản phẩm' : 'Chỉnh sửa sản phẩm';

  // Kiểm tra xem có nhập variants không
  const hasVariants = (form.sizes && form.sizes.trim().length > 0) || (form.colors && form.colors.trim().length > 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-2xl overflow-y-auto max-h-[95vh] flex flex-col relative">
        {/* Header (Sticky Top) */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
            <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-1 pb-4">
          {/* Hàng 1: Mã - Tên */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Mã SP (Tự động)</label>
              <input value={form.id} readOnly={!!initialData || viewOnly} onChange={e=>setForm({...form, id: e.target.value})} placeholder="(Tự động)" className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-blue-500 placeholder-gray-400 ${viewOnly || initialData ? 'cursor-not-allowed text-gray-500' : ''}`} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Tên sản phẩm <span className="text-red-500">*</span></label>
              <input required value={form.name} readOnly={viewOnly} onChange={e=>setForm({...form, name: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* Hàng 2: Danh mục - Thương hiệu - Chất liệu */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Danh mục <span className="text-red-500">*</span></label>
              <select value={form.categoryId} disabled={viewOnly} onChange={e=>setForm({...form, categoryId: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-white ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                <option value="">-- Chọn --</option>
                {categories.map(c=> (<option key={c.category_id} value={c.category_id}>{c.category_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Thương hiệu</label>
              <input value={form.brand} readOnly={viewOnly} onChange={e=>setForm({...form, brand: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Chất liệu</label>
              <input value={form.material} readOnly={viewOnly} onChange={e=>setForm({...form, material: e.target.value})} placeholder="VD: Cotton, Da..." className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* Hàng 3: Giá bán - Giá vốn */}
          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Giá bán <span className="text-red-500">*</span></label>
                <input type="number" value={form.price} readOnly={viewOnly} onChange={e=>setForm({...form, price: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Giá vốn <span className="text-red-500">*</span></label>
                <input type="number" value={form.costPrice} readOnly={viewOnly} onChange={e=>setForm({...form, costPrice: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* --- PHẦN 1: NHẬP BIẾN THỂ (MÀU/SIZE) - ĐƯA LÊN TRÊN ĐỂ CÓ DỮ LIỆU MÀU CHO PHẦN ẢNH --- */}
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                1. Định nghĩa Biến thể (Màu/Size)
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Màu sắc (Color)</label>
                    <input 
                        placeholder="VD: Đỏ, Xanh, Trắng" 
                        value={form.colors} 
                        // QUAN TRỌNG: Chỉ readOnly khi viewOnly, cho phép sửa khi Edit
                        readOnly={viewOnly} 
                        onChange={e=>setForm({...form, colors: e.target.value})} 
                        className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium ${viewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    />
                    <p className="text-[10px] text-gray-500 mt-1 italic">* Nhập các màu (phân cách bằng dấu phẩy) để chọn cho ảnh bên dưới.</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Kích cỡ (Size)</label>
                    <input 
                        placeholder="VD: S, M, L" 
                        value={form.sizes} 
                        readOnly={viewOnly} 
                        onChange={e=>setForm({...form, sizes: e.target.value})} 
                        className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${viewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    />
                </div>
            </div>
            
            {(!initialData && !hasVariants) && (
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Tồn kho ban đầu (Sản phẩm đơn)</label>
                    <input type="number" min="0" value={form.stockQuantity} onChange={e=>setForm({...form, stockQuantity: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
            )}
          </div>


          {/* --- PHẦN 2: NHẬP ẢNH THEO MÀU (GIAO DIỆN MỚI) --- */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800">2. Hình ảnh theo Màu sắc</h3>
                {!viewOnly && (
                    <button type="button" onClick={handleAddImageRow} className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-2 py-1.5 rounded hover:bg-gray-100 text-blue-600 font-medium transition-colors shadow-sm">
                        <Plus className="w-3 h-3"/> Thêm dòng ảnh
                    </button>
                )}
             </div>
             
             <div className="space-y-2">
                 {form.imageList.map((imgItem, index) => (
                     <div key={index} className="flex items-start gap-2 bg-white p-2 rounded border border-gray-200 shadow-sm animate-fadeIn">
                         {/* Ô nhập URL */}
                         <div className="flex-grow relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                <LinkIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            </div>
                            <input 
                                type="text"
                                value={imgItem.url}
                                readOnly={viewOnly}
                                onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                placeholder="Dán link ảnh (https://...)"
                                className={`block w-full rounded-md border-gray-300 pl-8 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            />
                         </div>
                         
                         {/* Dropdown chọn Màu */}
                         <div className="w-32 flex-shrink-0">
                             <select 
                                value={imgItem.color}
                                disabled={viewOnly}
                                onChange={(e) => handleImageChange(index, 'color', e.target.value)}
                                className={`block w-full rounded-md border-gray-300 py-1.5 pl-2 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-gray-50'}`}
                                title="Chọn màu sắc tương ứng với ảnh"
                             >
                                 {availableColors.map((color, idx) => (
                                     <option key={idx} value={color}>{color}</option>
                                 ))}
                             </select>
                         </div>

                         {/* Preview Ảnh nhỏ */}
                         <div className="w-9 h-9 flex-shrink-0 border rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                            {imgItem.url ? (
                                <img src={imgItem.url} alt="Img" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                            ) : <span className="text-[9px] text-gray-400">Ảnh</span>}
                         </div>

                         {/* Nút xóa dòng */}
                         {!viewOnly && (
                            <button type="button" onClick={() => handleRemoveImageRow(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa dòng này">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                         )}
                     </div>
                 ))}
                 {form.imageList.length === 0 && (
                     <div className="text-center py-4 bg-white border border-dashed rounded text-gray-400 text-sm italic">
                         {viewOnly ? "Chưa có hình ảnh nào." : "Chưa có ảnh. Nhấn 'Thêm dòng ảnh' để bắt đầu."}
                     </div>
                 )}
             </div>
          </div>


          {/* Hàng: Mô tả */}
          <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Mô tả chi tiết</label>
              <textarea rows={3} value={form.description} readOnly={viewOnly} onChange={e=>setForm({...form, description: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
          </div>

          {/* Bảng chi tiết tồn kho (nếu có) */}
          {initialData && variants.length > 0 && (
              <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Chi tiết tồn kho hiện tại</h3>
                  {fetchingDetails ? (
                      <p className="text-xs text-blue-500 animate-pulse">Đang tải...</p>
                  ) : (
                    <div className="overflow-x-auto border rounded bg-white max-h-40 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Màu</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Size</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-500">Tồn kho</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {variants.map((v) => (
                                    <tr key={v.variant_id}>
                                        <td className="px-3 py-2 text-gray-900">{v.color}</td>
                                        <td className="px-3 py-2 text-gray-900">{v.size}</td>
                                        <td className="px-3 py-2 text-right font-bold text-blue-600">{v.stock_quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  )}
              </div>
          )}

          {/* Footer: Trạng thái & Nút Lưu - Sticky Bottom */}
          <div className="flex items-center justify-between pt-4 border-t mt-4 sticky bottom-0 bg-white pb-2 z-10">
            <label className="inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" checked={form.isActive} disabled={viewOnly} onChange={e=>setForm({...form, isActive: e.target.checked})} className="form-checkbox h-5 w-5 text-blue-600 rounded cursor-pointer"/>
              <span className={`ml-2 text-sm font-medium ${form.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {form.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
              </span>
            </label>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Đóng</button>
                {!viewOnly && (
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50 flex items-center gap-2 transition-all">
                        {loading && <span className="animate-spin">⌛</span>}
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;