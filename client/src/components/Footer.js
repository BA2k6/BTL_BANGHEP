import React from 'react';
import { Facebook, Phone, Mail, MapPin, CheckCircle, Send, ArrowRight } from 'lucide-react';
import ShopLogo from '../assets/shop-logo-konen.png'; 

const Footer = () => {
    // Màu vàng kim chủ đạo
    const ACCENT_CLASS = 'text-[#E2B657]';
    const HOVER_CLASS = 'hover:text-[#E2B657] transition-colors duration-300';

    return (
        <footer className="bg-[#050505] text-white pt-16 pb-8 font-sans border-t border-white/10 relative">
            
            {/* --- Decorative Top Line (Dải sáng trang trí bên trên) --- */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E2B657]/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                
                {/* --- Top Section (Grid 5 Cột) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12 border-b border-white/5 pb-12"> 
                    
                    {/* Cột 1: Logo & Slogan */}
                    <div className="lg:col-span-1 flex flex-col items-start"> 
                        <img src={ShopLogo} alt="Aura Store Branding" className="w-32 h-auto object-contain mb-6 drop-shadow-lg" />
                        <p className="text-gray-500 text-xs leading-relaxed">
                            Nâng tầm phong cách sống với những sản phẩm thời trang đẳng cấp và dịch vụ hoàn hảo.
                        </p>
                    </div>
                    
                    {/* Cột 2: Về Aura */}
                    <div>
                        <h3 className={`font-bold text-sm mb-6 uppercase tracking-[0.1em] ${ACCENT_CLASS}`}>Về Aura</h3>
                        <ul className="space-y-3 text-gray-400 text-sm font-light">
                            <li><a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}><span className="w-1 h-1 rounded-full bg-gray-600"></span> Chính sách bảo mật</a></li>
                            <li><a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}><span className="w-1 h-1 rounded-full bg-gray-600"></span> Chính sách đổi trả</a></li>
                            <li><a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}><span className="w-1 h-1 rounded-full bg-gray-600"></span> Câu hỏi thường gặp</a></li>
                            <li><a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}><span className="w-1 h-1 rounded-full bg-gray-600"></span> Tuyển dụng</a></li>
                        </ul>
                    </div>

                    {/* Cột 3: Cam Kết */}
                    <div>
                        <h3 className={`font-bold text-sm mb-6 uppercase tracking-[0.1em] ${ACCENT_CLASS}`}>Cam Kết</h3>
                        <ul className="space-y-4 text-gray-400 text-sm font-light">
                            <li className="flex items-start gap-3 group">
                                <CheckCircle size={16} className={`${ACCENT_CLASS} mt-0.5 group-hover:scale-110 transition-transform`} />
                                <span className="group-hover:text-white transition-colors">Sản phẩm chính hãng 100%</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <CheckCircle size={16} className={`${ACCENT_CLASS} mt-0.5 group-hover:scale-110 transition-transform`} />
                                <span className="group-hover:text-white transition-colors">Đổi trả trong 7 ngày</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <CheckCircle size={16} className={`${ACCENT_CLASS} mt-0.5 group-hover:scale-110 transition-transform`} />
                                <span className="group-hover:text-white transition-colors">Hoàn tiền nếu sai sót</span>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 4: Kết nối */}
                    <div>
                        <h3 className={`font-bold text-sm mb-6 uppercase tracking-[0.1em] ${ACCENT_CLASS}`}>Kết nối</h3>
                        <ul className="space-y-3 text-gray-400 text-sm font-light">
                            <li>
                                <a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}>
                                    <Send size={14} /> Khuyến mãi mới nhất
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}>
                                    <Facebook size={14} /> Fanpage chính thức
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`flex items-center gap-2 ${HOVER_CLASS}`}>
                                    <Mail size={14} /> Đăng ký nhận tin
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 5: Liên hệ nhanh */}
                    <div>
                        <h3 className={`font-bold text-sm mb-6 uppercase tracking-[0.1em] ${ACCENT_CLASS}`}>Liên hệ</h3>
                        <div className="space-y-5">
                            <a href="tel:19001880" className="group block">
                                <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors mb-1">
                                    <Phone size={16} className={ACCENT_CLASS} />
                                    <span className="text-xs uppercase tracking-wider">Hotline</span>
                                </div>
                                <span className="text-xl font-bold text-white pl-7 tracking-wide group-hover:text-[#E2B657] transition-colors">1900 1880</span>
                            </a>

                            <div className="group">
                                <div className="flex items-center gap-3 text-gray-400 mb-1">
                                    <Mail size={16} className={ACCENT_CLASS} />
                                    <span className="text-xs uppercase tracking-wider">Email</span>
                                </div>
                                <span className="text-sm text-white pl-7 font-light">support@aurastore.com</span>
                            </div>

                            <div className="group">
                                <div className="flex items-center gap-3 text-gray-400 mb-1">
                                    <MapPin size={16} className={ACCENT_CLASS} />
                                    <span className="text-xs uppercase tracking-wider">Văn phòng</span>
                                </div>
                                <span className="text-sm text-white pl-7 font-light">Hà Nội, Việt Nam</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Bottom Section: Thông tin công ty --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500">
                    
                    {/* Left Bottom */}
                    <div>
                        <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-[10px] opacity-80">CÔNG TY TNHH DỊCH VỤ EB</h4>
                        <div className="space-y-1 font-light">
                            <p>Địa chỉ: Hà Nội, Việt Nam</p>
                            <p>Mã số doanh nghiệp: 0101234567</p>
                            <div className="flex gap-4 mt-2">
                                <span>Tel: (84-08) 3995 8368</span>
                                <span>Fax: (84-08) 3995 8423</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Bottom */}
                    <div className="md:text-right flex flex-col justify-end">
                        <p className="mb-2 italic opacity-60">*Mọi giao dịch và thông tin sản phẩm đều thuộc quyền sở hữu của Aura Store.</p>
                        <p className="text-[#E2B657]/80">© {new Date().getFullYear()} Aura Store. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;