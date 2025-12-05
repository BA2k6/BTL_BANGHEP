import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Briefcase, Shield, Key, X, LogOut, Edit3, Building, Loader, Save, Banknote, Percent, History } from 'lucide-react';
import { getProfile, updateProfile } from '../services/api'; 
import NenLogin from '../assets/nen.png'; 

// Hàm format tiền tệ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export const ProfileScreen = ({ setPath, handleLogout, onRefreshUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State lưu dữ liệu form
    const [profileData, setProfileData] = useState({
        id: '', 
        full_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        department: '',
        employee_type: '',
        start_date: '',
        username: '',
        role_name: '',
        status: '',
        base_salary: 0,       // [MỚI]
        commission_rate: 0    // [MỚI]
    });

    const [salaryHistory, setSalaryHistory] = useState([]); // [MỚI]

    // 1. Fetch dữ liệu profile
    useEffect(() => {
        let isMounted = true; 
        const fetchUserData = async () => {
            try {
                const data = await getProfile(); 
                if (isMounted && data) {
                    setProfileData(prev => ({
                        ...prev,
                        ...data,
                        id: data.id || data.user_id || prev.id,
                        full_name: data.full_name || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        email: data.email || '',
                        date_of_birth: data.date_of_birth || '',
                        base_salary: data.base_salary || 0,
                        commission_rate: data.commission_rate || 0
                    }));
                }
            } catch (error) {
                console.error("Lỗi tải hồ sơ:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    alert('Phiên đăng nhập hết hạn.');
                    handleLogout();
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchUserData();
        return () => { isMounted = false; };
    }, [handleLogout]); 

    // [MỚI] Fetch lịch sử lương (Mock data nếu chưa có API)
    useEffect(() => {
        // Chỉ chạy nếu là nhân viên
        const isEmp = ['Owner', 'Shipper', 'Sales', 'Warehouse', "Online Sales"].includes(profileData.role_name);
        if (isEmp) {
            // Ở đây bạn có thể gọi API thật: /api/salaries/my-history
            // Tạm thời mình dùng mock data để hiển thị giao diện
            setSalaryHistory([
                // Dữ liệu mẫu (Xóa đi khi nối API thật)
                { month_year: '2023-11-01', base_salary: 5000000, sales_commission: 1200000, bonus: 500000, deductions: 0, net_salary: 6700000, paid_status: 'Paid' },
                { month_year: '2023-10-01', base_salary: 5000000, sales_commission: 900000, bonus: 0, deductions: 100000, net_salary: 5800000, paid_status: 'Paid' }
            ]);
        }
    }, [profileData.role_name]);

    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        try { return new Date(isoString).toISOString().split('T')[0]; } catch (e) { return isoString?.toString().split('T')[0] || ''; }
    };

    const formatDateDisplay = (isoString) => {
        if (!isoString) return 'Chưa cập nhật';
        try { return new Date(isoString).toLocaleDateString('vi-VN'); } catch (e) { return isoString; }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!profileData.full_name?.trim()) return alert("Họ tên không được để trống!");
        if (!profileData.phone?.trim()) return alert("Số điện thoại không được để trống!");

        setIsSaving(true);
        try {
            const payload = {
                id: profileData.id, 
                full_name: profileData.full_name,
                email: profileData.email,
                phone: profileData.phone,
                address: profileData.address,
                date_of_birth: profileData.date_of_birth ? formatDateForInput(profileData.date_of_birth) : null
            };

            await updateProfile(payload); 
            
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = {
                ...storedUser,
                full_name: profileData.full_name,
                fullName: profileData.full_name,
                email: profileData.email,
                phone: profileData.phone,
                address: profileData.address
            };
            localStorage.setItem('user', JSON.stringify(newUser));

            if (onRefreshUser) onRefreshUser(); 

            alert('Cập nhật hồ sơ thành công!');
            setIsEditing(false);

        } catch (error) {
            console.error("Lỗi Save:", error);
            const msg = error.response?.data?.message || error.message || 'Lỗi server';
            alert('Lỗi cập nhật: ' + msg);
        } finally {
            setIsSaving(false);
        }
    };

    const isEmployee = ['Owner', 'Shipper', 'Sales', 'Warehouse', "Online Sales"].includes(profileData.role_name);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto" />
                    <p className="mt-2 text-gray-500">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans animate-fade-in-up relative">
             <div className="h-60 w-full absolute top-0 left-0 z-0 overflow-hidden">
                <img src={NenLogin} alt="Background" className="w-full h-full object-cover blur-sm opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-gray-50"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pt-20">
                <div className="flex items-center justify-between mb-8 text-white">
                    <div>
                        <h1 className="text-3xl font-bold tracking-wide">Hồ sơ cá nhân</h1>
                        <p className="text-gray-300 text-sm mt-1 opacity-80">Quản lý thông tin tài khoản Aura Store</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CỘT TRÁI (AVATAR) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative border-t-4 border-[#D4AF37]">
                            <div className="p-8 text-center">
                                <div className="relative mx-auto w-32 h-32 mb-4">
                                    <div className="w-full h-full rounded-full border-[3px] border-[#D4AF37] p-1 bg-white shadow-lg">
                                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <span className="text-4xl font-bold text-gray-400 select-none">
                                                {profileData.full_name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{profileData.full_name || 'Người dùng'}</h2>
                                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-[#856602] text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <Shield className="w-3 h-3" /> {profileData.role_name || 'Member'}
                                </div>
                                <div className="mt-8 space-y-3">
                                    <button onClick={() => setPath('/change-password')} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-yellow-50 transition-all font-medium">
                                        <Key className="w-4 h-4" /> Đổi mật khẩu
                                    </button>
                                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md transition-all font-medium">
                                        <LogOut className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM DỮ LIỆU */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 1. THÔNG TIN CÁ NHÂN */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#D4AF37]" /> Thông tin chi tiết
                                </h3>
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#b38728] shadow-md transition-all text-sm font-bold">
                                        <Edit3 className="w-4 h-4" /> Chỉnh sửa
                                    </button>
                                ) : (
                                    <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="Hủy bỏ">
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="col-span-1 md:col-span-2">
                                    <Label icon={<User/>} text="Họ và tên" />
                                    {isEditing ? <Input name="full_name" value={profileData.full_name} onChange={handleChange} /> : <DisplayValue value={profileData.full_name} />}
                                </div>

                                <div>
                                    <Label icon={<Mail/>} text="Email" />
                                    {isEditing ? <Input name="email" value={profileData.email} onChange={handleChange} /> : <DisplayValue value={profileData.email} />}
                                </div>

                                {/* LOGIC SỐ ĐIỆN THOẠI */}
                                <div>
                                    <Label icon={<Phone/>} text="Số điện thoại" />
                                    {isEditing && isEmployee ? (
                                        // Nhân viên được sửa
                                        <Input name="phone" value={profileData.phone} onChange={handleChange} />
                                    ) : (
                                        // Khách hàng (hoặc không sửa) chỉ xem
                                        <DisplayValue value={profileData.phone} readOnly={true} />
                                    )}
                                    {isEditing && !isEmployee && (
                                        <p className="text-xs text-gray-400 mt-1 italic">* Số điện thoại là tài khoản, không thể thay đổi.</p>
                                    )}
                                </div>

                                <div>
                                    <Label icon={<Calendar/>} text="Ngày sinh" />
                                    {isEditing ? (
                                        <input type="date" name="date_of_birth" value={formatDateForInput(profileData.date_of_birth)} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] outline-none transition-all bg-gray-50" />
                                    ) : <DisplayValue value={formatDateDisplay(profileData.date_of_birth)} />}
                                </div>

                                <div className="md:col-span-2">
                                    <Label icon={<MapPin/>} text="Địa chỉ" />
                                    {isEditing ? <Input name="address" value={profileData.address} onChange={handleChange} /> : <DisplayValue value={profileData.address} />}
                                </div>

                                {isEmployee && (
                                    <>
                                        <div className="col-span-1 md:col-span-2 my-2 border-t border-gray-100"></div>
                                        <div className="col-span-1 md:col-span-2 mb-2">
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest bg-yellow-50 px-2 py-1 rounded">Thông tin nhân sự</span>
                                        </div>
                                        <div><Label icon={<Building/>} text="Phòng ban" /><DisplayValue value={profileData.department} readOnly={true} /></div>
                                        <div><Label icon={<Briefcase/>} text="Loại hình" /><DisplayValue value={profileData.employee_type} readOnly={true} /></div>
                                        <div><Label icon={<Calendar/>} text="Ngày vào làm" /><DisplayValue value={formatDateDisplay(profileData.start_date)} readOnly={true} /></div>
                                    </>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            {isEditing && (
                                <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all" disabled={isSaving}>Hủy</button>
                                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b38728] text-white font-bold shadow-lg hover:shadow-[#D4AF37]/40 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                        {isSaving ? <><Loader className="w-4 h-4 animate-spin"/> Đang lưu...</> : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. [MỚI] THÔNG TIN LƯƠNG (Chỉ hiển thị cho Nhân viên & Không cho sửa) */}
                        {isEmployee && (
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Banknote className="w-5 h-5 text-green-600" /> Chế độ Lương & Thưởng
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div>
                                        <Label icon={<Banknote className="text-green-600"/>} text="Lương cơ bản (Base Salary)" />
                                        <div className="w-full px-4 py-3 rounded-xl bg-green-50 text-green-800 font-bold border border-green-100">
                                            {formatCurrency(profileData.base_salary)}
                                        </div>
                                    </div>
                                    <div>
                                        <Label icon={<Percent className="text-blue-600"/>} text="Tỷ lệ Hoa hồng (Commission)" />
                                        <div className="w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-800 font-bold border border-blue-100">
                                            {(Number(profileData.commission_rate) * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* BẢNG LỊCH SỬ LƯƠNG */}
                                <div className="mt-8">
                                    <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                        <History className="w-4 h-4 text-gray-500" /> Lịch sử nhận lương
                                    </h4>
                                    
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Tháng</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Lương cứng</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Hoa hồng</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Thưởng/Phạt</th>
                                                    <th className="px-4 py-3 text-right font-bold text-gray-700">Thực nhận</th>
                                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {salaryHistory.length > 0 ? (
                                                    salaryHistory.map((s, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-gray-900 font-medium">{new Date(s.month_year).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.base_salary)}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.sales_commission)}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.bonus - s.deductions)}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(s.net_salary)}</td>
                                                            <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">Paid</span></td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400 italic">Chưa có dữ liệu lương.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---
const Label = ({ icon, text }) => (
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-2">
        {React.cloneElement(icon, { className: "w-4 h-4 text-[#D4AF37]" })}
        {text}
    </label>
);

const Input = ({ name, value, onChange }) => (
    <input type="text" name={name} value={value || ''} onChange={onChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] outline-none transition-all bg-gray-50 hover:bg-white text-gray-800" placeholder="Nhập thông tin..." />
);

const DisplayValue = ({ value, readOnly }) => (
    <div className={`w-full px-4 py-3 rounded-xl border border-transparent ${readOnly ? 'bg-yellow-50/30' : 'bg-gray-50'} text-gray-800 font-medium min-h-[48px] flex items-center`}>
        {value || <span className="text-gray-400 italic font-normal text-sm">-- Chưa cập nhật --</span>}
    </div>
);