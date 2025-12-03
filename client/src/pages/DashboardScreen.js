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
            rawCategoryData.forEach(item => {
                const q = item.quarter;
                if (!quarters[q]) quarters[q] = [];
                quarters[q].push({
                    name: item.category_name,
                    value: parseFloat(item.totalRevenue),
                    color: categoryColorMap[item.category_name] || '#ccc' 
                });
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


    if (isLoading && monthlySummary.length === 0) return <p className="p-6 text-center text-blue-600">Đang tải...</p>;
    if (!stats) return null;

    const netProfit = stats.netProfit;

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* HEADER: Tiêu đề + Phụ đề thời gian */}
            <div className="flex flex-col mb-2">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                    Dashboard Tổng quan
                    {/* Một chấm xanh nhỏ thể hiện trạng thái "Live" */}
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </h1>
                
                {/* Dòng phụ đề hiển thị tháng */}
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    Cập nhật số liệu kinh doanh tháng 
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {currentMonthLabel}
                    </span>
                </p>
            </div>

            {/* 1. STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard title="Tổng Đơn hàng" value={stats.totalOrders} icon={ShoppingCart} color="border-yellow-500" />
                <StatCard title="DT Trực tiếp" value={formatCurrency(stats.directRevenue)} icon={Store} color="border-indigo-500" />
                <StatCard title="DT Online" value={formatCurrency(stats.onlineRevenue)} icon={Globe} color="border-green-500" />
                <StatCard title="Khách hoạt động" value={stats.totalCustomers} icon={Users} color="border-purple-500" />
                <StatCard title="Giá trị Tồn kho" value={formatCurrency(stats.totalInventoryValue)} icon={Package} color="border-orange-500" /> 
            </div>

            {/* 2. CẤU TRÚC LỢI NHUẬN */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Wallet className="text-gray-400" size={1} />
                        Chi tiết Tài chính Tháng {currentMonthLabel}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg hover:shadow-sm transition-all duration-300">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full shadow-sm"><DollarSign size={18} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-medium text-gray-500">Tổng Doanh thu</p><p className="font-bold text-gray-800 text-lg tracking-tight leading-tight">{formatCurrency(stats.totalRevenue)}</p></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-lg hover:shadow-sm transition-all duration-300">
                        <div className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full shadow-sm"><Users size={18} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-medium text-gray-500">Tổng Chi phí (Vốn+Lương)</p><p className="font-bold text-gray-800 text-lg tracking-tight leading-tight">{formatCurrency(stats.totalCOGS + stats.totalSalariesPaid)}</p></div>
                    </div>
                    <div className={`flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition-all duration-300 ${netProfit >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full shadow-sm ${netProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}><TrendingUp size={18} strokeWidth={2.5}/></div>
                        <div><p className="text-xs font-medium text-gray-500">Lợi nhuận Ròng</p><p className={`font-bold text-lg tracking-tight leading-tight ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p></div>
                    </div>
                </div>
            </div>
            
            {/* 3. KHỐI PHÂN TÍCH CHI TIẾT (BIỂU ĐỒ & BẢNG) */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 gap-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-1 min-w-[200px]">
                        <TrendingUp size={20} className="text-blue-600" />
                        Phân tích Kinh doanh
                    </h2>
                    <div className="flex-1 flex min-w-[200px]">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-1.5 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group">
                            <Calendar size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors mr-2" />
                            <label className="text-xs font-semibold text-gray-500 mr-2 uppercase tracking-wide">Năm:</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors">
                                {dynamicYearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 flex min-w-[100px] max-h-10">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm max-h-10">
                            <button onClick={() => setViewMode('chart')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 max-h-10 ${viewMode === 'chart' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 '}`}><BarChart2 size={16}/> Xem Biểu đồ</button>
                            <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 max-h-10 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}><Table size={16}/> Xem Bảng Chi tiết</button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {error && monthlySummary.length === 0 ? (
                        <p className="text-center text-red-500 py-20">{error}</p>
                    ) : (
                        <>
                            {viewMode === 'chart' && (
                                <div className="animate-fade-in">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button onClick={() => setChartType('bar')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'bar' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cột (Tổng quát)</button>
                                            <button onClick={() => setChartType('pie')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'pie' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tròn (Chi tiết)</button>
                                        </div>
                                        {chartType === 'pie' && (
                                            <div className="flex space-x-2 text-sm bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                                                <label className="flex items-center cursor-pointer px-3 py-1 rounded hover:bg-white hover:shadow-sm transition"><input type="radio" name="pieType" checked={pieType === 'channel'} onChange={() => setPieType('channel')} className="mr-2 cursor-pointer"/>Theo Kênh</label>
                                                <label className="flex items-center cursor-pointer px-3 py-1 rounded hover:bg-white hover:shadow-sm transition"><input type="radio" name="pieType" checked={pieType === 'category'} onChange={() => setPieType('category')} className="mr-2 cursor-pointer"/>Theo Danh Mục</label>
                                            </div>
                                        )}
                                    </div>

                                    {chartType === 'bar' && (
                                        <div style={{ width: '100%', height: 500 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                                                    <YAxis tickFormatter={(value) => (value / 1000000).toFixed(0) + 'M'} stroke="#6b7280" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                                                    <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'Direct' ? 'Trực tiếp' : 'Online']} cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px'}} />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={10}/>
                                                    <Bar dataKey="Direct" name="Trực tiếp" stackId="a" fill={CHANNEL_COLORS[0]} radius={[0, 0, 4, 4]} barSize={60} />
                                                    <Bar dataKey="Online" name="Online" stackId="a" fill={CHANNEL_COLORS[1]} radius={[4, 4, 0, 0]} barSize={60} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {chartType === 'pie' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {pieChartData.map(qData => (
                                                    <div key={qData.quarter} className="text-center p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-lg transition relative h-[320px] flex flex-col justify-center">
                                                        <h4 className="text-lg font-bold text-gray-700 mb-4">{qData.quarter}</h4>
                                                        {qData.hasData ? (
                                                            <div style={{ width: '100%', height: 220 }}>
                                                                <ResponsiveContainer>
                                                                    <PieChart>
                                                                        <Pie data={qData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={85} paddingAngle={0} labelLine={false}
                                                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                                                if (percent < 0.08) return null;
                                                                                const RADIAN = Math.PI / 180;
                                                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                                                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                                                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" style={{textShadow: '0 0 3px rgba(0,0,0,0.5)'}}>{(percent * 100).toFixed(0)}%</text>;
                                                                            }}
                                                                        >
                                                                            {qData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                                        </Pie>
                                                                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]} wrapperStyle={{ zIndex: 1000 }} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'normal', maxWidth: '200px', padding: '8px' }} />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 flex flex-col items-center justify-center text-sm"><Store size={30} className="mb-2 opacity-20"/>Không có số liệu</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-4">
                                                {globalLegendData.map((item, index) => (
                                                    <div key={index} className="flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm">
                                                        <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                                                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {viewMode === 'table' && (
                                <div className="animate-fade-in bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                                    <div className="overflow-auto max-h-[500px] custom-scrollbar rounded-t-xl">
                                        <table className="min-w-full divide-y divide-gray-200 relative">
                                            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Tháng</th>
                                                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Doanh thu</th>
                                                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Giá vốn</th>
                                                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Chi phí Lương</th>
                                                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Lợi nhuận Ròng</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                                <tr className="bg-yellow-50 font-bold border-b-2 border-yellow-200 sticky top-[52px] z-10 shadow-sm">
                                                    <td className="px-6 py-4 text-yellow-800 text-base">TỔNG NĂM {selectedYear}</td>
                                                    <td className="px-6 py-4 text-right text-blue-700 text-base">{formatCurrency(totalYearStats.revenue)}</td>
                                                    <td className="px-6 py-4 text-right text-orange-700 text-base">{formatCurrency(totalYearStats.cogs)}</td>
                                                    <td className="px-6 py-4 text-right text-red-700 text-base">{formatCurrency(totalYearStats.salaries)}</td>
                                                    <td className={`px-6 py-4 text-right text-base ${totalYearStats.netProfit > 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(totalYearStats.netProfit)}</td>
                                                </tr>
                                                {monthlySummary.filter(m => m.salesRevenue > 0).map(m => (
                                                    <tr key={m.month} className="hover:bg-blue-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-700">Tháng {m.month.substring(5)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(m.salesRevenue)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(m.totalCOGS)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(m.totalSalariesPaid)}</td>
                                                        <td className={`px-6 py-4 text-right font-bold ${m.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.netProfit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 italic text-center rounded-b-xl">
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