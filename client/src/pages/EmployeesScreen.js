import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { Plus, Search, User, Edit, Trash2, X, Shield, Truck, ShoppingBag, Headset, CheckCircle, AlertCircle, RefreshCcw, Loader } from 'lucide-react'; 

// ------------------------------------------------------------------------------------------------
// --- HELPER FUNCTIONS ---
// ------------------------------------------------------------------------------------------------

const getRoleBadgeColor = (roleName) => {
    const role = (roleName || '').toLowerCase();
    switch (role) {
        case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'customer': return 'bg-green-100 text-green-800 border-green-200';
        case 'sales': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'warehouse': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'shipper': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'online sales': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getRoleIcon = (roleName) => {
    const role = (roleName || '').toLowerCase();
    switch (role) {
        case 'owner': return <Shield className="w-3.5 h-3.5 mr-1" />;
        case 'customer': return <User className="w-3.5 h-3.5 mr-1" />;
        case 'shipper': return <Truck className="w-3.5 h-3.5 mr-1" />;
        case 'online sales': return <Headset className="w-3.5 h-3.5 mr-1" />;
        default: return <ShoppingBag className="w-3.5 h-3.5 mr-1" />;
    }
};

const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'hoạt động') {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} className='mr-1' /> Hoạt động</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700"><AlertCircle size={12} className='mr-1' /> Đã khóa</span>;
};

