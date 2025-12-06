import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         PieChart, Pie, Cell 
} from 'recharts';
import { ShoppingCart, Store, Globe, Users, TrendingUp, Wallet, Package, DollarSign, Calendar, Table, BarChart2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { formatCurrency } from '../utils/helpers';
import { getMonthlySummaryData, getDashboardCurrentStats } from '../services/api'; 

const generateYearOptions = (startYear) => {
    const currentYear = new Date().getFullYear();
    const safeStartYear = startYear || 2020; 
    const years = [];
    for (let y = currentYear; y >= safeStartYear; y--) {
        years.push(y);
    }
    return years;
};

const CHANNEL_COLORS = ['#3b82f6', '#10b981']; 
const CATEGORY_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#2E8B57', '#E91E63', '#3F51B5', '#CDDC39', 
    '#795548', '#607D8B', '#FF0000', '#00008B', '#008080', '#D2691E', '#C71585', '#FFD700', '#00FF00', '#DC143C'
];

export const DashboardScreen = () => {
    const [monthlySummary, setMonthlySummary] = useState([]); 
    const [rawCategoryData, setRawCategoryData] = useState([]); 
    const [stats, setStats] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dynamicYearOptions, setDynamicYearOptions] = useState([new Date().getFullYear()]);
    
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('chart'); 
    const [chartType, setChartType] = useState('bar'); 
    const [pieType, setPieType] = useState('channel'); 
    
    const [currentMonthLabel, setCurrentMonthLabel] = useState('');
    
    useEffect(() => {
        const fetchCurrentStats = async () => {
            try {
                const currentStats = await getDashboardCurrentStats(); 
                setStats(currentStats);
                
                if (currentStats.earliestYear) {
                    setDynamicYearOptions(generateYearOptions(currentStats.earliestYear));
                }

                const today = new Date();
                setCurrentMonthLabel(`${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`);
            } catch (err) { console.error(err); }
        };
        fetchCurrentStats();
    }, []); 

    useEffect(() => {
        const fetchMonthlySummary = async () => {
            setIsLoading(true);
            setError(null);
            setMonthlySummary([]); 
            setRawCategoryData([]);
            
            try {
                const response = await getMonthlySummaryData(selectedYear); 
                let summaryData = [];
                let catData = [];

                if (response.summary) {
                    summaryData = response.summary;
                    catData = response.categoryData || [];
                } else if (Array.isArray(response)) {
                    summaryData = response;
                }
                
                if (summaryData.length === 0) {
                    setError(`Không có giao dịch hoàn thành nào trong năm ${selectedYear}.`);
                    return;
                }
                setMonthlySummary(summaryData); 
                setRawCategoryData(catData); 
            } catch (err) {
                setError(err.message || 'Không thể tải dữ liệu.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMonthlySummary();
    }, [selectedYear]); 

    const totalYearStats = useMemo(() => {
        return monthlySummary.reduce((acc, curr) => {
            return {
                revenue: acc.revenue + (parseFloat(curr.salesRevenue) || 0),
                cogs: acc.cogs + (parseFloat(curr.totalCOGS) || 0),
                salaries: acc.salaries + (parseFloat(curr.totalSalariesPaid) || 0),
                netProfit: acc.netProfit + (parseFloat(curr.netProfit) || 0)
            };
        }, { revenue: 0, cogs: 0, salaries: 0, netProfit: 0 });
    }, [monthlySummary]);

    const salesChartData = useMemo(() => {
        return monthlySummary.map(m => ({
            name: `Tháng ${m.month.substring(5)}`, 
            DoanhThu: m.salesRevenue,
            Direct: m.directRevenue,
            Online: m.onlineRevenue,
        }));
    }, [monthlySummary]);

    const categoryColorMap = useMemo(() => {
        const map = {};
        const uniqueCategories = [...new Set(rawCategoryData.map(item => item.category_name))];
        uniqueCategories.forEach((cat, index) => {
            map[cat] = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
        });
        return map;
    }, [rawCategoryData]);

    // --- LOGIC GỘP DANH MỤC NHỎ ---
    const pieChartData = useMemo(() => {
        const quarters = { 1: [], 2: [], 3: [], 4: [] };

        if (pieType === 'channel') {
            monthlySummary.forEach(m => {
                const month = parseInt(m.month.substring(5)); 
                const quarter = Math.ceil(month / 3);
                if (quarters[quarter].length === 0) {
                    quarters[quarter] = [
                        { name: 'Trực tiếp', value: 0, color: CHANNEL_COLORS[0] },
                        { name: 'Online', value: 0, color: CHANNEL_COLORS[1] }
                    ];
                }
                quarters[quarter][0].value += parseFloat(m.directRevenue) || 0;
                quarters[quarter][1].value += parseFloat(m.onlineRevenue) || 0;
            });
        } else {
            // Logic cho danh mục
            rawCategoryData.forEach(item => {
                const q = item.quarter;
                if (!quarters[q]) quarters[q] = [];
                quarters[q].push({
                    name: item.category_name,
                    value: parseFloat(item.totalRevenue),
                    color: categoryColorMap[item.category_name] || '#ccc' 
                });
            });

            // GỘP NHÓM "KHÁC" VÀ SẮP XẾP
            [1, 2, 3, 4].forEach(q => {
                const data = quarters[q];
                if (data && data.length > 0) {
                    const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);
                    const threshold = totalRevenue * 0.05; // Ngưỡng 5%

                    const bigItems = [];
                    let otherValue = 0;

                    data.forEach(item => {
                        if (item.value >= threshold) {
                            bigItems.push(item);
                        } else {
                            otherValue += item.value;
                        }
                    });

                    // Sắp xếp các mục lớn giảm dần
                    bigItems.sort((a, b) => b.value - a.value);

                    // Nếu có mục nhỏ, thêm vào nhóm "Khác"
                    if (otherValue > 0) {
                        bigItems.push({
                            name: 'Khác',
                            value: otherValue,
                            color: '#9ca3af' // Màu xám cho nhóm Khác
                        });
                    }
                    quarters[q] = bigItems;
                }
            });
        }

        return [1, 2, 3, 4].map(q => ({
            quarter: `Quý ${q}`,
            hasData: quarters[q] && quarters[q].some(i => i.value > 0),
            data: quarters[q] || []
        }));

    }, [monthlySummary, rawCategoryData, pieType, categoryColorMap]);

    const globalLegendData = useMemo(() => {
        if (pieType === 'channel') {
            return [
                { name: 'Trực tiếp', color: CHANNEL_COLORS[0] },
                { name: 'Online', color: CHANNEL_COLORS[1] }
            ];
        } else {
            return Object.keys(categoryColorMap).map(catName => ({
                name: catName,
                color: categoryColorMap[catName]
            }));
        }
    }, [pieType, categoryColorMap]);


    if (isLoading && monthlySummary.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#D4AF37] font-bold animate-pulse">Đang tải dữ liệu Aura...</div>;
    if (!stats) return null;

    const netProfit = stats.netProfit;

    // --- STYLE CONSTANTS ---
    const CARD_STYLE = "bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#D4AF37]/30 transition-all duration-300 relative overflow-hidden";
    const GOLD_GRADIENT_TEXT = "text-transparent bg-clip-text bg-gradient-to-r from-[#b88a00] via-[#D4AF37] to-[#b88a00]";
    const BUTTON_PRIMARY = "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-black font-bold shadow-sm hover:shadow-md hover:scale-[1.02]";

    return (
        <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
             <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0"></div>

            {/* HEADER */}
            <div className="flex flex-col mb-4 relative z-10">
                <h1 className={`text-3xl h-10 font-black  tracking-[0.2em] flex items-center gap-3 `}>
                    Dashboard Tổng quan
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3f9e00] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#02b328]"></span>
                    </span>
                </h1>
                
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2 font-medium mb-5">
                    Số liệu kinh doanh tháng 
                    <span className="font-bold text-[#b88a00] bg-[#D4AF37]/10 px-3 py-0.5 rounded border border-[#D4AF37]/20">
                        {currentMonthLabel}
                    </span>
                </p>
            </div>

            {/* 1. STAT CARDS */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard title="Tổng Đơn hàng" value={stats.totalOrders} icon={ShoppingCart} color="border-yellow-500" />
                <StatCard title="DT Trực tiếp" value={formatCurrency(stats.directRevenue)} icon={Store} color="border-indigo-500" />
                <StatCard title="DT Online" value={formatCurrency(stats.onlineRevenue)} icon={Globe} color="border-green-500" />
                <StatCard title="Khách hoạt động" value={stats.totalCustomers} icon={Users} color="border-purple-500" />
                <StatCard title="Giá trị Tồn kho" value={formatCurrency(stats.totalInventoryValue)} icon={Package} color="border-orange-500" /> 
            </div>

            {/* 2. CẤU TRÚC LỢI NHUẬN */}
            <div className={`${CARD_STYLE} p-6`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-5 relative z-10">
                    <h3 className="text-sm font-bold text-[#b88a00] uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="text-[#D4AF37]" size={18} />
                        Chi tiết Tài chính
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:border-blue-300 transition-all duration-300 shadow-sm">
                        <div className="w-10 h-10 flex items-center justify-center bg-white text-blue-600 rounded-full shadow-sm"><DollarSign size={20} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng Doanh thu</p><p className="font-black text-gray-800 text-xl tracking-tight mt-1">{formatCurrency(stats.totalRevenue)}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl hover:border-red-300 transition-all duration-300 shadow-sm">
                        <div className="w-10 h-10 flex items-center justify-center bg-white text-red-600 rounded-full shadow-sm"><Users size={20} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng Chi phí</p><p className="font-black text-gray-800 text-xl tracking-tight mt-1">{formatCurrency(stats.totalCOGS + stats.totalSalariesPaid)}</p></div>
                    </div>
                    <div className={`flex items-center gap-4 p-4 border rounded-xl transition-all duration-300 shadow-sm ${netProfit >= 0 ? 'bg-green-50 border-green-100 hover:border-green-300' : 'bg-orange-50 border-orange-100 hover:border-orange-300'}`}>
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm ${netProfit >= 0 ? 'bg-white text-green-600' : 'bg-white text-orange-600'}`}><TrendingUp size={20} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lợi nhuận Ròng</p><p className={`font-black text-xl tracking-tight mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p></div>
                    </div>
                </div>
            </div>
            
            {/* 3. KHỐI PHÂN TÍCH CHI TIẾT (BIỂU ĐỒ & BẢNG) */}
            <div className={`${CARD_STYLE} flex flex-col`}>
                
                {/* TOOLBAR */}
                <div className="flex flex-wrap items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-md gap-4 relative z-20">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-1 min-w-[200px]">
                        <TrendingUp size={20} className="text-[#D4AF37]" />
                        PHÂN TÍCH KINH DOANH
                    </h2>
                    
                    <div className="flex-1 flex justify-end gap-3 min-w-[200px]">
                        {/* Năm Select */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm hover:border-[#D4AF37] transition-colors">
                            <Calendar size={16} className="text-[#D4AF37] mr-2" />
                            <label className="text-xs font-bold text-gray-500 mr-2 uppercase">Năm:</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-[#D4AF37] transition-colors">
                                {dynamicYearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            <button onClick={() => setViewMode('chart')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase ${viewMode === 'chart' ? BUTTON_PRIMARY : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}><BarChart2 size={14}/> Biểu đồ</button>
                            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase ${viewMode === 'table' ? BUTTON_PRIMARY : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}><Table size={14}/> Bảng</button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {error && monthlySummary.length === 0 ? (
                        <p className="text-center text-red-500 py-20 font-medium">{error}</p>
                    ) : (
                        <>
                            {viewMode === 'chart' && (
                                <div className="animate-fade-in">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                                            <button onClick={() => setChartType('bar')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${chartType === 'bar' ? 'bg-white text-[#b88a00] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Cột (Tổng quát)</button>
                                            <button onClick={() => setChartType('pie')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${chartType === 'pie' ? 'bg-white text-[#b88a00] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Tròn (Chi tiết)</button>
                                        </div>
                                        {chartType === 'pie' && (
                                            <div className="flex space-x-2 text-sm bg-blue-50 p-1.5 rounded-lg border border-blue-100 text-blue-800 font-medium">
                                                <label className="flex items-center cursor-pointer px-3 py-1 rounded hover:bg-white transition"><input type="radio" name="pieType" checked={pieType === 'channel'} onChange={() => setPieType('channel')} className="mr-2 accent-[#D4AF37]"/>Kênh</label>
                                                <label className="flex items-center cursor-pointer px-3 py-1 rounded hover:bg-white transition"><input type="radio" name="pieType" checked={pieType === 'category'} onChange={() => setPieType('category')} className="mr-2 accent-[#D4AF37]"/>Danh Mục</label>
                                            </div>
                                        )}
                                    </div>

                                    {chartType === 'bar' && (
                                        <div style={{ width: '100%', height: 500 }} className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={CHANNEL_COLORS[0]} stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor={CHANNEL_COLORS[0]} stopOpacity={0.2}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={CHANNEL_COLORS[1]} stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor={CHANNEL_COLORS[1]} stopOpacity={0.2}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} />
                                                    <YAxis tickFormatter={(value) => (value / 1000000).toFixed(0) + 'M'} stroke="#9ca3af" tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} />
                                                    
                                                    {/* ĐÃ SỬA TOOLTIP TẠI ĐÂY */}
                                                    <Tooltip 
                                                        formatter={(value, name) => [formatCurrency(value), name]} 
                                                        cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                                                        contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1f2937', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px'}}
                                                        itemStyle={{color: '#1f2937', fontWeight: 600}}
                                                        labelStyle={{color: '#6b7280', fontWeight: 600, marginBottom: '8px'}}
                                                    />

                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-gray-700 font-medium">{value}</span>}/>
                                                    <Bar dataKey="Direct" name="Trực tiếp" stackId="a" fill="url(#colorDirect)" stroke={CHANNEL_COLORS[0]} radius={[0, 0, 0, 0]} barSize={50} animationDuration={500} />
                                                    <Bar dataKey="Online" name="Online" stackId="a" fill="url(#colorOnline)" stroke={CHANNEL_COLORS[1]} radius={[4, 4, 0, 0]} barSize={50} animationDuration={500} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {chartType === 'pie' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {pieChartData.map(qData => (
                                                    <div key={qData.quarter} className="text-center p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-[#D4AF37]/30 transition relative h-[320px] flex flex-col justify-center group">
                                                        <h4 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-widest">{qData.quarter}</h4>
                                                        {qData.hasData ? (
                                                            <div style={{ width: '100%', height: 220 }}>
                                                                <ResponsiveContainer>
                                                                    <PieChart>
                                                                        <Pie 
                                                                            data={qData.data} 
                                                                            dataKey="value" 
                                                                            nameKey="name" 
                                                                            cx="50%" 
                                                                            cy="50%" 
                                                                            animationDuration={500}
                                                                            
                                                                            outerRadius={80} 
                                                                            paddingAngle={0} 
                                                                            labelLine={false}
                                                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                                                // Hiện label nếu > 0%
                                                                                if (percent <= 0) return null;
                                                                                
                                                                                const RADIAN = Math.PI / 180;
                                                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                                                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                                                
                                                                                return (
                                                                                    <text 
                                                                                        x={x} y={y} 
                                                                                        fill="white" 
                                                                                        textAnchor="middle" 
                                                                                        dominantBaseline="central" 
                                                                                        fontSize={10}
                                                                                        fontWeight="bold" 
                                                                                        style={{textShadow: '0 1px 2px rgba(0,0,0,0.6)'}}
                                                                                    >
                                                                                        {(percent * 100).toFixed(0)}%
                                                                                    </text>
                                                                                );
                                                                            }}
                                                                        >
                                                                            {/* ĐÃ SỬA: stroke="none" để bỏ viền trắng */}
                                                                            {qData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                                        </Pie>
                                                                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]} wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: '#374151' }} itemStyle={{ color: '#374151', fontWeight: 600 }} />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 flex flex-col items-center justify-center text-sm font-medium"><Store size={30} className="mb-2 opacity-30"/>Chưa có dữ liệu</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-4">
                                                {/* Thêm chú thích cho "Khác" nếu có */}
                                                <div className="flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 shadow-sm">
                                                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: '#9ca3af'}}></span>
                                                        <span className="text-xs font-bold text-gray-700">Khác (nhỏ hơn 5%)</span>
                                                </div>
                                                {globalLegendData.map((item, index) => (
                                                    <div key={index} className="flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 shadow-sm">
                                                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                                                        <span className="text-xs font-bold text-gray-700">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {viewMode === 'table' && (
                                <div className="animate-fade-in bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="overflow-auto max-h-[500px] custom-scrollbar">
                                        <table className="min-w-full divide-y divide-gray-200 relative">
                                            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tháng</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Doanh thu</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Giá vốn</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Chi phí Lương</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-[#b88a00] uppercase tracking-wider">Lợi nhuận Ròng</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100 text-sm">
                                                <tr className="bg-yellow-50/80 font-bold border-b border-yellow-200 sticky top-[52px] z-10 shadow-sm backdrop-blur-sm">
                                                    <td className="px-6 py-4 text-yellow-800 text-base">TỔNG NĂM {selectedYear}</td>
                                                    <td className="px-6 py-4 text-right text-blue-700 text-base">{formatCurrency(totalYearStats.revenue)}</td>
                                                    <td className="px-6 py-4 text-right text-orange-700 text-base">{formatCurrency(totalYearStats.cogs)}</td>
                                                    <td className="px-6 py-4 text-right text-red-700 text-base">{formatCurrency(totalYearStats.salaries)}</td>
                                                    <td className={`px-6 py-4 text-right text-base ${totalYearStats.netProfit > 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(totalYearStats.netProfit)}</td>
                                                </tr>
                                                {monthlySummary.filter(m => m.salesRevenue > 0).map(m => (
                                                    <tr key={m.month} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-6 py-4 font-bold text-gray-800">Tháng {m.month.substring(5)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-900 font-medium">{formatCurrency(m.salesRevenue)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(m.totalCOGS)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(m.totalSalariesPaid)}</td>
                                                        <td className={`px-6 py-4 text-right font-black ${m.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.netProfit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 italic text-center font-medium">
                                        * Số liệu được tính toán dựa trên các đơn hàng có trạng thái "Hoàn Thành" và phiếu lương "Đã thanh toán".
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};