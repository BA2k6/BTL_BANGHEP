// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\components\StatCard.js

import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color, isNetProfit = false, netProfitValue = 0 }) => (
    <div className={`p-3 bg-white min-h-24 rounded-xl shadow-lg border-l-4 ${color} flex items-center justify-between transition duration-300 hover:shadow-xl `}>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-lg font-bold mt-1 ${isNetProfit ? (netProfitValue >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>{value}</p>
        </div>
        <Icon className={`w-7 h-7 opacity-30 ${color.replace('border-', 'text-')}`} />
    </div>
);