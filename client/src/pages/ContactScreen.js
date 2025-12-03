// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\ContactScreen.js
import React from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, User, MessageSquare } from 'lucide-react';
import Footer from '../components/Footer'; 
import NenLogin from '../assets/nen.png'; // Đảm bảo hình nền đã có

// --- COMPONENT CON: CONTACT ITEM (Được Refine lại cho nền tối) ---
const ContactItem = ({ icon: Icon, title, content }) => (
    <div className="flex items-start gap-5 group p-3 rounded-xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-[#E2B657]/20">
        {/* Icon Circle */}
        <div className="w-12 h-12 rounded-full border border-[#E2B657]/30 flex items-center justify-center text-[#E2B657] group-hover:bg-[#E2B657] group-hover:text-black transition-all duration-500 flex-shrink-0 shadow-[0_0_15px_rgba(226,182,87,0.1)] group-hover:shadow-[0_0_25px_rgba(226,182,87,0.6)] bg-black/40 backdrop-blur-sm">
            <Icon size={22} />
        </div>
        {/* Text Content */}
        <div className="pt-1">
            <div className="text-xs text-[#E2B657] uppercase tracking-[0.2em] mb-1 font-bold opacity-80 group-hover:opacity-100 transition-opacity">{title}</div>
            <div className="text-lg font-medium text-gray-100 group-hover:text-white transition-colors duration-300 drop-shadow-md">{content}</div>
        </div>
    </div>
);

