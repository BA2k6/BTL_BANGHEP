// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\SalariesScreen.js

import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Search, Plus, Edit, Trash2 } from 'lucide-react';
// Import API thật để lấy dữ liệu từ Server
// Giả định hàm getSalaries tồn tại trong api.js
import { getSalaries, calculateSalaries, paySalary, patchSalary, deleteSalary } from '../services/api'; 
import api from '../services/api';
import SalaryEditModal from '../components/SalaryEditModal';
import ActionMenu from '../components/ActionMenu';
// Import các hằng số và hàm tiện ích
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';

export const SalariesScreen = ({ userRoleName }) => {
    const [salaries, setSalaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [editingSalary, setEditingSalary] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Chỉ Owner mới có quyền chỉnh sửa/tạo bảng lương
    const canEdit = userRoleName === ROLES.OWNER.name;

    // --- LẤY DỮ LIỆU TỪ API ---
    useEffect(() => {
        const fetchSalaries = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Giả định API /api/salaries trả về danh sách bảng lương
                const data = await getSalaries(); 
                // Dữ liệu trả về: [{ salary_id: 'S1-2025-10', user_id: 'SALES1', netSalary: ...}, ...]
                setSalaries(data);
            } catch (err) {
                setError(err.message || 'Không thể tải dữ liệu bảng lương từ máy chủ.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSalaries();
    }, []); 

    const refresh = async () => {
        setIsLoading(true);
        try {
            const data = await getSalaries();
            setSalaries(data);
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu bảng lương từ máy chủ.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC TÌM KIẾM TOÀN DIỆN TRÊN CLIENT ---
    const filteredSalaries = useMemo(() => {
        if (!searchTerm) return salaries;
        const lowerCaseSearch = normalizeSearchableValue(searchTerm);

        return salaries.filter(s => {
            return Object.values(s).some(value => {
                // Đảm bảo tìm kiếm được cả số (ví dụ: 7000000)
                return normalizeSearchableValue(value).includes(lowerCaseSearch);
            });
        });
    }, [salaries, searchTerm]);

    // --- RENDER HỌC (Loading, Error) ---
    if (isLoading) {
        return <p className="p-6 text-center text-xl text-blue-600 font-semibold">Đang tải dữ liệu bảng lương từ Server...</p>;
    }
    
    if (error) {
        return <p className="p-6 text-center text-xl text-red-600 font-semibold">Lỗi: {error}</p>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Lương (Salaries)</h1>
            <p className="text-gray-500">Quyền: Owner (toàn quyền quản lý bảng lương)</p>

            <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    {/* Ô TÌM KIẾM */}
                    <div className="relative flex-grow w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tháng, tên NV, lương cơ bản, thưởng, thực nhận..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>
                    {canEdit && (
                        <button
                            onClick={async () => {
                                const month = prompt('Nhập tháng theo định dạng YYYY-MM, ví dụ 2025-12');
                                if (!month) return;
                                // Basic validation for YYYY-MM
                                const m = month.trim();
                                const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
                                if (!valid) {
                                    alert('Định dạng tháng không hợp lệ. Vui lòng nhập YYYY-MM, ví dụ 2025-12');
                                    return;
                                }
                                try {
                                    setIsLoading(true);
                                    const calcRes = await calculateSalaries(m);
                                    console.log('calculateSalaries response:', calcRes);
                                    // Always refresh from server to ensure UI shows latest data
                                    await refresh();
                                    alert('Tính lương thành công.');
                                } catch (err) {
                                    console.error('Error when calculating salaries:', err);
                                    const msg = err?.response?.data?.message || err?.message || JSON.stringify(err);
                                    alert(msg || 'Lỗi khi tính lương.');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5 mr-1" /> Tính lương mới
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên NV</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lương cơ bản</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thực nhận</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSalaries.map((s) => (
                                <tr key={s.salary_id} className="hover:bg-gray-50">
                                    {/* Giả định month_year là string 'YYYY-MM-DD' và staff_name được JOIN từ bảng Users */}
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm font-medium text-gray-900">{(function renderMonth(iso){
                                        if (!iso) return 'N/A';
                                        try {
                                            const d = new Date(iso);
                                            if (isNaN(d)) return iso.substring(0,7);
                                            const y = d.getFullYear();
                                            const m = String(d.getMonth() + 1).padStart(2, '0');
                                            return `${y}-${m}`;
                                        } catch (e) {
                                            return iso.substring(0,7);
                                        }
                                    })(s.month_year)}</td>
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm text-blue-600 font-mono">{s.user_id}</td>
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm text-gray-900">{s.staff_name || 'Đang cập nhật'}</td>
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm text-gray-900">{formatCurrency(s.base_salary)}</td>
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm font-bold text-indigo-600">{formatCurrency(s.net_salary)}</td>
                                    <td className="px-6 py-4 whitespace-normal break-words leading-relaxed text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${s.paid_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {s.paid_status === 'Paid' ? '✓ Đã trả' : '⏳ Chưa trả'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {canEdit && (
                                                <ActionMenu
                                                    buttonLabel={<span className="text-sm">⋯</span>}
                                                    items={[
                                                        {
                                                            label: 'Đánh dấu đã trả',
                                                            icon: <DollarSign className="w-4 h-4" />,
                                                            onClick: async () => {
                                                                if (!confirm(`Đánh dấu lương #${s.salary_id} là đã trả?`)) return;
                                                                try {
                                                                    setIsLoading(true);
                                                                    if (typeof paySalary === 'function') {
                                                                        await paySalary(s.salary_id);
                                                                    } else {
                                                                        await api.patch(`/salaries/${encodeURIComponent(s.salary_id)}/pay`);
                                                                    }
                                                                    await refresh();
                                                                    alert('Đã cập nhật trạng thái trả lương.');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert((err && err.message) || 'Lỗi khi cập nhật trạng thái trả lương.');
                                                                } finally {
                                                                    setIsLoading(false);
                                                                }
                                                            }
                                                        },
                                                        {
                                                            label: 'Sửa chi tiết',
                                                            icon: <Edit className="w-4 h-4" />, 
                                                            onClick: () => { setEditingSalary(s); setShowEditModal(true); }
                                                        },
                                                        {
                                                            label: 'Xóa',
                                                            danger: true,
                                                            icon: <Trash2 className="w-4 h-4" />, 
                                                            onClick: async () => {
                                                                if (!confirm(`Xác nhận xóa bảng lương #${s.salary_id}?`)) return;
                                                                try {
                                                                    setIsLoading(true);
                                                                    if (typeof deleteSalary === 'function') {
                                                                        await deleteSalary(s.salary_id);
                                                                    } else {
                                                                        await api.delete(`/salaries/${encodeURIComponent(s.salary_id)}`);
                                                                    }
                                                                    await refresh();
                                                                    alert('Đã xóa bảng lương.');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert((err && err.message) || 'Lỗi khi xóa bảng lương.');
                                                                } finally {
                                                                    setIsLoading(false);
                                                                }
                                                            }
                                                        }
                                                    ]}
                                                />
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredSalaries.length === 0 && <p className="text-center py-8 text-gray-500">Không tìm thấy bảng lương nào.</p>}
                </div>
                {/* Edit modal */}
                {showEditModal && (
                    <SalaryEditModal
                        visible={showEditModal}
                        onClose={() => { setShowEditModal(false); setEditingSalary(null); }}
                        salary={editingSalary}
                        onSaved={async () => { await refresh(); }}
                    />
                )}
            </div>
        </div>
    );
};