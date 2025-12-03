// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\AboutScreen.js
import React from 'react';
import { ArrowLeft, Target, Users, Gem } from 'lucide-react'; // Đã lược bớt icon không dùng để code gọn hơn
import Footer from '../components/Footer'; 
import ABOUT_IMAGE from '../assets/about.png';
import NenLogin from '../assets/nen.png'; // IMPORT HÌNH NỀN DÙNG CHUNG VỚI CONTACT

export const AboutScreen = ({ setPath }) => {
    return (
        <div className="min-h-screen w-full bg-transparent text-white font-sans selection:bg-[#E2B657] selection:text-black flex flex-col relative overflow-hidden">
            
            {/* =====================================================================================
                1. BACKGROUND LAYERS (ĐỒNG BỘ VỚI CONTACT SCREEN)
               ===================================================================================== */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Hình nền gốc */}
                <img 
                    src={NenLogin} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-80"
                />
                
                {/* Hiệu ứng Blob (Đốm sáng) màu vàng */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E2B657]/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#E2B657]/20 rounded-full blur-[120px] animate-pulse delay-500"></div>
                </div>
                
                {/* Noise texture overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            </div>

            {/* =====================================================================================
                2. HEADER
               ===================================================================================== */}
            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/10 transition-all duration-300">
                <button
                    onClick={() => setPath('/')}
                    className="absolute left-8 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="bg-white/5 p-2 rounded-full border border-white/10 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:text-[#E2B657] transition-colors" />
                    </div>
                </button>
                <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white drop-shadow-md">Về chúng tôi</h2>
                </div>
            </header>

            {/* =====================================================================================
                3. MAIN CONTENT
               ===================================================================================== */}
            <main className="relative z-10 flex-1 pt-24 pb-10 px-4 md:px-8">
                
                {/* HERO TEXT SECTION */}
                <div className="flex flex-col items-center text-center mb-16">
                    <span className="text-[#E2B657] font-medium tracking-[0.2em] uppercase mb-4 animate-fade-in-up drop-shadow-lg">Câu chuyện thương hiệu</span>
                    
                    {/* Giữ nguyên hiệu ứng chữ Aura Store đẹp mắt của bạn */}
                    <h1 className="text-5xl md:text-7xl lg:text-7xl font-black uppercase tracking-widest mb-6 scale-y-110">
                        <span className="relative group block w-fit mx-auto cursor-pointer select-none">
                            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-[#e4d9b4] via-[#e5c24f] to-[#886600] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                                Aura Store
                            </span>
                            <span className="absolute inset-0 z-20 bg-clip-text text-transparent bg-gradient-to-r from-transparent via-white/90 to-transparent bg-no-repeat bg-[length:200%_100%] bg-[position:-100%_0] group-hover:bg-[position:200%_0] transition-[background-position] duration-700 ease-in-out" aria-hidden="true">
                                Aura Store
                            </span>
                        </span>
                    </h1>

                    <p className="max-w-3xl text-gray-200 text-lg md:text-xl leading-relaxed font-light drop-shadow-md bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        Không chỉ là nơi mua sắm, Aura Store là biểu tượng của phong cách sống thượng lưu. Chúng tôi kết hợp giữa thời trang đẳng cấp và công nghệ quản lý hiện đại.
                    </p>
                </div>

                {/* GLASS CONTAINER FOR CONTENT (Đóng khung kính mờ giống bên Contact) */}
                <div className="max-w-7xl mx-auto bg-black/60 backdrop-blur-md rounded-2xl border border-[#E2B657]/20 shadow-2xl overflow-hidden">
                    
                    <div className="relative p-6 md:p-12">
                        {/* --- CONTENT GRID --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
                            
                            {/* Image Side */}
                            <div className="relative group perspective-1000">
                                <div className="absolute inset-0 bg-[#E2B657] rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <img 
                                    src={ABOUT_IMAGE} 
                                    alt="About Aura" 
                                    className="relative z-10 w-full h-[450px] object-cover rounded-lg shadow-2xl border border-white/10 transform transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </div>

                            {/* Text Side */}
                            <div className="space-y-6">
                                <FeatureBlock 
                                    icon={Target} 
                                    title="Sứ mệnh" 
                                    desc="Mang đến những sản phẩm thời trang chất lượng cao nhất, tôn vinh vẻ đẹp và cá tính riêng biệt của từng khách hàng."
                                />
                                <FeatureBlock 
                                    icon={Gem} 
                                    title="Giá trị cốt lõi" 
                                    desc="Sang trọng - Tận tâm - Đổi mới. Chúng tôi không ngừng hoàn thiện hệ thống để phục vụ bạn tốt hơn mỗi ngày."
                                />
                                <FeatureBlock 
                                    icon={Users} 
                                    title="Đội ngũ" 
                                    desc="Được vận hành bởi những chuyên gia đam mê thời trang và đội ngũ kỹ thuật viên hàng đầu."
                                />
                            </div>
                        </div>

                        {/* --- STATS SECTION (Inside Glass Card) --- */}
                        <div className="border-t border-white/10 pt-12">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
                                <StatNumber num="2024" label="Thành lập" />
                                <StatNumber num="10K+" label="Khách hàng" />
                                <StatNumber num="100%" label="Chính hãng" />
                                <StatNumber num="24/7" label="Hỗ trợ" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright Line */}
                <div className="pt-10 text-center text-xs text-gray-400 opacity-70">
                    © {new Date().getFullYear()} Aura Store. All Rights Reserved.
                </div>
            </main>

            {/* =====================================================================================
                4. FOOTER (NỀN ĐEN ĐẶC GIỐNG CONTACT)
               ===================================================================================== */}
            <div className="relative z-50 bg-[#050505] border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,1)]">
                <Footer /> 
            </div>
        </div>
    );
};

// Component con cho các khối tính năng
const FeatureBlock = ({ icon: Icon, title, desc }) => (
   <div className="flex gap-5 p-5 rounded-xl transition-all duration-300 
           bg-white/5 border border-white/5
           hover:border-[#E2B657]/50 
           hover:shadow-[0_0_20px_rgba(226,182,87,0.15)] 
           hover:bg-white/10 group">

        <div className="mt-1">
            <div className="w-12 h-12 rounded-full bg-[#E2B657]/10 border border-[#E2B657]/20 flex items-center justify-center text-[#E2B657] group-hover:bg-[#E2B657] group-hover:text-black transition-all duration-300">
                <Icon size={22} />
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide group-hover:text-[#E2B657] transition-colors">{title}</h3>
            <p className="text-gray-300 leading-relaxed font-light">{desc}</p>
        </div>
    </div>
);

// Component con cho số liệu
const StatNumber = ({ num, label }) => (
    <div className="flex flex-col items-center group">
        <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E2B657] to-[#886600] mb-3 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{num}</div>
        <div className="text-xs md:text-sm text-gray-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</div>
    </div>
);