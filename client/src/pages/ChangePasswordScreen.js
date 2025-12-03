// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\ChangePasswordScreen.js
import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, Lock, ArrowLeft, LogOut } from 'lucide-react'; // Thêm icon cần thiết
import { updatePassword } from '../services/api'; 
import { roleToRoutes } from '../utils/constants';

// --- IMPORT ASSETS (Giống hệt trang Reset) ---
import ShopLogo from '../assets/shop-logo-konen.png';
import WingedLogo from '../assets/shop-logo-konen-bochu.png';
import NenLogin from '../assets/nen.png'; 
import Baoquanhlogo from '../assets/baoquanh-logo.png';

// --- COMPONENT INPUT FIELD (LẤY TỪ CODE BẠN GỬI - STYLE SÁNG) ---
const InputField = ({ type, value, onChange, placeholder, showToggle, onToggle, isShow, label }) => (
    <div className="relative z-10 w-full mb-4"> 
        {/* Thêm label nhỏ để dễ phân biệt 3 ô nhập liệu */}
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
            {label}
        </label>
        <div className="relative group">
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-5 py-4 bg-gray-50 border border-yellow-200 rounded-xl text-black placeholder-gray-400 
                           focus:outline-none focus:border-[#a38112] focus:ring-2 focus:ring-[#D4AF37]/20 focus:shadow-[0_0_15px_rgba(253,185,49,0.5)] 
                           transition-all duration-300 text-sm tracking-wide shadow-sm"
                required
            />
            {showToggle && (
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
                >
                    {isShow ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            )}
        </div>
    </div>
);

export const ChangePasswordScreen = ({ currentUser, setPath }) => {
    // --- LOGIC GIỮ NGUYÊN (Logic của trang ChangePassword cũ) ---
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State hiển thị password
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) return setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        if (newPassword !== confirmPassword) return setError('Mật khẩu mới không khớp.');
        if (!currentUser || !currentUser.id) return setError('Lỗi thông tin user.');

        setIsSubmitting(true);
        try {
            await updatePassword(currentUser.id, oldPassword, newPassword); 
            // Có thể dùng alert hoặc setSuccess state tùy ý, ở đây giữ alert theo logic gốc
            alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            localStorage.clear();
            window.location.href = '/'; 
        } catch (err) {
            setError(err.message || 'Mật khẩu cũ không chính xác.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (currentUser?.roleName === 'Customer') {
            setPath('/shop');
        } else {
            const defaultPath = roleToRoutes[currentUser?.roleName]?.[0]?.path || '/products';
            setPath(defaultPath);
        }
    };

    // --- RENDER GIAO DIỆN (COPY STYLE TỪ RESET PASSWORD) ---
    return (
        <div className="min-h-screen w-full bg-[#050505] font-sans flex items-center justify-center relative overflow-hidden selection:bg-[#D4AF37] selection:text-white">
            
            {/* 1. BACKGROUND IMAGE */}
            <div className="absolute inset-0 z-0">
                <img src={NenLogin} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/30"></div>
            </div>

            {/* Back Button */}

            <button

                onClick={() => setPath('/profile')}

                className="absolute top-8 left-8 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"

            >

                <div className="bg-white/5 p-2 rounded-full border border-white/10 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all">

                    <ArrowLeft className="w-5 h-5 group-hover:text-[#D4AF37] transition-colors" />

                </div>

            </button>
            {/* --- MAIN CARD --- */}
            <div className="relative z-10 w-full max-w-[900px] min-h-[600px] grid grid-cols-1 lg:grid-cols-2 
                          rounded-3xl overflow-hidden m-4 animate-fade-in-up
                          shadow-[0_0_80px_rgba(212,175,55,0.6)] 
                          border border-[#D4AF37]/30">

                {/* LEFT COLUMN (BRANDING - Y HỆT) */}
                <div className="hidden lg:flex flex-col items-center justify-center p-10 bg-[#080808] text-white relative overflow-hidden">
                    {/* Hiệu ứng nền phụ */}
                    <div className="absolute inset-0 z-0">
                        <img src={Baoquanhlogo} alt="Decoration" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/30"></div>
                    </div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                    {/* Logo & Slogan */}
                    <div className="relative z-10 text-center">
                        <div className="relative flex justify-center items-center mb-8 group">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#D4AF37]/30 rounded-full blur-2xl group-hover:bg-[#D4AF37]/40 transition-all duration-700"></div>
                            <img src={WingedLogo || ShopLogo} alt="Aura Logo" className="w-60 h-auto object-contain relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]" />
                        </div>
                        
                        <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[#F9E29C] via-[#D4AF37] to-[#F9E29C] drop-shadow-sm mt-1 mb-1">
                            Aura Store
                        </h2>
                        <div className="flex items-center justify-center gap-0 opacity-60 mt-0 mb-6">
                            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-[#D4AF37]"></div>
                            <div className="h-[2px] w-24 bg-gradient-to-l from-transparent to-[#D4AF37]"></div>
                        </div>
                        
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-sm font-medium italic leading-relaxed tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            "Bảo mật tài khoản <br /> là trách nhiệm của chúng tôi."
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN (FORM - NỀN TRẮNG NHƯ YÊU CẦU) */}
                <div className="bg-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                    
                    

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-6 mt-8">
                        <img src={ShopLogo} alt="Logo" className="h-14 w-auto drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                    </div>

                    {/* Header Form */}
                    <div className="text-center mb-6 relative z-10 mt-4 lg:mt-0">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
                            <Lock className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-[#856602] mb-2 uppercase tracking-wide">
                            Đổi Mật Khẩu
                        </h3>
                        
                        <p className="text-[#a08322] text-sm">
                            Tài khoản: <span className="font-bold">{currentUser?.fullName}</span>
                        </p>
                    </div>

                    {/* Form Content */}
                    <div className="relative z-10">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Input Mật khẩu cũ */}
                            <InputField 
                                
                                type={showOld ? "text" : "password"} 
                                value={oldPassword} 
                                onChange={(e) => setOldPassword(e.target.value)} 
                                placeholder="Nhập mật khẩu cũ" 
                                showToggle={true} 
                                onToggle={() => setShowOld(!showOld)} 
                                isShow={showOld} 
                            />

                            {/* Input Mật khẩu mới */}
                            <InputField 
                               
                                type={showNew ? "text" : "password"} 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="Mật khẩu mới (6+ ký tự)" 
                                showToggle={true} 
                                onToggle={() => setShowNew(!showNew)} 
                                isShow={showNew} 
                            />

                            {/* Input Xác nhận */}
                            <InputField 
                               
                                type={showConfirm ? "text" : "password"} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="Nhập lại mật khẩu mới" 
                                showToggle={true} 
                                onToggle={() => setShowConfirm(!showConfirm)} 
                                isShow={showConfirm} 
                            />

                            {error && (
                                <div className="p-3 mb-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Nút Submit (Gradient Vàng) */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="group relative w-full mt-6 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#010101] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden uppercase text-xs tracking-[0.15em] flex items-center justify-center gap-2"
                            >
                                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    {isSubmitting ? 'Đang Xử Lý...' : (
                                        <>
                                            <LogOut size={16} />
                                            Xác Nhận & Đăng Xuất
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Footer nhỏ */}
                    <div className="mt-6 text-center text-xs text-gray-400 relative z-10">
                        Bảo mật bởi Aura Security
                    </div>
                </div>
            </div>
        </div>
    );
};