// --- COMPONENT CON: FORM INPUT (Dark Luxury Style - Không dùng nền trắng nữa) ---
const FormInput = ({ label, type = "text", placeholder, icon: Icon, isTextArea = false }) => {
    const Component = isTextArea ? "textarea" : "input";
    return (
        <div className="group space-y-2">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white font-bold group-focus-within:text-[#E2B657] transition-colors duration-300">
                {Icon && <Icon size={14} />} {label}
            </label>
            <div className="relative">
                <Component 
                    type={type}
                    rows={isTextArea ? 3 : undefined}
                    className={`w-full bg-white/5 border border-white/50 rounded-lg p-3 text-white placeholder-gray-300 
                    focus:bg-black/40 focus:border-[#E2B657] focus:ring-1 focus:ring-[#E2B657] focus:shadow-[0_0_20px_rgba(226,182,87,0.1)]
                    outline-none transition-all duration-300 shadow-inner ${isTextArea ? 'resize-none' : ''}`} 
                    placeholder={placeholder} 
                />
                {/* Decoration Line: Đường kẻ vàng chạy dưới chân khi focus */}
                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#E2B657] transition-all duration-500 group-focus-within:w-full mx-auto right-0"></div>
            </div>
        </div>
    );
};

export const ContactScreen = ({ setPath }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white font-sans flex flex-col relative overflow-hidden selection:bg-[#E2B657] selection:text-black">
            
            {/* =====================================================================================
                1. BACKGROUND LAYERS (Nền + Hiệu ứng ánh sáng)
               ===================================================================================== */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src={NenLogin} alt="Contact Background" className="w-full h-full object-cover opacity-80" />
                
                {/* Lớp phủ gradient tối để làm nổi bật nội dung */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
                
                {/* Hiệu ứng Blob (Đốm sáng vàng) */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen overflow-hidden">
                    <div className="absolute top-0 -left-1/4 w-[600px] h-[600px] bg-[#E2B657]/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#E2B657]/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>
                
            </div>

            {/* =====================================================================================
                2. HEADER
               ===================================================================================== */}
            <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 transition-all duration-500 hover:bg-black/60">
                <div className="flex-1 text-center relative w-full max-w-7xl  ">
                    <button
                        onClick={() => setPath('/')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <div className="bg-white/5 p-2 rounded-full border border-white/10 group-hover:border-[#E2B657] group-hover:bg-[#E2B657]/10 transition-all">
                            <ArrowLeft className="w-5 h-5 group-hover:text-[#E2B657] transition-colors" />
                        </div>
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-white drop-shadow-md">Liên Hệ</h2>
                </div>
            </header>

            {/* =====================================================================================
                3. MAIN CONTENT
               ===================================================================================== */}
            <main className="flex-1 pt-24 pb-20 z-10 relative"> 
                <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                        {/* --- LEFT COLUMN: INFO SECTION --- */}
                        <div className="lg:col-span-7 space-y-10">
                            
                            {/* HERO TITLE BLOCK */}
{/* HERO TITLE BLOCK - ĐÃ FIX LỖI DÍNH DÒNG & RỚT CHỮ */}
{/* HERO TITLE BLOCK - FIX LỖI DÍNH DÒNG VÀ RỚT CHỮ */}
<div className="mb-8 lg:mb-10">


<h1 className="text-2xl md:text-3xl lg:text-5xl font-black uppercase tracking-widest mb-6 scale-y-110">
    {/* Container */}
    <span className="relative group block w-fit cursor-pointer select-none">
        
        {/* Lớp 1: Chữ gốc - ĐÃ SỬA: Đưa leading-normal vào đây */}
        <span className="relative z-10 block bg-clip-text text-transparent bg-gradient-to-b from-[#e4d9b4] via-[#e5c24f] to-[#886600] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] pb-3 leading-tight">
            TƯ VẤN VÀ <br /> HỖ TRỢ KHÁCH HÀNG
        </span>

        {/* Lớp 2: Hiệu ứng quét sáng - ĐÃ SỬA: Đưa leading-normal vào đây để khớp với lớp 1 */}
        <span className="absolute inset-0 z-20 block bg-clip-text text-transparent bg-gradient-to-r from-transparent via-white/90 to-transparent bg-no-repeat bg-[length:200%_100%] bg-[position:-100%_0] group-hover:bg-[position:200%_0] transition-[background-position] duration-700 ease-in-out pb-2 leading-tight" aria-hidden="true">
            TƯ VẤN VÀ <br /> HỖ TRỢ KHÁCH HÀNG
        </span>
        
    </span>
</h1>
    <p className="text-gray-300 text-sm md:text-base lg:text-lg font-light leading-relaxed border-l-4 border-[#E2B657] pl-6 max-w-xl bg-gradient-to-r from-white/5 to-transparent py-4 pr-4 rounded-r-xl">
        Chúng tôi luôn sẵn lòng giải đáp mọi thắc mắc của bạn về sản phẩm, dịch vụ. Đội ngũ Aura Store cam kết phản hồi trong thời gian sớm nhất với sự tận tâm tuyệt đối.
    </p>
</div>

                            {/* CONTACT ITEMS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pt-4">
                                <ContactItem icon={Phone} title="Hotline" content="1900 888 888" />
                                <ContactItem icon={Mail} title="Email" content="support@aura.com" />
                                <ContactItem icon={MapPin} title="Showroom" content="Hà Nội, Việt Nam" />
                                <ContactItem icon={Clock} title="Giờ mở cửa" content="09:00 - 22:00" />
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: FORM SECTION (DARK GLASS - THAY VÌ NỀN TRẮNG CŨ) --- */}
                        <div className="lg:col-span-5 relative group mt-4 lg:mt-0">
                            
                            {/* Hiệu ứng hào quang sau lưng form */}
                            <div className="absolute inset-0 bg-[#E2B657] rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-70 0"></div>
                            
                            <div className="relative bg-black/60 backdrop-blur-xl border border-white rounded-2xl p-4 md:p-8 shadow-3xl transition-transform duration-500 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(226,182,87,0.4)]">
                                
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                                    <span className="w-10 h-10 rounded-full bg-[#E2B657]/10 flex items-center justify-center text-[#E2B657] border border-[#E2B657]/20">
                                        <Send size={20} /> 
                                    </span>
                                    ĐỂ LẠI LỜI NHẮN
                                </h2>
                                
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <FormInput label="Họ tên" icon={User} placeholder="Nhập tên của bạn" />
                                    <FormInput label="Email" type="email" icon={Mail} placeholder="example@email.com" />
                                    <FormInput label="Lời nhắn" isTextArea icon={MessageSquare} placeholder="Bạn cần hỗ trợ gì?" />

                                    {/* --- BUTTON GỬI (LUXURY STYLE) --- */}
                                    <div className="relative mt-8 group/btn cursor-pointer">
                                        {/* Hào quang nút */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#E2B657] to-[#FDB931] rounded-lg blur opacity-40 group-hover/btn:opacity-80 transition duration-500"></div>
                                        
                                        <button className="relative w-full bg-gradient-to-r from-[#E2B657] to-[#d4a037] text-black font-extrabold uppercase tracking-widest py-4 rounded-lg shadow-[0_0_20px_rgba(226,182,87,0.4)] overflow-hidden active:scale-[0.98] transition-all hover:shadow-[0_0_30px_rgba(226,182,87,0.6)]">
                                            
                                            {/* Shine Sweep Effect */}
                                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]"></div>
                                            
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                 <Send size={18} className="group-hover/btn:translate-x-1 transition-transform" />GỬI NGAY
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Copyright Line */}
                <div className="absolute bottom-4 w-full text-center text-[10px] text-gray-500 uppercase tracking-widest opacity-60">
                    © {new Date().getFullYear()} Aura Store. Luxury Fashion.
                </div>
            </main>

            {/* =====================================================================================
                4. FOOTER (NỀN ĐEN ĐẶC - ĐỒNG BỘ)
               ===================================================================================== */}
            <div className="relative z-50 bg-[#050505] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
                <Footer /> 
            </div>
            
            {/* CSS Animation */}
            <style>{`
                @keyframes shimmer {
                    100% { left: 100%; }
                }
            `}</style>
        </div>
    );
};