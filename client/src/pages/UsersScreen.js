import React, { useState, useEffect } from 'react';
import { getUsers, adminResetPassword, adminUpdateUserStatus } from '../services/api'; 
import { 
    Search, 
    Shield, User, Truck, ShoppingBag, Headset, 
    Key, X, CheckCircle, AlertCircle, Loader,
    Lock, Unlock, RefreshCcw 
} from 'lucide-react';

// --- HELPER: MÀU SẮC ROLE ---
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

// --- HELPER: ICON ROLE ---
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

// --- HELPER: KIỂM TRA TRẠNG THÁI AN TOÀN ---
const isActiveUser = (status) => {
    const s = (status || '').toString().toLowerCase();
    return s === 'active' || s === 'hoạt động' || s === '1';
};

// --- HELPER: HIỂN THỊ BADGE TRẠNG THÁI ---
const getStatusBadge = (status) => {
    if (isActiveUser(status)) {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle size={10} className="mr-1"/> Hoạt động</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200"><Lock size={10} className="mr-1"/> Đã khóa</span>;
};

// --- MODAL ĐỔI MẬT KHẨU ---
const ResetPasswordModal = ({ isOpen, onClose, targetUser }) => {
    const [newPass, setNewPass] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setNewPass('');
    }, [isOpen]);

    if (!isOpen || !targetUser) return null;

    const handleReset = async (e) => {
        e.preventDefault();
        if (!newPass.trim()) return alert("Vui lòng nhập mật khẩu mới");

        const userId = targetUser.user_id || targetUser.userId || targetUser.id;
        if (!userId) return alert("Lỗi: Không tìm thấy ID của user này.");

        try {
            setLoading(true);
            await adminResetPassword(userId, newPass);
            alert('Đổi mật khẩu thành công!');
            onClose();
        } catch (error) {
            console.error("Lỗi API:", error);
            alert('Lỗi: ' + (error.message || "Không thể reset mật khẩu"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Key className="w-5 h-5" /> Cấp lại mật khẩu
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleReset} className="p-6">
                    <div className="mb-5 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">Tài khoản:</div>
                        <div className="font-bold text-blue-900 text-lg">{targetUser.username}</div>
                        <div className="text-xs text-gray-500">{targetUser.full_name}</div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Nhập mật khẩu mới..."
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Lưu ý: Người dùng sẽ bị đăng xuất khỏi các thiết bị khác.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-70">
                            {loading ? 'Đang xử lý...' : <><CheckCircle size={18} /> Xác nhận</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MÀN HÌNH CHÍNH (Đã tích hợp Auto-Refresh) ---
export const UsersScreen = ({ currentUser, refreshKey }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // [THAY ĐỔI 1]: Tách logic gọi API ra thành hàm riêng có tham số
    const fetchData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
            // Lưu ý: Nếu đang search thì không ghi đè filteredUsers lung tung
            // (Đoạn này để useEffect search tự xử lý, ta chỉ update source `users`)
        } catch (error) {
            console.error("Lỗi tải user:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // [THAY ĐỔI 2]: useEffect kích hoạt Polling (5 giây/lần)
    useEffect(() => {
        // 1. Gọi lần đầu tiên (có hiện Loading quay quay)
        fetchData(true);

        // 2. Thiết lập bộ đếm: Gọi mỗi 5 giây (KHÔNG hiện Loading để tránh nháy)
        const intervalId = setInterval(() => {
            // console.log("[Auto-Refresh] Đang cập nhật danh sách user...");
            fetchData(false); 
        }, 5000); // 5000ms = 5 giây

        // 3. Dọn dẹp bộ đếm khi thoát trang (Unmount)
        return () => clearInterval(intervalId);

    }, [refreshKey]); // Nếu bấm Lưu bên Profile, nó cũng kích hoạt gọi lại ngay lập tức

    // Logic Khóa/Mở khóa
    const handleToggleStatus = async (user) => {
        const userId = user.user_id || user.id || user.userId;
        if (!userId) return alert("Lỗi: Không tìm thấy ID user!");

        const isCurrentlyActive = isActiveUser(user.status);
        const actionText = isCurrentlyActive ? 'KHÓA' : 'MỞ KHÓA';
        const newStatus = isCurrentlyActive ? 'Locked' : 'Active';

        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản ${user.username} không?`)) return;

        try {
            await adminUpdateUserStatus(userId, newStatus);
            // Cập nhật ngay lập tức trên giao diện
            const updateLogic = (u) => {
                const uId = u.user_id || u.id || u.userId;
                return uId === userId ? { ...u, status: newStatus } : u;
            };
            setUsers(prev => prev.map(updateLogic));
        } catch (error) {
            console.error(error);
            alert('Lỗi cập nhật trạng thái');
        }
    };

    // Logic Lọc (Chạy mỗi khi users thay đổi hoặc nhập search)
    useEffect(() => {
        let result = users;
        const myRole = (currentUser?.roleName || '').toLowerCase();
        
        if (['sales', 'online sales'].includes(myRole)) {
            result = result.filter(u => (u.roleName || '').toLowerCase() === 'customer');
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(u => 
                (u.username || '').toLowerCase().includes(lower) || 
                (u.full_name || '').toLowerCase().includes(lower) ||
                (String(u.user_id || '')).toLowerCase().includes(lower)
            );
        }
        setFilteredUsers(result);
    }, [searchTerm, users, currentUser]); // users thay đổi (do polling) -> filteredUsers tự update theo

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Danh sách tự động cập nhật mỗi 5 giây
                    </p>
                </div>
                
                {/* Nút làm mới thủ công (nếu muốn bấm ngay lập tức) */}
                <button 
                    onClick={() => fetchData(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm font-medium"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
                    Làm mới
                </button>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên, ID hoặc username..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading && users.length === 0 ? ( // Chỉ hiện loading lớn khi chưa có dữ liệu lần đầu
                    <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Người dùng</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">Vai trò</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Username</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Trạng thái</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => {
                                        const isLocked = !isActiveUser(user.status);
                                        return (
                                            <tr key={user.user_id || user.id || Math.random()} className={`hover:bg-gray-50 transition-colors group ${isLocked ? 'bg-gray-50/50' : ''}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase flex-shrink-0">
                                                            {user.full_name ? user.full_name.charAt(0) : '?'}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                {user.full_name || user.username} 
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {user.user_id || user.id || user.userId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(user.roleName)}`}>
                                                        {getRoleIcon(user.roleName)} {user.roleName}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-mono text-sm text-blue-600">
                                                    {user.username}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {getStatusBadge(user.status)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                                                            title="Cấp lại mật khẩu"
                                                        >
                                                            <Key className="w-3.5 h-3.5 mr-1.5" /> Reset MK
                                                        </button>

                                                        <button 
                                                            onClick={() => handleToggleStatus(user)}
                                                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors shadow-sm
                                                                ${!isLocked
                                                                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                                                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                                }`}
                                                        >
                                                            {!isLocked
                                                                ? <><Lock className="w-3.5 h-3.5 mr-1.5" /> Khóa</>
                                                                : <><Unlock className="w-3.5 h-3.5 mr-1.5" /> Mở khóa</>
                                                            }
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            Không tìm thấy kết quả phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ResetPasswordModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                targetUser={selectedUser} 
            />
        </div>
    );
};