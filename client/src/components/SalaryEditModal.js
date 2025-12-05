import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { patchSalary } from '../services/api';

const SalaryEditModal = ({ visible, onClose, salary, onSaved }) => {
    const [form, setForm] = useState({ bonus: 0, deductions: 0, sales_commission: 0, base_salary: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (salary) {
            setForm({
                bonus: salary.bonus || 0,
                deductions: salary.deductions || 0,
                sales_commission: salary.sales_commission || 0,
                base_salary: salary.base_salary || 0
            });
        }
    }, [salary]);

    if (!visible) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        // allow numeric values
        setForm(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!salary || !salary.salary_id) return;
        setSaving(true);
        try {
            const payload = {
                bonus: Number(form.bonus) || 0,
                deductions: Number(form.deductions) || 0,
                sales_commission: Number(form.sales_commission) || 0
            };
            await patchSalary(salary.salary_id, payload);
            if (onSaved) onSaved();
            onClose();
        } catch (err) {
            console.error('Lỗi khi lưu bảng lương:', err);
            alert(err.message || 'Lỗi khi lưu bảng lương');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sửa bảng lương: {salary && salary.salary_id}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700">Lương cơ bản</label>
                        <input type="number" name="base_salary" value={form.base_salary} onChange={handleChange} className="w-full mt-1 p-2 border rounded" readOnly />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Hoa hồng</label>
                        <input type="number" name="sales_commission" value={form.sales_commission} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700">Thưởng</label>
                            <input type="number" name="bonus" value={form.bonus} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700">Khấu trừ</label>
                            <input type="number" name="deductions" value={form.deductions} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{saving ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalaryEditModal;