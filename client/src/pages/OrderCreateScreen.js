import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash, ArrowLeft, X, Search } from "lucide-react";
// Giả định bạn đã import các hàm API cần thiết:
import { createOrder, findCustomerByPhone, getProducts, getCategories, getEmployees } from "../services/api"; 

// ============================================================
// COMPONENT CHÍNH: OrderCreateScreen (Cấu trúc POS 2 Cột)
// ============================================================
export const OrderCreateScreen = ({ currentUser, setPath }) => {
    // STATE CHO POS
    const [salesChannel, setSalesChannel] = useState("Trực tiếp"); 
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerInfo, setCustomerInfo] = useState(null); // NULL nghĩa là Khách lẻ

    const [items, setItems] = useState([]);
    
    // TÍNH TIỀN
    const [shippingOption, setShippingOption] = useState("auto");
    const [manualShippingFee, setManualShippingFee] = useState(0); 
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt"); 

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Employee code (creator) - allow override if currentUser missing or for manual entry
    const [employeeCode, setEmployeeCode] = useState(currentUser?.user_id || '');
    
    // STATE CHO CỘT CHỌN SẢN PHẨM
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    // Employees for delivery selection
    const [employees, setEmployees] = useState([]);
    const [deliveryStaffId, setDeliveryStaffId] = useState(null);
    // Vấn đề 1: State tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [deliveryStaffSearch, setDeliveryStaffSearch] = useState('');

    // Filter employees by role
    const saleEmployees = useMemo(() => {
        return employees.filter(emp => emp.user_id && emp.user_id.startsWith('SALE'));
    }, [employees]);

    const shipEmployees = useMemo(() => {
        return employees.filter(emp => emp.user_id && emp.user_id.startsWith('SHIP'));
    }, [employees]);

    // Filter ship employees by search term
    const filteredShipEmployees = useMemo(() => {
        if (!deliveryStaffSearch) return shipEmployees;
        const search = deliveryStaffSearch.toLowerCase();
        return shipEmployees.filter(emp =>
            (emp.user_id && emp.user_id.toLowerCase().includes(search)) ||
            (emp.full_name && emp.full_name.toLowerCase().includes(search))
        );
    }, [shipEmployees, deliveryStaffSearch]);

    // ============================================================
    // LOGIC TẢI DỮ LIỆU SẢN PHẨM VÀ DANH MỤC (ĐÃ SỬA LỖI TÌM KIẾM)
    // ============================================================
    const fetchCategoriesAndProducts = async () => {
        setLoadingProducts(true);
        try {
            // 1. Tải danh mục (Nếu cần, để đổ dữ liệu vào ô filter Category)
            // Giả định getCategories trả về [ { category_id: 1, category_name: '...' }, ... ]
            const catData = await getCategories();
            setCategories(catData);

            // 2. Tải sản phẩm: Dùng API getProducts và truyền cả category và search term
            // Vấn đề 2: Giả định API getProducts(category, search) đã được Backend sửa để trả về 
            //           danh sách products, mỗi product có mảng 'variants'.
            const productData = await getProducts(selectedCategory, searchTerm); 
            setProducts(productData);

        } catch (err) {
            console.error("Lỗi tải dữ liệu sản phẩm/danh mục:", err);
            setError("Lỗi tải danh sách sản phẩm.");
        } finally {
            setLoadingProducts(false);
        }
    };

    // Vấn đề 3: Gọi lại API khi Category hoặc Search Term thay đổi
    useEffect(() => {
        // Debounce search input (tối ưu hóa, nên có)
        const delaySearch = setTimeout(() => {
            fetchCategoriesAndProducts();
        }, 300); // Đợi 300ms sau khi dừng gõ

        return () => clearTimeout(delaySearch);
    }, [selectedCategory, searchTerm]); 

    // Load employees for delivery selection
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const emps = await getEmployees();
                if (!mounted) return;
                setEmployees(emps || []);
            } catch (err) {
                console.error('Lỗi tải danh sách nhân viên:', err);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);
    
    // ============================================================
    // LOGIC TÌM KHÁCH HÀNG (Giữ nguyên)
    // ============================================================
    const findCustomer = async () => {
        // ... (Logic tìm kiếm khách hàng giữ nguyên)
        setError(null);
        if (!customerPhone) return alert("Vui lòng nhập SĐT khách hàng.");
        try {
            // Giả định findCustomerByPhone gọi /api/customers/phone/:phone
            const res = await findCustomerByPhone(customerPhone);
            const data = res.customer || res; 
            
            if (!data || !data.customer_id) {
                 alert("Không tìm thấy khách hàng. Đơn hàng sẽ được ghi nhận là Khách lẻ.");
                 setCustomerInfo(null);
                 return;
            }

            setCustomerInfo({
                customer_id: data.customer_id,
                fullName: data.full_name,
                phone: data.phone,
                address: data.address
            });
        } catch (err) {
            alert("Lỗi tìm kiếm khách hàng. Đơn hàng sẽ được ghi nhận là Khách lẻ.");
            setCustomerInfo(null);
            console.error(err);
        }
    };
    
    const removeCustomer = () => {
        setCustomerPhone('');
        setCustomerInfo(null);
        setError(null);
    }

    // ============================================================
    // LOGIC THÊM SẢN PHẨM VÀO GIỎ HÀNG (QUAN TRỌNG)
    // ============================================================
    
    const handleVariantSelect = (variantData) => {
        const quantity = 1; 
        const finalPrice = variantData.price; 

        const existingItemIndex = items.findIndex(item => item.variantId === variantData.variant_id);

        if (existingItemIndex > -1) {
            const newItems = [...items];
            const itemInCart = newItems[existingItemIndex];
            const newQuantity = itemInCart.quantity + quantity;
            
            if (newQuantity > variantData.stock_quantity) {
                 return setError(`Tổng số lượng vượt quá tồn kho (${variantData.stock_quantity})!`);
            }

            itemInCart.quantity = newQuantity;
            itemInCart.itemTotal = itemInCart.price * newQuantity;
            setItems(newItems);
        } else {
            const newItem = {
                variantId: variantData.variant_id, 
                name: variantData.product_name,
                price: finalPrice, 
                quantity,
                itemTotal: finalPrice * quantity,
                color: variantData.color,
                size: variantData.size,
                stock_quantity: variantData.stock_quantity,
            };
            setItems([...items, newItem]);
        }
        setError(null);
    };
    
    const updateItemQuantity = (index, newQuantity) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        
        const quantity = Number(newQuantity);

        if (quantity <= 0) {
            return removeItem(index);
        }
        
        if (quantity > item.stock_quantity) {
            return setError(`Số lượng mới (${quantity}) vượt quá tồn kho (${item.stock_quantity})!`);
        }
        
        item.quantity = quantity;
        item.itemTotal = item.price * quantity;
        setItems(updatedItems);
        setError(null);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // ============================================================
    // LOGIC TÍNH TIỀN VÀ TẠO ĐƠN (Giữ nguyên)
    // ============================================================
    const totalItems = items.reduce((sum, it) => sum + it.itemTotal, 0);

    let shippingFee = 0;
    const isOnlineChannel = salesChannel === 'Online';

    if (isOnlineChannel) {
        if (shippingOption === "auto") {
            shippingFee = totalItems < 100000 ? 10000 : 0; 
        } else if (shippingOption === "manual") {
            shippingFee = Number(manualShippingFee || 0); 
        }
    } 

    const finalTotal = totalItems + shippingFee;

    const handleCreateOrder = async () => {
        if (items.length === 0) return setError("Chưa thêm sản phẩm.");

        setLoading(true);
        setError(null);
        
    // Use selected/entered employeeCode, or fallback to currentUser.user_id
    const employeeId = (employeeCode && employeeCode.trim()) ? employeeCode.trim() : currentUser?.user_id; 
    if (!employeeId) { 
        setLoading(false); 
        return setError("Lỗi: Vui lòng chọn hoặc nhập mã nhân viên. Các mã nhân viên hợp lệ: OS01, SALE1, SALE2, SHIP01, WH01, v.v."); 
    }
        
        if (isOnlineChannel && !customerInfo) {
             setLoading(false);
             return setError("Đơn hàng Online cần phải có thông tin khách hàng (SĐT) để giao hàng.");
        }

        const payload = {
            customerId: customerInfo?.customer_id || null,
            customerPhone: customerInfo?.phone || customerPhone,
            employeeId: employeeId,
            deliveryStaffId: deliveryStaffId || null,
            orderChannel: salesChannel,
            directDelivery: salesChannel === 'Trực tiếp', 
            
            items: items.map((p) => ({
                variantId: p.variantId,
                quantity: p.quantity,
                priceAtOrder: p.price, 
            })),
            
            subtotal: totalItems,
            shippingCost: shippingFee, 
            finalTotal: finalTotal,
            paymentMethod: paymentMethod, 
        };

        try {
            console.log('[DEBUG] Sending createOrder payload:', JSON.stringify(payload, null, 2));
            
            let res;
            try {
                res = await createOrder(payload);
                console.log('[DEBUG] createOrder returned:', res);
            } catch (apiErr) {
                console.error('[DEBUG] createOrder threw error:', apiErr);
                // If API throws, treat it as an error
                const errorMsg = apiErr?.message || JSON.stringify(apiErr) || 'Lỗi từ server (không xác định)';
                setError(`Lỗi tạo đơn hàng: ${errorMsg}`);
                setLoading(false);
                return;
            }
            
            console.log('[DEBUG] Checking response validity...');
            console.log('[DEBUG] res type:', typeof res);
            console.log('[DEBUG] res value:', res);
            
            // Handle case where response might be the Axios response object instead of just data
            if (res && res.data && typeof res.data === 'object' && res.data.orderId) {
                console.log('[DEBUG] Response appears to be Axios response object, extracting data');
                res = res.data;
            }
            
            // Check if response is valid
            if (!res || typeof res !== 'object') {
                console.error('[ERROR] Response is invalid:', res);
                setError(`Lỗi: Server trả về dữ liệu không hợp lệ. Dữ liệu: ${JSON.stringify(res)}`);
                setLoading(false);
                return;
            }
            
            // Safely extract orderId from response
            const orderId = res.orderId || res.id;
            
            if (!orderId) {
                console.error('[ERROR] Response missing orderId. Full response:', JSON.stringify(res, null, 2));
                setError(`Lỗi: Server không trả về mã đơn hàng. Chi tiết: ${JSON.stringify(res)}`);
                setLoading(false);
                return;
            }

            console.log('[DEBUG] Order created successfully with ID:', orderId);
            alert("Tạo đơn hàng thành công! Mã đơn: " + orderId);
            if (typeof setPath === 'function') {
                setPath("/orders");
            }

        } catch (err) {
            console.error('[ERROR] Unexpected exception in createOrder:', err);
            const errorMsg = err?.message || JSON.stringify(err) || "Lỗi kết nối server.";
            setError(`Lỗi không mong muốn: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // =============================
    // UI CHÍNH - Cấu trúc 2 cột
    // =============================
    return (
        <div className="flex min-h-[90vh]">
            
            {/* CỘT TRÁI: GIỎ HÀNG & THANH TOÁN (Khoảng 60% - Fixed Width) */}
            <div className="w-[500px] flex-shrink-0 space-y-4 p-4 md:p-6 bg-white shadow-xl border-r">
                
                <div className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-3xl font-bold text-blue-700 leading-relaxed">Tạo Đơn Hàng (POS)</h1>
                    <button
                        onClick={() => { if (typeof setPath === 'function') { setPath("/orders"); } }}
                        className="flex items-center gap-2 text-gray-700 hover:text-black text-sm"
                    >
                        <ArrowLeft size={20} /> Quay lại
                    </button>
                </div>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg font-medium">{error}</div>}

                {/* 1. THÔNG TIN ĐƠN HÀNG/KHÁCH HÀNG */}
                <div className="grid grid-cols-2 gap-4">
                    {/* KÊNH BÁN */}
                    <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="font-semibold mb-1 text-sm">Kênh Bán:</p>
                        <select
                            value={salesChannel}
                            onChange={(e) => setSalesChannel(e.target.value)}
                            className="p-1 border rounded-md w-full text-sm"
                        >
                            <option value="Trực tiếp">Trực tiếp</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>

                    {/* KHÁCH HÀNG */}
                    <div className="p-3 border rounded-lg">
                        <div className="mb-2">
                            <p className="font-semibold mb-1 text-sm">Mã nhân viên tạo đơn:</p>
                            {saleEmployees.length > 0 ? (
                                <select
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    className="border p-1 rounded-lg w-full text-sm mb-2 bg-white"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {saleEmployees.map((emp) => (
                                        <option key={emp.user_id} value={emp.user_id}>
                                            {emp.user_id} - {emp.full_name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Nhập mã nhân viên SALE"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    className="border p-1 rounded-lg w-full text-sm mb-2"
                                />
                            )}
                        </div>
                        <p className="font-semibold mb-1 text-sm">Khách hàng:</p>
                        {customerInfo ? (
                            <div className="bg-green-50 p-2 rounded-md flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium">{customerInfo.fullName || 'Khách hàng'}</p>
                                    <p className="text-xs text-gray-600">{customerInfo.phone}</p>
                                </div>
                                <X size={16} className="cursor-pointer text-red-500" onClick={removeCustomer} />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="SĐT (Bỏ trống = Khách lẻ)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="border p-1 rounded-lg flex-grow text-sm"
                                />
                                <button onClick={findCustomer} className="bg-blue-500 text-white px-3 rounded-lg text-sm">Tìm</button>
                            </div>
                        )}
                        {salesChannel === 'Online' && !customerInfo && <p className="text-xs text-red-500 mt-1">⚠️ Cần SĐT nếu là đơn Online!</p>}
                    </div>
                </div>

                {/* 2. GIỎ HÀNG (ITEMS LIST) */}
                <div className="bg-white p-4 rounded-xl shadow-md border">
                    <h2 className="font-semibold text-xl mb-3 border-b pb-2">Giỏ hàng ({items.length})</h2>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {items.length === 0 && <p className="text-center text-gray-500">Vui lòng chọn sản phẩm từ danh sách.</p>}

                        {items.map((it, index) => (
                            <div
                                key={it.variantId}
                                className="flex justify-between items-center p-2 border-b bg-gray-50 rounded-md"
                            >
                                <div className="flex-1 text-sm">
                                    <p className="font-bold text-sm leading-relaxed">{it.name}</p>
                                    <p className="text-xs text-gray-600 leading-relaxed">{it.color}/{it.size}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 mx-4">
                                    <input
                                        type="number"
                                        min="1"
                                        value={it.quantity}
                                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                                        className="border p-1 rounded w-14 text-center text-sm"
                                    />
                                    <span className="text-gray-700 text-sm"> x {it.price.toLocaleString()} đ</span>
                                </div>

                                <div className="font-bold text-right w-24 text-red-600 text-sm">
                                    {it.itemTotal.toLocaleString()} đ
                                </div>

                                <button
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800 p-1 ml-2"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. TÓM TẮT & THANH TOÁN */}
                <div className="pt-2">
                    <h2 className="font-semibold text-xl mb-3">Thanh toán</h2>
                    
                    <div className="flex justify-between border-t pt-2">
                        <p>Tổng tiền hàng:</p>
                        <p><b>{totalItems.toLocaleString()} đ</b></p>
                    </div>
                    
                    {/* PHÍ VẬN CHUYỂN LOGIC (Giữ nguyên) */}
                    {isOnlineChannel && (
                         <div className="mt-2">
                             <div className="flex justify-between items-center">
                                 <p className="font-medium text-sm">Phí giao hàng:</p>
                                 <div className="flex flex-col items-end gap-1">
                                     <select
                                         value={shippingOption}
                                         onChange={(e) => setShippingOption(e.target.value)}
                                         className="p-1 border rounded-lg text-sm w-40"
                                     >
                                         <option value="auto">Tự động</option>
                                         <option value="manual">Nhập thủ công</option>
                                     </select>
                                     {shippingOption === "manual" ? (
                                         <input
                                             type="number"
                                             value={manualShippingFee}
                                             onChange={(e) => setManualShippingFee(e.target.value)}
                                             className="border p-1 w-24 rounded-lg text-right text-sm"
                                             placeholder="Phí ship"
                                         />
                                     ) : (
                                         <p className="text-sm">{shippingFee.toLocaleString()} đ</p>
                                     )}
                                 </div>
                             </div>

                             {/* Chọn nhân viên giao hàng */}
                             <div className="mt-2">
                                 <p className="font-medium text-sm">Nhân viên giao hàng:</p>
                                 <input
                                     type="text"
                                     placeholder="Tìm nhân viên giao hàng..."
                                     value={deliveryStaffSearch}
                                     onChange={(e) => setDeliveryStaffSearch(e.target.value)}
                                     className="p-1 border rounded-lg w-full text-sm mb-2"
                                 />
                                 <select
                                     value={deliveryStaffId || ''}
                                     onChange={(e) => setDeliveryStaffId(e.target.value || null)}
                                     className="p-1 border rounded-lg w-full"
                                 >
                                     <option value="">-- Chọn nhân viên giao hàng --</option>
                                     {filteredShipEmployees.map(emp => (
                                         <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                                             {emp.user_id} - {emp.full_name || emp.fullName || emp.username}
                                         </option>
                                     ))}
                                 </select>
                             </div>
                         </div>
                    )}
                    
                    
                    
                    {/* PHƯƠNG THỨC THANH TOÁN */}
                    <div className="mt-2 flex justify-between items-center">
                        <p className="font-medium">P.Thức TToán:</p>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="p-1 border rounded-lg w-40"
                        >
                            <option value="Tiền mặt">Tiền mặt</option>
                            <option value="Chuyển khoản">Chuyển khoản</option>
                            <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                        </select>
                    </div>

                    <h2 className="text-2xl font-bold mt-4 pt-3 border-t-2 border-black text-red-600">
                        TỔNG THANH TOÁN: {finalTotal.toLocaleString()} đ
                    </h2>
                </div>

                {/* NÚT TẠO ĐƠN */}
                <button
                    onClick={handleCreateOrder}
                    disabled={loading || items.length === 0 || (isOnlineChannel && !customerInfo)}
                    className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-bold disabled:opacity-50 hover:bg-green-700 mt-4"
                >
                    {loading ? "Đang tạo..." : "HOÀN THÀNH ĐƠN HÀNG"}
                </button>
            </div>
            
            {/* CỘT PHẢI: CHỌN SẢN PHẨM (Mở rộng hết phần còn lại) */}
            <div className="flex-1 p-4 bg-gray-50 h-full overflow-y-auto">
                <h3 className="font-bold text-xl mb-3">Chọn Sản phẩm</h3>
                
                {/* Thanh tìm kiếm và lọc */}
                <div className="flex gap-2 mb-3 sticky top-0 bg-gray-50 z-10 py-2 border-b border-gray-300">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm theo tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-lg"
                        />
                    </div>
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="p-2 border rounded-lg w-40"
                    >
                        <option value="all">-- Tất cả Danh mục --</option>
                        {/* Lỗi logic: Cần đảm bảo categories đã được load */}
                        {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                        ))}
                    </select>
                </div>

                {loadingProducts ? (
                    <p className="text-center text-sm">Đang tải sản phẩm...</p>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map(product => (
                            // Vấn đề 4: Product Card
                            <div key={product.product_id} className="bg-white p-3 rounded-lg shadow border hover:shadow-lg transition">
                                <p className="font-semibold text-md mb-1">{product.name}</p>
                                
                                {/* Hiển thị các biến thể để người dùng chọn */}
                                {/* Vấn đề 5: Đảm bảo product.variants là mảng chứa các biến thể */}
                                {product.variants && product.variants.map(variant => (
                                    <div 
                                        key={variant.variant_id} 
                                        className={`mt-1 p-2 text-sm rounded-md cursor-pointer flex justify-between 
                                                    ${variant.stock_quantity > 0 ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-red-50 opacity-60'}`}
                                        onClick={() => {
                                            if (variant.stock_quantity > 0) {
                                                handleVariantSelect({
                                                    ...variant,
                                                    product_name: product.name,
                                                    // Giả định giá đã được tính toán (base_price + additional_price)
                                                    price: parseFloat(product.base_price) + parseFloat(variant.additional_price || 0),
                                                    stock_quantity: variant.stock_quantity // Quan trọng
                                                });
                                            } else {
                                                alert(`Biến thể ${variant.variant_id} đã hết hàng.`);
                                            }
                                        }}
                                    >
                                        <span className="font-medium">{variant.color} / {variant.size}</span>
                                        <span className="text-red-600 font-bold">{Number(parseFloat(product.base_price) + parseFloat(variant.additional_price || 0)).toLocaleString()} đ</span>
                                    </div>
                                ))}
                                {(!product.variants || product.variants.length === 0) && <p className="text-xs text-red-500">Không có biến thể.</p>}
                            </div>
                        ))}
                        {products.length === 0 && <p className="col-span-full text-center text-gray-500">Không tìm thấy sản phẩm nào.</p>}
                    </div>
                )}
            </div>

        </div>
    );
};