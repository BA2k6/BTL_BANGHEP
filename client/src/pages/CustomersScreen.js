import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Eye, UserPlus, X, Save } from 'lucide-react';
import { getCustomers } from '../services/api'; 
import { ROLES } from '../utils/constants';
import { normalizeSearchableValue } from '../utils/helpers';

// [QUAN TRỌNG] Đã sửa về Port 5001 cho đúng với Server của bạn
const API_BASE_URL = "http://localhost:5001/api/customers";

export const CustomersScreen = ({ userRoleName }) => {
    // --- STATE DANH SÁCH KHÁCH HÀNG ---
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE CHO MODAL XEM LỊCH SỬ ---
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // --- STATE CHO MODAL SỬA ---
    const [editCustomer, setEditCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- STATE CHO MODAL THÊM MỚI ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Mặc định createAccount là true (Bắt buộc tạo tài khoản)
    const [newCustomer, setNewCustomer] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        dob: '',
        createAccount: true, 
        username: '',
        password: ''
    });

    // Quyền hạn
    const canEdit = [
        ROLES.OWNER.name,
        ROLES.SALES.name,
        ROLES.ONLINE_SALES.name
    ].includes(userRoleName);

    // 1. LẤY DANH SÁCH KHÁCH HÀNG
    const fetchCustomers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu khách hàng từ máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // 2. XỬ LÝ THÊM KHÁCH HÀNG
    const handleAddClick = () => {
        setNewCustomer({
            fullName: '',
            phone: '',
            email: '',
            address: '',
            dob: '',
            createAccount: true, // Luôn true
            username: '',
            password: ''
        });
        setShowAddModal(true);
    };

    // Tự động điền username bằng số điện thoại
    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        // Chỉ cho nhập số
        if (!/^\d*$/.test(phone)) return;

        setNewCustomer(prev => ({
            ...prev,
            phone: phone,
            username: phone // Tự động set username = phone luôn
        }));
    };

    const createCustomer = async () => {
        // 1. Kiểm tra rỗng
        if (!newCustomer.fullName || !newCustomer.phone) {
            alert("Vui lòng nhập Tên và Số điện thoại");
            return;
        }

        // [MỚI] 2. Validate định dạng Số điện thoại
        // Regex: Bắt đầu bằng 0, theo sau là 9 chữ số (Tổng 10 số)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(newCustomer.phone)) {
            alert("Số điện thoại không hợp lệ!\n\nYêu cầu:\n- Phải bắt đầu bằng số 0\n- Phải có đúng 10 chữ số");
            return;
        }
        
        // 3. Validate bắt buộc Username/Password
        if (!newCustomer.username || !newCustomer.password) {
            alert("Vui lòng nhập Mật khẩu (Tên đăng nhập tự động lấy theo SĐT)");
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCustomer)
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Lỗi tạo khách hàng");
                return;
            }

            alert("Thêm khách hàng và tài khoản thành công!");
            setShowAddModal(false);
            fetchCustomers();
        } catch (error) {
            console.error(error);
            alert("Không thể kết nối đến server.");
        } finally {
            setIsCreating(false);
        }
    };

    // 3. XEM CHI TIẾT
    const viewCustomerDetail = async (customerId) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`${API_BASE_URL}/${customerId}`);
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.message || "Lỗi tải chi tiết");
                return;
            }

            if (data.customer) {
                setSelectedCustomer(data.customer);
                setOrderHistory(data.orders || []);
                setShowModal(true);
            } else {
                alert("Dữ liệu khách hàng trả về bị rỗng");
            }
        } catch (error) {
            console.error("Lỗi VIEW:", error);
            alert("Không thể kết nối API xem chi tiết.");
        } finally {
            setLoadingDetail(false);
        }
    };

    // 4. MỞ MODAL SỬA
    const openEditModal = (customer) => {
        setEditCustomer({ ...customer });
        setShowEditModal(true);
    };

    // 5. CẬP NHẬT THÔNG TIN
    const updateCustomerInfo = async () => {
        if (!editCustomer || !editCustomer.id) {
            alert("Lỗi: Không tìm thấy ID khách hàng cần sửa.");
            return;
        }

        // Validate SĐT khi sửa luôn cho chắc
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(editCustomer.phone)) {
            alert("Số điện thoại không hợp lệ! (Phải 10 số, bắt đầu bằng 0)");
            return;
        }

        setIsUpdating(true);

        try {
            const res = await fetch(`${API_BASE_URL}/${editCustomer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: editCustomer.fullName,
                    email: editCustomer.email,
                    phone: editCustomer.phone,
                    address: editCustomer.address,
                    dob: editCustomer.dob
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Lỗi cập nhật khách hàng");
                return;
            }

            setCustomers(prev =>
                prev.map(c => (c.id === editCustomer.id ? { ...c, ...editCustomer } : c))
            );

            alert("Cập nhật thành công!");
            setShowEditModal(false);

        } catch (error) {
            console.error("Lỗi UPDATE:", error);
            alert("Không thể cập nhật khách hàng.");
        } finally {
            setIsUpdating(false);
        }
    };

    // 6. TÌM KIẾM CLIENT-SIDE
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerCaseSearch = normalizeSearchableValue(searchTerm);

        return customers.filter(c => {
            return Object.values(c).some(value =>
                value && normalizeSearchableValue(value.toString()).includes(lowerCaseSearch)
            );
        });
    }, [customers, searchTerm]);

    // --- RENDER ---
    if (isLoading) {
        return <p className="p-6 text-center text-blue-600 font-semibold">Đang tải danh sách khách hàng...</p>;
    }

    if (error) {
        return <p className="p-6 text-center text-red-600 font-semibold">Lỗi: {error}</p>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Khách hàng</h1>
            <p className="text-gray-500 text-sm">
                Quyền: Owner, Sales, Online Sales (chỉnh sửa); Warehouse, Shipper (chỉ xem)
            </p>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    {/* TÌM KIẾM */}
                    <div className="relative flex-grow w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên, SĐT, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* NÚT THÊM */}
                    {canEdit && (
                        <button
                            onClick={handleAddClick}
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Thêm khách hàng
                        </button>
                    )}
                </div>

                {/* BẢNG DỮ LIỆU */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã KH</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{c.id}</td>
                                    <td className="px-6 py-4 text-sm">{c.fullName}</td>
                                    <td className="px-6 py-4 text-sm">{c.phone}</td>
                                    <td className="px-6 py-4 text-sm max-w-xs truncate">{c.address}</td>
                                    <td className="px-6 py-4 text-right text-sm flex justify-end gap-2">
                                        <button
                                            title="Xem chi tiết"
                                            onClick={() => viewCustomerDetail(c.id)}
                                            className="text-blue-600 hover:bg-blue-100 p-2 rounded-full"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        {canEdit && (
                                            <button
                                                title="Sửa thông tin"
                                                onClick={() => openEditModal(c)}
                                                className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-full"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Không tìm thấy khách hàng nào.</p>
                    )}
                </div>
            </div>

            {/* --- MODAL THÊM KHÁCH HÀNG (BẮT BUỘC TẠO TÀI KHOẢN) --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                                <UserPlus className="w-6 h-6 text-blue-600" /> Thêm Khách Hàng & Tài Khoản
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nguyễn Văn A"
                                        value={newCustomer.fullName}
                                        onChange={e => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại (10 số) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border p-2.5 rounded-lg"
                                        placeholder="09xxxxxxxx"
                                        value={newCustomer.phone}
                                        onChange={handlePhoneChange}
                                        maxLength={10} // Giới hạn 10 ký tự ở input
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border p-2.5 rounded-lg"
                                        value={newCustomer.email}
                                        onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2.5 rounded-lg"
                                        value={newCustomer.address}
                                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2.5 rounded-lg"
                                        value={newCustomer.dob}
                                        onChange={e => setNewCustomer({ ...newCustomer, dob: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* BẮT BUỘC TẠO TÀI KHOẢN (UI) */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                        <UserPlus size={18}/> Thông tin tài khoản (Bắt buộc)
                                    </h3>
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Mặc định tạo</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full border p-2.5 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" 
                                            value={newCustomer.username}
                                            readOnly 
                                            title="Tên đăng nhập tự động lấy theo số điện thoại"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Tự động lấy theo Số điện thoại</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" 
                                            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                                            value={newCustomer.password}
                                            onChange={e => setNewCustomer({ ...newCustomer, password: e.target.value })}
                                            placeholder="Nhập mật khẩu..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={createCustomer}
                                disabled={isCreating}
                                className={`flex items-center px-5 py-2.5 text-white font-medium rounded-lg shadow-lg ${isCreating ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {isCreating ? "Đang xử lý..." : <><Save className="w-5 h-5 mr-2" /> Lưu & Tạo TK</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL XEM CHI TIẾT --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-lg relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-red-600 text-xl"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-4">Chi tiết khách hàng</h2>
                        {loadingDetail ? <p>Đang tải...</p> : (
                            <>
                                <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                                    <p><b>Mã KH:</b> {selectedCustomer?.id}</p>
                                    <p><b>Họ tên:</b> {selectedCustomer?.fullName}</p>
                                    <p><b>SĐT:</b> {selectedCustomer?.phone}</p>
                                    <p><b>Email:</b> {selectedCustomer?.email}</p>
                                    <p><b>Địa chỉ:</b> {selectedCustomer?.address}</p>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Lịch sử mua hàng</h3>
                                {orderHistory.length === 0 ? (
                                    <p className="text-gray-500">Chưa có đơn hàng nào.</p>
                                ) : (
                                    <table className="w-full border">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2">Mã đơn</th>
                                                <th className="border p-2">Ngày mua</th>
                                                <th className="border p-2">Tổng tiền</th>
                                                <th className="border p-2">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderHistory.map(order => (
                                                <tr key={order.id}>
                                                    <td className="border p-2">{order.id}</td>
                                                    <td className="border p-2">{order.orderDate}</td>
                                                    <td className="border p-2">{Number(order.totalAmount).toLocaleString()} đ</td>
                                                    <td className="border p-2">{order.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL SỬA --- */}
            {showEditModal && editCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-lg relative">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-red-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-4">Cập nhật khách hàng</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="font-medium">Họ tên</label>
                                <input
                                    type="text"
                                    value={editCustomer.fullName}
                                    onChange={(e) => setEditCustomer({ ...editCustomer, fullName: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="font-medium">SĐT (10 số, bắt đầu bằng 0)</label>
                                <input
                                    type="text"
                                    value={editCustomer.phone}
                                    onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="font-medium">Email</label>
                                <input
                                    type="email"
                                    value={editCustomer.email}
                                    onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="font-medium">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={editCustomer.address}
                                    onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="font-medium">Năm sinh</label>
                                <input
                                    type="date"
                                    value={editCustomer.dob || ''}
                                    onChange={(e) => setEditCustomer({ ...editCustomer, dob: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                            <button
                                onClick={updateCustomerInfo}
                                disabled={isUpdating}
                                className={`w-full py-2 rounded-lg text-white font-semibold mt-4 ${isUpdating ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};