// ------------------------------------------------------------------------------------------------
// --- LOGIC SINH ID ---
// ------------------------------------------------------------------------------------------------
const generateNextEmpId = (roleName, employees) => {
    let prefix = 'EMP';
    switch (roleName) {
        case 'Warehouse': prefix = 'WH'; break;
        case 'Sales': prefix = 'SALE'; break;
        case 'Online Sales': prefix = 'OS'; break;
        case 'Shipper': prefix = 'SHIP'; break;
        default: prefix = 'EMP';
    }

    const existingIds = employees
        .filter(e => e.employee_id && e.employee_id.startsWith(prefix))
        .map(e => parseInt(e.employee_id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
    
    const max = existingIds.length ? Math.max(...existingIds) : 0;
    return `${prefix}${(max + 1).toString().padStart(2, '0')}`;
};

// ------------------------------------------------------------------------------------------------
// --- MÀN HÌNH CHÍNH ---
// ------------------------------------------------------------------------------------------------

export const EmployeesScreen = () => {
    const [employees, setEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false); // [MỚI] Thêm state loading để hiển thị khi cần

    const initialFormState = {
        roleName: 'Sales',
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        address: '',
        baseSalary: 5000000,
        employeeId: '' 
    };

    const [formData, setFormData] = useState(initialFormState);

    // 1. Tải danh sách nhân viên [ĐÃ SỬA: Thêm tham số showLoading]
    const fetchEmployees = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get('/employees'); 
            setEmployees(res.data);
        } catch (err) { 
            console.error("Lỗi tải danh sách:", err); 
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // [MỚI] Logic Auto Refresh: Gọi mỗi 5 giây
    useEffect(() => { 
        // Gọi ngay lần đầu (hiện loading)
        fetchEmployees(true);

        // Thiết lập bộ đếm 5 giây gọi lại 1 lần (không hiện loading để tránh nháy)
        const intervalId = setInterval(() => {
            fetchEmployees(false);
        }, 5000);

        // Dọn dẹp khi thoát trang
        return () => clearInterval(intervalId);
    }, []);

    // 2. Tự động sinh ID
    useEffect(() => {
        if (isModalOpen && !isEditing) {
            const nextId = generateNextEmpId(formData.roleName, employees);
            setFormData(prev => ({ ...prev, employeeId: nextId }));
        }
    }, [formData.roleName, isModalOpen, isEditing, employees]);

    // 3. Hàm mở Modal để Sửa
    const handleEdit = (emp) => {
        setIsEditing(true);
        setFormData({
            roleName: emp.department || 'Sales', 
            fullName: emp.full_name,
            username: emp.username,
            password: '', 
            email: emp.email,
            phone: emp.phone,
            address: emp.address,
            baseSalary: emp.base_salary,
            employeeId: emp.employee_id 
        });
        setIsModalOpen(true);
    };

    // 4. Hàm mở Modal để Thêm mới
    const handleAddNew = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setIsModalOpen(true);
    }

    // 5. Xử lý Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- VALIDATION SỐ ĐIỆN THOẠI ---
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            alert("LỖI: Số điện thoại không hợp lệ!\n\nYêu cầu:\n- Phải có đúng 10 chữ số.\n- Phải bắt đầu bằng số 0.");
            return;
        }

        // --- VALIDATION USERNAME/PASS ---
        if (!isEditing) {
            if (!formData.username || !formData.password) {
                alert("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
                return;
            }
        }

        // --- CHUẨN BỊ PAYLOAD ---
        const payload = {
            employeeId: formData.employeeId,
            fullName: formData.fullName,
            roleName: formData.roleName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            baseSalary: Number(formData.baseSalary),
            username: formData.username,
            password: formData.password
        };

        if (isEditing && !payload.password) {
            delete payload.password;
        }

        console.log("Dữ liệu gửi đi (Payload):", payload);

        try {
            if (isEditing) {
                await api.put(`/employees/${formData.employeeId}`, payload);
                alert("Cập nhật thông tin thành công!");
            } else {
                await api.post('/employees/create', payload);
                alert(`Thêm nhân viên và tạo tài khoản ${formData.username} thành công!`);
            }
            setIsModalOpen(false);
            fetchEmployees(true); // Gọi lại ngay để cập nhật UI
        } catch (error) {
            console.error("Chi tiết lỗi từ Server:", error.response);
            
            let errorMessage = "Đã có lỗi xảy ra.";
            if (error.response && error.response.data) {
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (typeof error.response.data === 'object') {
                    errorMessage = JSON.stringify(error.response.data, null, 2);
                }
            } else {
                errorMessage = error.message;
            }

            alert("THẤT BẠI (Lỗi " + (error.response?.status || 'Unknown') + "):\n" + errorMessage);
        }
    };

    // 6. Xử lý Xóa
   /* const handleDelete = async (employeeId, username) => {
        const confirmMsg = `CẢNH BÁO: Bạn có chắc chắn muốn xóa nhân viên ${employeeId}?\n\nHành động này sẽ XÓA LUÔN TÀI KHOẢN đăng nhập (${username}) khỏi hệ thống.`;
        if (window.confirm(confirmMsg)) {
            try {
                await api.delete(`/employees/${employeeId}`);
                alert("Đã xóa nhân viên và tài khoản liên quan.");
                fetchEmployees(true); // Gọi lại ngay
            } catch (error) {
                alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
            }
        }
    };
    */
    // 7. Logic tìm kiếm
    const filteredEmployees = employees.filter(emp => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            (emp.full_name && emp.full_name.toLowerCase().includes(lowerSearch)) ||
            (emp.employee_id && emp.employee_id.toLowerCase().includes(lowerSearch)) ||
            (emp.username && emp.username.toLowerCase().includes(lowerSearch))
        );
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhân sự</h1>
                    {/* [MỚI] Thêm dòng thông báo nhỏ */}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <RefreshCcw size={10} className="animate-spin-slow"/> Tự động cập nhật mỗi 5s
                    </p>
                </div>
                <div className="flex gap-2">
                     {/* [MỚI] Nút làm mới thủ công */}
                    <button 
                        onClick={() => fetchEmployees(true)}
                        className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-colors"
                        title="Làm mới danh sách ngay lập tức"
                    >
                         <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={handleAddNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors"
                    >
                        <Plus size={20} /> Thêm Nhân viên
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên, Mã NV hoặc username..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 min-h-[200px]">
                {loading && employees.length === 0 ? (
                     <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center h-48">
                        <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-4 border-b">Mã NV</th>
                                <th className="p-4 border-b">Họ tên</th>
                                <th className="p-4 border-b">Bộ phận</th>
                                <th className="p-4 border-b">Tài khoản & Trạng thái</th>
                                <th className="p-4 border-b">Liên hệ & Lương</th>
                                <th className="p-4 border-b text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(emp => (
                                <tr key={emp.employee_id} className="border-b hover:bg-blue-50 transition-colors">
                                    <td className="p-4 font-bold text-blue-600">{emp.employee_id}</td>
                                    <td className="p-4 font-medium">{emp.full_name}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(emp.department)}`}>
                                            {getRoleIcon(emp.department)} {emp.department}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="text-gray-800 font-mono flex items-center gap-1 font-semibold">{emp.username}</div>
                                        <div className="mt-1">{getStatusBadge(emp.status)}</div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="text-gray-800">{emp.email}</div>
                                        <div className="text-gray-500">{emp.phone}</div>
                                        <div className="text-xs text-green-600 font-medium mt-1">Lương: {Number(emp.base_salary).toLocaleString()} VNĐ</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(emp)}
                                                className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                                                title="Sửa thông tin"
                                            >
                                                <Edit size={16} />
                                            </button>
                                           { /* <button 
                                                onClick={() => handleDelete(emp.employee_id, emp.username)}
                                                className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                                title="Xóa nhân viên"
                                            >
                                                <Trash2 size={16} />
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-6 text-center text-gray-500">
                                        {employees.length === 0 ? 'Chưa có dữ liệu nhân viên.' : 'Không tìm thấy kết quả phù hợp.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            {isEditing ? <Edit className="text-blue-600"/> : <Plus className="text-blue-600"/>}
                            {isEditing ? `Cập nhật: ${formData.fullName}` : 'Thêm Nhân viên & Tạo Tài khoản'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                            
                            {/* Cột 1: Thông tin Công việc */}
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <div className="border-b pb-2 mb-2 font-semibold text-blue-600 uppercase text-xs tracking-wider">Thông tin Công việc</div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Vị trí / Bộ phận</label>
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.roleName}
                                        onChange={e => setFormData({...formData, roleName: e.target.value})}
                                        disabled={isEditing} 
                                    >
                                        <option value="Sales">Nhân viên Bán hàng</option>
                                        <option value="Online Sales">Sale Online</option>
                                        <option value="Warehouse">Thủ kho</option>
                                        <option value="Shipper">Giao hàng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Mã NV {isEditing ? '(Cố định)' : '(Tự động)'}</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border bg-gray-100 text-gray-500 rounded cursor-not-allowed font-mono font-bold" 
                                        value={formData.employeeId} 
                                        readOnly 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Lương cơ bản (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.baseSalary}
                                        onChange={e => setFormData({...formData, baseSalary: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Cột 2: Thông tin Cá nhân */}
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <div className="border-b pb-2 mb-2 font-semibold text-blue-600 uppercase text-xs tracking-wider">Thông tin Cá nhân</div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Họ và Tên</label>
                                    <input 
                                        type="text" required 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.fullName}
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                    <input 
                                        type="email" required 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="0xxxxxxxxx (10 số)"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (!isNaN(val)) setFormData({...formData, phone: val});
                                        }}
                                        maxLength={10} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Địa chỉ</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Cột 3: Tài khoản Hệ thống (Full width) */}
                            <div className="col-span-2 space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
                                <div className="font-semibold text-blue-800 flex items-center gap-2">
                                    <User size={18} /> Thiết lập Tài khoản Đăng nhập
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Tên đăng nhập <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="VD: sale_hoa"
                                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${isEditing ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                            value={formData.username}
                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                            readOnly={isEditing} 
                                        />
                                        {isEditing && <p className="text-xs text-gray-500 mt-1">Không thể đổi tên đăng nhập.</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            {isEditing ? 'Đổi mật khẩu (Để trống nếu giữ nguyên)' : <span>Mật khẩu khởi tạo <span className="text-red-500">*</span></span>}
                                        </label>
                                        <input 
                                            type="password" 
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            placeholder={isEditing ? "******" : "Nhập mật khẩu..."}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER BUTTONS */}
                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition font-medium flex items-center gap-2">
                                    {isEditing ? <CheckCircle size={18}/> : <User size={18}/>}
                                    {isEditing ? 'Lưu thay đổi' : 'Tạo Nhân viên mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};