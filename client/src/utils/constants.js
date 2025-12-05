import {
    Home, UserCheck, Package, Users, ShoppingCart, Truck, DollarSign, Globe, Store, ShoppingBag, UserCircle
} from 'lucide-react';

export const ROLES = {
    OWNER: { id: 1, name: 'Owner', prefix: 'OWNER', description: 'Quản lý toàn bộ hệ thống' },
    CUSTOMER: { id: 2, name: 'Customer', prefix: 'CUS', description: 'Khách hàng mua sắm' },
    WAREHOUSE: { id: 3, name: 'Warehouse', prefix: 'WH', description: 'Quản lý nhập xuất, tồn kho' },
    SALES: { id: 4, name: 'Sales', prefix: 'SALES', description: 'Nhân viên bán hàng trực tiếp' },
    ONLINE_SALES: { id: 5, name: 'Online Sales', prefix: 'OS', description: 'Nhân viên xử lý đơn hàng online' },
    SHIPPER: { id: 6, name: 'Shipper', prefix: 'SHIP', description: 'Nhân viên giao hàng' },
};

export const roleToRoutes = {
    [ROLES.OWNER.name]: [
        { path: '/dashboard', name: 'Dashboard', icon: Home },
        { path: '/users', name: 'Người dùng & Tài khoản', icon: UserCheck },
        { path: '/employees', name: 'Nhân viên', icon: UserCircle },
        { path: '/products', name: 'Sản phẩm', icon: Package },
        { path: '/customers', name: 'Khách hàng', icon: Users },
        { path: '/orders', name: 'Bán hàng & Đơn hàng', icon: ShoppingCart },
        { path: '/stockin', name: 'Nhập kho', icon: Truck },
        { path: '/salaries', name: 'Quản lý Lương', icon: DollarSign },
    ],
    [ROLES.CUSTOMER.name]: [
        { path: '/shop', name: 'Mua sắm', icon: ShoppingBag },
    ],
    [ROLES.SALES.name]: [
        { path: '/users', name: 'Người dùng & Tài khoản', icon: UserCheck },
        { path: '/orders', name: 'Đơn hàng Trực tiếp', icon: Store },
        { path: '/products', name: 'Sản phẩm', icon: Package },
        { path: '/customers', name: 'Khách hàng', icon: Users },
    ],
    [ROLES.WAREHOUSE.name]: [
        { path: '/customers', name: 'Khách hàng', icon: Users },
        { path: '/products', name: 'Sản phẩm', icon: Package },

        { path: '/stockin', name: 'Nhập kho', icon: Truck },
    ],
    [ROLES.SHIPPER.name]: [
        { path: '/orders', name: 'Đơn hàng cần giao', icon: ShoppingCart },
        { path: '/customers', name: 'Khách hàng', icon: Users },
    ],
    [ROLES.ONLINE_SALES.name]: [
        { path: '/users', name: 'Người dùng & Tài khoản', icon: UserCheck },
        { path: '/orders', name: 'Đơn hàng Online', icon: Globe },
        { path: '/products', name: 'Sản phẩm', icon: Package },
        { path: '/customers', name: 'Khách hàng', icon: Users },
    ],
};