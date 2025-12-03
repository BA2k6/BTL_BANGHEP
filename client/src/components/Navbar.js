import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';

export const Navbar = ({ currentUser, handleLogout, setPath }) => {
    
    // 1. Logic xử lý hiển thị tên an toàn (Tránh lỗi khi API trả về field khác nhau)
    // Ưu tiên full_name (từ API profile), sau đó đến fullName (từ login), cuối cùng là 'Guest'
    const displayName = currentUser?.full_name || currentUser?.fullName || 'Khách';
    
    // Tương tự cho Role
    const displayRole = currentUser?.role_name || currentUser?.roleName || 'Chưa đăng nhập';

    // 2. Logic lấy chữ cái đầu để làm Avatar (Ví dụ: "Nguyễn Văn A" -> "N")
    const getInitial = (name) => {
        return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 w-full md:pl-64 transition-all">
            
            {/* Tiêu đề bên trái (Ẩn trên mobile nếu cần không gian) */}
            <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-gray-800 hidden sm:block tracking-tight">
                    Hệ thống Quản lý <span className="text-[#D4AF37]">Aura Store</span>
                </div>
            </div>

            {/* Khu vực bên phải: User Info + Logout */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Nút bấm vào Profile */}
                <button 
                    onClick={() => setPath('/profile')} 
                    title="Hồ sơ cá nhân" 
                    className="group flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200"
                >
                    {/* Avatar Circle */}
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold shadow-sm group-hover:shadow-md transition-all">
                        {getInitial(displayName)}
                    </div>

                    {/* Text Info */}
                    <div className="text-right hidden sm:block pr-1">
                        <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#D4AF37] transition-colors">
                            {displayName}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">
                            {displayRole}
                        </p>
                    </div>
                </button>
                
                {/* Divider */}
                <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

                {/* Nút Đăng xuất */}
                <button 
                    title="Đăng xuất" 
                    onClick={handleLogout} 
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};