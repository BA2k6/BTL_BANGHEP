//C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\ResetPasswordScreen.js
import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import { resetPassword } from '../services/api'; 
// Import các assets giống LoginScreen
import ShopLogo from '../assets/shop-logo-konen.png';
import WingedLogo from '../assets/shop-logo-konen-bochu.png';
import NenLogin from '../assets/nen.png'; 
import Baoquanhlogo from '../assets/baoquanh-logo.png';

// --- TÁI SỬ DỤNG INPUT FIELD TỪ LOGIN SCREEN ---
const InputField = ({ type, value, onChange, placeholder, showToggle, onToggle, isShow }) => (
    <div className="relative z-10 w-full"> 
        <div className="relative group">
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-5 py-4 bg-gray-50 border border-yellow-200 rounded-xl text-black placeholder-gray-500 
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

export const ResetPasswordScreen = ({ currentUser, setPath }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State hiển thị password
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const validateStrongPassword = (pass) => {
        // Ít nhất 6 ký tự
        const strongRegex = new RegExp("(?=.{6,})");
        return strongRegex.test(pass);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateStrongPassword(password)) {
            return setError('Mật khẩu phải có ít nhất 6 ký tự.');
        }
        if (password !== confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp.');
        }
        if (!currentUser || !currentUser.id) {
            return setError('Lỗi xác thực người dùng.');
        }

        setIsSubmitting(true);
        try {
            await resetPassword(currentUser.id, password); 
            setSuccess(true);
            // Tự động logout và về trang login sau 2s
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/'; 
            }, 2000);
        } catch (err) {
            setError(err.message || 'Lỗi hệ thống.');
            setIsSubmitting(false);
        } 
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="min-h-screen w-full bg-[#050505] font-sans flex items-center justify-center relative overflow-hidden selection:bg-[#D4AF37] selection:text-white">
            
            {/* 1. BACKGROUND IMAGE (Giống Login) */}
            <div className="absolute inset-0 z-0">
                <img src={NenLogin} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/30"></div>
            </div>

            {/* --- MAIN CARD --- */}
            <div className="relative z-10 w-full max-w-[900px] min-h-[580px] grid grid-cols-1 lg:grid-cols-2 
                          rounded-3xl overflow-hidden m-4 animate-fade-in-up
                          shadow-[0_0_80px_rgba(212,175,55,0.6)] 
                          border border-[#D4AF37]/30">

                {/* LEFT COLUMN (BRANDING - Giữ nguyên vẻ đẹp của Login) */}
                <div className="hidden lg:flex flex-col items-center justify-center p-10 bg-[#080808] text-white relative overflow-hidden">
                    {/* Hiệu ứng nền phụ */}
                    <div className="absolute inset-0 z-0">
                        <img src={Baoquanhlogo} alt="Background Decoration" className="w-full h-full object-cover" />
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
                            "An toàn tài khoản <br /> là ưu tiên hàng đầu."
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN (FORM ĐỔI MK) */}
                <div className="bg-white p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
                    
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-6">
                        <img src={ShopLogo} alt="Logo" className="h-14 w-auto drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                    </div>

                    {/* Header Form */}
                    <div className="text-center mb-8 relative z-10">
                        {success ? (
                             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
                        ) : (
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
                                <Lock className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        )}
                        
                        <h3 className="text-2xl font-bold text-[#856602] mb-2 uppercase tracking-wide">
                            {success ? 'Thành Công!' : 'Đổi Mật Khẩu'}
                        </h3>
                        
                        {!success && (
                            <p className="text-[#a08322] text-sm">
                                Xin chào <span className="font-bold">{currentUser?.fullName}</span>,<br/>
                                vui lòng thiết lập mật khẩu mới.
                            </p>
                        )}
                    </div>

                    {/* Form Content */}
                    <div className="relative z-10">
                        {success ? (
                            <div className="text-center space-y-4">
                                <p className="text-gray-600">Mật khẩu của bạn đã được cập nhật thành công.</p>
                                <p className="text-sm text-gray-400">Đang chuyển hướng về trang đăng nhập...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <InputField 
                                    type={showPass ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Mật khẩu mới (Có ít nhất 6 kí tự)" 
                                    showToggle={true} 
                                    onToggle={() => setShowPass(!showPass)} 
                                    isShow={showPass} 
                                />
                                
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
                                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium animate-pulse">
                                        {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="group relative w-full mt-4 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#010101] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden uppercase text-xs tracking-[0.15em]"
                                >
                                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"></div>
                                    <span className="relative z-10">
                                        {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Thay Đổi'}
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Footer nhỏ */}
                    <div className="mt-8 text-center text-xs text-gray-400 relative z-10">
                        Bảo mật bởi Aura Security
                    </div>
                </div>
            </div>
        </div>
    );
};