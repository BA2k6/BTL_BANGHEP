import React, { useState, useEffect, useMemo } from 'react';

// Import các màn hình và component
import { ROLES, roleToRoutes } from './utils/constants';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';

import { LoginScreen } from './pages/LoginScreen'; 
import { GatewayScreen } from './pages/GatewayScreen'; 
import { DashboardScreen } from './pages/DashboardScreen';
import { ProductsScreen } from './pages/ProductsScreen';
import { CustomersScreen } from './pages/CustomersScreen';
import { OrdersScreen } from './pages/OrdersScreen';
import StockInScreen from './pages/StockInScreen';
import { UsersScreen } from './pages/UsersScreen';
import { EmployeesScreen } from './pages/EmployeesScreen'; 
import { SalariesScreen } from './pages/SalariesScreen';
import { ChangePasswordScreen } from './pages/ChangePasswordScreen';
import { ResetPasswordScreen } from './pages/ResetPasswordScreen';
import { ShopScreen } from './pages/ShopScreen';
import { AboutScreen } from './pages/AboutScreen';
import { ContactScreen } from './pages/ContactScreen';
import ProductDetail from "./pages/ProductDetail";
import { ProfileScreen } from './pages/ProfileScreen';
// Component Chứa Nội dung chính
const AppContent = ({ path, setPath, currentUser, userRoleName, onRefreshUser,refreshKey }) => {
    
    const isAuthorized = useMemo(() => {
        // --- 2. CẬP NHẬT: Thêm /about và /contact vào danh sách cho phép ---
        const publicRoutes = ['/shop', '/publicshop', '/login', '/', '/change-password', '/about', '/contact','/profile'];
        
        if (publicRoutes.includes(path)) return true;
        if (userRoleName === ROLES.OWNER.name) return true;
        
        const allowedRoutes = roleToRoutes[userRoleName];
        if (!allowedRoutes) return false; 
        
        const isAllowed = allowedRoutes.some(route => route.path === path || route.path === '/profile');
        if (isAllowed) return true;
        
        return path === '/unauthorized'; 
    }, [path, userRoleName]);

    useEffect(() => {
        if (userRoleName === 'Customer' && path !== '/shop' && path !== '/profile' && path !== '/change-password') {
            setPath('/shop'); return;
        }
        if (userRoleName && !isAuthorized && path !== '/unauthorized') {
            setPath('/unauthorized');
        }
    }, [isAuthorized, userRoleName, path, setPath]);
    

    switch (path) {
        case '/dashboard': return <DashboardScreen />;
        case '/products': return <ProductsScreen userRoleName={userRoleName} />;
        case '/customers': return <CustomersScreen key={refreshKey} userRoleName={userRoleName} />;
        case '/orders': return <OrdersScreen currentUserId={currentUser?.id} userRoleName={userRoleName} />;
        case '/stockin': return <StockInScreen userRoleName={userRoleName} />;
        case '/users': return <UsersScreen key={refreshKey} currentUser={currentUser} />;
        case '/employees': return <EmployeesScreen key={refreshKey} />; 
        case '/salaries': return <SalariesScreen userRoleName={userRoleName} />;
        
        case '/unauthorized': return <UnauthorizedScreen setPath={setPath} />;
        case '/about': return <AboutScreen setPath={setPath} />;
        case '/contact': return <ContactScreen setPath={setPath} />;
        case '/profile': 
            return <ProfileScreen currentUser={currentUser} setPath={setPath} onRefreshUser={onRefreshUser} />;

        default: return null;
    }
};

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRoleName, setUserRoleName] = useState(null);
    const [path, setPath] = useState('/'); 
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- LOGIC MỚI: XÓA SẠCH PHIÊN ĐĂNG NHẬP KHI F5 / KHỞI ĐỘNG LẠI ---
    useEffect(() => {
        console.log("App Started: Clearing all session data...");
        
        // 1. Xóa sạch LocalStorage
        localStorage.clear(); 
        
        // 2. Reset toàn bộ State về mặc định (Chưa đăng nhập)
        setIsLoggedIn(false);
        setUserRoleName(null);
        setCurrentUser(null);
        
        // 3. Đưa về trang chủ (Gateway)
        setPath('/'); 
        
        setIsCheckingAuth(false);
    }, []); 

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setUserRoleName(null);
        setCurrentUser(null);
        setPath('/login'); 
    };

    const setUser = (user) => {
        const normalizedUser = {
            ...user,
            id: user.userId || user.id, 
            fullName: user.fullName || user.username || "User" 
        };

        setCurrentUser(normalizedUser);
        setUserRoleName(normalizedUser.roleName);
        
        if(user.token) localStorage.setItem('jwt_token', user.token);
        localStorage.setItem('user_id', normalizedUser.id);
        localStorage.setItem('user_role_name', normalizedUser.roleName);
        localStorage.setItem('user', JSON.stringify(normalizedUser)); 
    };
    const handleRefreshUser = () => {
        console.log("Refreshing user data from LocalStorage...");
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Cập nhật lại State để Navbar hiển thị tên mới
                setCurrentUser(parsedUser);
                // Cập nhật lại Role (phòng trường hợp Role cũng đổi)
                setUserRoleName(parsedUser.roleName || parsedUser.role_name);
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                console.error("Lỗi parse user data:", error);
            }
        }
    };

    if (isCheckingAuth) return <div className="flex h-screen items-center justify-center">Đang khởi tạo hệ thống...</div>;

    // --- 3. CÁC TRANG CÔNG KHAI (RENDER TRƯỚC KHI CHECK LOGIN) ---

    // Gateway
    if (path === '/') return <GatewayScreen setPath={setPath} />;

    // About Us (Mới)
    if (path === '/about') return <AboutScreen setPath={setPath} />;

    // Contact (Mới)
    if (path === '/contact') return <ContactScreen setPath={setPath} />;

    // Login
    if (path === '/login') {
        if (isLoggedIn) {
             const defaultPath = userRoleName === 'Customer' ? '/shop' : '/dashboard';
             setPath(defaultPath); return null;
        }
        return <LoginScreen setPath={setPath} setUser={setUser} setIsLoggedIn={setIsLoggedIn} />;
    }
      // PRODUCT DETAIL (public)
    if (path.startsWith('/product/')) {
        const id = path.replace('/product/', '');
        return (
            <ProductDetail
                setPath={setPath}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                productId={id}
            />
        );
    }

    if (path === "/shop") {
        return (
            <ShopScreen
                setPath={setPath}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLogout={handleLogout}
            />
        );
    }

    // Shop
    if (path === '/shop') {
        if (!isLoggedIn || userRoleName === 'Customer') {
            return <ShopScreen setPath={setPath} isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={handleLogout} />;
        }
    }

    // --- KIỂM TRA ĐĂNG NHẬP (BẮT BUỘC) ---
    if (!isLoggedIn) { setPath('/'); return null; }

    // Reset Password
    if (currentUser && currentUser.mustChangePassword && path !== '/reset-password') {
         setPath('/reset-password');
         return <ResetPasswordScreen currentUser={currentUser} setPath={setPath} />;
    }
    
    // Routes khác
    if (path === '/change-password') return <ChangePasswordScreen currentUser={currentUser} setPath={setPath} />;
    if (path === '/reset-password') return <ResetPasswordScreen currentUser={currentUser} setPath={setPath} />;

    // 7. GIAO DIỆN QUẢN TRỊ
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <Sidebar currentPath={path} setPath={setPath} userRoleName={userRoleName} />
            <div className="flex-1 md:ml-64 flex flex-col">
                <Navbar currentUser={currentUser} handleLogout={handleLogout} setPath={setPath} />
                <main className="flex-1 overflow-y-auto p-4">
                    <AppContent path={path} setPath={setPath} currentUser={currentUser} userRoleName={userRoleName} onRefreshUser={handleRefreshUser} refreshKey={refreshKey}/>
                </main>
            </div>
        </div>
    );
}