import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Trash, X } from "lucide-react";
import { getOrderById, updateOrder, getEmployees } from "../services/api";

export const OrderEditScreen = ({ orderId, currentUser, setPath }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    // Form state
    const [deliveryStaffId, setDeliveryStaffId] = useState(null);
    const [deliveryStaffSearch, setDeliveryStaffSearch] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
    const [orderStatus, setOrderStatus] = useState("Đang Xử Lý");
    const [paymentStatus, setPaymentStatus] = useState("Chưa Thanh Toán");
    const [items, setItems] = useState([]);
    const [shippingCost, setShippingCost] = useState(0);
    
    const [employees, setEmployees] = useState([]);

    const ORDER_STATUSES = ["Đang Xử Lý", "Đang Giao", "Hoàn Thành", "Đã Hủy"];
    const PAYMENT_STATUSES = ["Chưa Thanh Toán", "Đã Thanh Toán", "Đã Hoàn Tiền"];

    // Filter ship employees
    const shipEmployees = useMemo(() => {
        return employees.filter(emp => emp.user_id && emp.user_id.startsWith('SHIP'));
    }, [employees]);

    const filteredShipEmployees = useMemo(() => {
        if (!deliveryStaffSearch) return shipEmployees;
        const search = deliveryStaffSearch.toLowerCase();
        return shipEmployees.filter(emp =>
            (emp.user_id && emp.user_id.toLowerCase().includes(search)) ||
            (emp.full_name && emp.full_name.toLowerCase().includes(search))
        );
    }, [shipEmployees, deliveryStaffSearch]);

    // Calculate totals
    const totalItems = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price_at_order), 0);
    }, [items]);

    const finalTotal = totalItems + shippingCost;

    // Load order data
    useEffect(() => {
        const loadOrder = async () => {
            setLoading(true);
            try {
                const data = await getOrderById(orderId);
                setOrder(data);
                setDeliveryStaffId(data.delivery_staff_id || null);
                setPaymentMethod(data.paymentMethod || "Tiền mặt");
                setOrderStatus(data.status || "Đang Xử Lý");
                setPaymentStatus(data.paymentStatus || "Chưa Thanh Toán");
                setItems(data.items || []);
                setShippingCost(data.shippingCost || 0);
            } catch (err) {
                console.error("Error loading order:", err);
                setError("Lỗi tải chi tiết đơn hàng: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        const loadEmployees = async () => {
            try {
                const emps = await getEmployees();
                setEmployees(emps || []);
            } catch (err) {
                console.error("Error loading employees:", err);
            }
        };

        loadOrder();
        loadEmployees();
    }, [orderId]);

    const updateItemQuantity = (index, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity) || 1);
        const newItems = [...items];
        newItems[index].quantity = quantity;
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveChanges = async () => {
        if (items.length === 0) {
            return setError("Đơn hàng phải có ít nhất 1 sản phẩm.");
        }

        setSaving(true);
        setError(null);

        const payload = {
            deliveryStaffId: deliveryStaffId || null,
            paymentMethod: paymentMethod,
            status: orderStatus,
            paymentStatus: paymentStatus,
            items: items.map(item => ({
                variantId: item.variant_id,
                quantity: item.quantity,
                priceAtOrder: item.price_at_order
            })),
            subtotal: totalItems,
            shippingCost: shippingCost,
            finalTotal: finalTotal
        };

        try {
            console.log("[DEBUG] Sending updateOrder payload:", payload);
            await updateOrder(orderId, payload);
            alert("Cập nhật đơn hàng thành công!");
            if (typeof setPath === "function") {
                setPath("/orders");
            }
        } catch (err) {
            console.error("[ERROR] Error updating order:", err);
            setError("Lỗi cập nhật đơn hàng: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-6 text-center text-xl">Đang tải dữ liệu đơn hàng...</p>;
    }

    if (!order) {
        return (
            <div className="p-6">
                <p className="text-red-600 text-lg">{error || "Không tìm thấy đơn hàng."}</p>
                <button
                    onClick={() => setPath("/orders")}
                    className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
                >
                    ← Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold">Chỉnh sửa Đơn hàng</h1>
                    <p className="text-sm text-gray-600 mt-1">Mã đơn: <span className="font-semibold">{orderId}</span></p>
                </div>
                <button
                    onClick={() => setPath("/orders")}
                    className="flex items-center gap-2 text-gray-700 hover:text-black text-sm"
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg font-medium">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CỘT TRÁI: THÔNG TIN ĐƠN HÀNG */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-3 border-b pb-2">Thông tin chung</h3>

                        {/* Kênh bán */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kênh bán:</label>
                            <p className="text-base text-gray-900">{order.orderChannel}</p>
                        </div>

                        {/* Khách hàng */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Khách hàng:</label>
                            <p className="text-base text-gray-900">
                                {order.customerName || `SĐT: ${order.customerPhone || 'Khách lẻ'}`}
                            </p>
                        </div>

                        {/* Nhân viên tạo đơn */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nhân viên tạo đơn:</label>
                            <p className="text-base text-gray-900">{order.employeeName || order.employeeId}</p>
                        </div>

                        {/* Trạng thái đơn */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái đơn hàng:</label>
                            <select
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {ORDER_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Trạng thái thanh toán */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái thanh toán:</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                {PAYMENT_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phương thức thanh toán */}
                        <div className="mb-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phương thức thanh toán:</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm"
                            >
                                <option value="Tiền mặt">Tiền mặt</option>
                                <option value="Chuyển khoản">Chuyển khoản</option>
                                <option value="Thẻ tín dụng">Thẻ tín dụng</option>
                            </select>
                        </div>
                    </div>

                    {/* Nhân viên giao hàng */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-3 border-b pb-2">Giao hàng</h3>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nhân viên giao hàng:</label>
                        <input
                            type="text"
                            placeholder="Tìm nhân viên giao hàng..."
                            value={deliveryStaffSearch}
                            onChange={(e) => setDeliveryStaffSearch(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm mb-2"
                        />
                        <select
                            value={deliveryStaffId || ''}
                            onChange={(e) => setDeliveryStaffId(e.target.value || null)}
                            className="w-full p-2 border rounded-lg text-sm"
                        >
                            <option value="">-- Chọn nhân viên giao hàng --</option>
                            {filteredShipEmployees.map(emp => (
                                <option key={emp.user_id} value={emp.user_id}>
                                    {emp.user_id} - {emp.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* CỘT PHẢI: GIỎ HÀNG VÀ THANH TOÁN */}
                <div className="space-y-4">
                    {/* Giỏ hàng */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-3 border-b pb-2">Sản phẩm ({items.length})</h3>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {items.length === 0 ? (
                                <p className="text-center text-gray-500">Không có sản phẩm.</p>
                            ) : (
                                items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center p-2 border-b bg-gray-50 rounded-md"
                                    >
                                        <div className="flex-1 text-sm">
                                            <p className="font-bold">{item.product_name}</p>
                                            <p className="text-xs text-gray-600">{item.color}/{item.size}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mx-4">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                                className="border p-1 rounded w-14 text-center text-sm"
                                            />
                                            <span className="text-gray-700 text-sm">x {item.price_at_order.toLocaleString()} đ</span>
                                        </div>

                                        <div className="font-bold text-right w-24 text-red-600 text-sm">
                                            {(item.quantity * item.price_at_order).toLocaleString()} đ
                                        </div>

                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-red-600 hover:text-red-800 p-1 ml-2"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tóm tắt thanh toán */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-3 border-b pb-2">Thanh toán</h3>
                        
                        <div className="flex justify-between mb-2">
                            <p>Tổng tiền hàng:</p>
                            <p className="font-bold">{totalItems.toLocaleString()} đ</p>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                            <p className="font-medium text-sm">Phí giao hàng:</p>
                            <input
                                type="number"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                                className="w-24 p-1 border rounded-lg text-right text-sm"
                            />
                        </div>

                        <div className="border-t-2 pt-2 flex justify-between mb-4">
                            <p className="text-lg font-bold">TỔNG CỘNG:</p>
                            <p className="text-lg font-bold text-red-600">{finalTotal.toLocaleString()} đ</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPath("/orders")}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};