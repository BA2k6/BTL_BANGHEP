//C:\Users\Admin\Downloads\DUANWEB(1)\client\src\services\api.js
import axios from 'axios';

// [DEBUG] Nếu bạn thấy dòng này trong Console (F12) nghĩa là file MỚI đã chạy
console.log("%c[API] Đã cập nhật phiên bản: FIX LỖI ĐĂNG XUẤT", "background: green; color: white; padding: 4px; font-weight: bold");

const api = axios.create({
    baseURL: 'http://localhost:5000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
    // [QUAN TRỌNG]: Đã bỏ dòng validateStatus để Axios tự động bắt lỗi
});

// ============================================================
// 1. REQUEST INTERCEPTOR (Gửi Token & Log Request)
// ============================================================
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // [DEBUG] Log request màu xanh
    console.log(`%c[REQUEST] ${config.method.toUpperCase()} ${config.url}`, 'color: blue; font-weight: bold');
    
    return config;
}, (error) => {
    console.error("[REQUEST ERROR]", error);
    return Promise.reject(error);
});

// ============================================================
// 2. RESPONSE INTERCEPTOR (Xử lý lỗi thông minh)
// ============================================================
api.interceptors.response.use(
    (response) => {
        // [DEBUG] Log thành công màu xanh lá
        console.log(`%c[SUCCESS] ${response.config.url}`, 'color: green; font-weight: bold', response.data);
        return response;
    },
    (error) => {
        // [DEBUG] Log Lỗi RÕ RÀNG ra Console màu đỏ
        if (error.response) {
            const status = error.response.status;
            const originalUrl = error.config.url;
            const serverMessage = error.response.data?.message || error.message;

            // In lỗi màu đỏ cho dễ nhìn
            console.group(`%c[API ERROR] ${status} - ${originalUrl}`, 'color: red; font-weight: bold');
            console.error("Message:", serverMessage);
            console.error("Chi tiết:", error.response.data);
            console.groupEnd();

            // --- LOGIC QUAN TRỌNG ĐỂ KHÔNG BỊ ĐÁ RA ---
            const isLoginRequest = originalUrl.includes('/auth/login');

            // 1. Nếu đang Đăng nhập mà bị lỗi (401/403) -> KHÔNG LÀM GÌ CẢ
            if (isLoginRequest) {
                console.warn(`>> Đăng nhập thất bại (Lỗi ${status}). Giữ nguyên màn hình để báo lỗi.`);
            }
            // 2. Nếu đang dùng (Dashboard/Sản phẩm...) mà bị lỗi -> ĐÁ RA
            else if ((status === 401 || status === 403) && window.location.pathname !== '/login') {
                console.warn(">> Phiên hết hạn hoặc bị khóa khi đang sử dụng. Tự động đăng xuất.");
                localStorage.clear(); 
                window.location.href = '/'; 
            }
        } else {
            console.error("[NETWORK ERROR]", error.message);
        }
        
        // Luôn trả lỗi về để Component (như LoginScreen) bắt được và hiện thông báo
        return Promise.reject(error);
    }
);

// ============================================================
// CÁC HÀM GỌI API (AUTH)
// ============================================================

export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    } catch (error) {
        // [LOGIC MỚI] Bắt riêng lỗi Khóa tài khoản (403) để hiện thông báo chuẩn
        if (error.response && error.response.status === 403) {
            console.log(">> Phát hiện tài khoản bị khóa!");
            // Ném ra object lỗi có message này để LoginScreen hiển thị
            throw { 
                response: { 
                    data: { message: 'Tài khoản của bạn đã bị KHÓA. Vui lòng liên hệ Admin.' } 
                } 
            };
        }
        
        // Các lỗi khác (sai pass, v.v.)
        throw error.response?.data || { message: 'Lỗi đăng nhập.' };
    }
};

export const register = async (fullName, phone, password) => {
    try {
        const response = await api.post('/auth/register', { fullName, phone, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Đăng ký thất bại.' };
    }
};

export const updatePassword = async (userId, oldPassword, newPassword) => {
    try {
        const response = await api.post('/auth/change-password', { userId, oldPassword, newPassword });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Đổi mật khẩu thất bại.' };
    }
};

export const resetPassword = async (userId, newPassword) => {
    try {
        const response = await api.post('/auth/reset-password', { userId, newPassword });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Đặt lại mật khẩu thất bại.' };
    }
};

// ============================================================
// CÁC HÀM GỌI API (QUẢN LÝ USER / ADMIN)
// ============================================================

export const getUsers = async () => {
    try {
        const response = await api.get('/admin/users'); 
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tải danh sách người dùng.' };
    }
};

export const adminResetPassword = async (targetUserId, newPassword) => {
    // [FIX LỖI] 
    // 1. Đổi phương thức từ POST -> PUT (Thường update dữ liệu dùng PUT)
    // 2. Đưa ID lên URL để Backend dễ nhận diện (giống hàm adminUpdateUserStatus bên dưới)
    // 3. Đổi key gửi đi: 'newPassword' (Backend phải đọc req.body.newPassword)
    
    // Giả định Route Backend của bạn là: PUT /api/admin/users/:id/reset-password
    // Nếu hàm này vẫn lỗi 404, hãy thử đổi URL thành: '/users/admin/reset-password' nhưng thêm userId vào body
    
    try {
        const response = await api.put(`/admin/users/${targetUserId}/reset-password`, { 
            newPassword: newPassword 
        });

        return response.data;
    } catch (error) {
        // Nếu cách trên lỗi 404 (do Backend chưa viết chuẩn REST), 
        // hãy mở comment dùng cách cũ này nhưng SỬA LẠI KEY 'userId':
        /*
        const response = await api.post('/users/admin/reset-password', { 
            userId: targetUserId, // <--- Backend thường tìm biến 'userId' hoặc 'id', ít khi dùng 'targetUserId'
            newPassword: newPassword 
        });
        return response.data;
        */
       
        throw error.response?.data || { message: 'Lỗi reset mật khẩu.' };
    }
};

export const adminUpdateUserStatus = async (userId, status) => {
    try {
        const response = await api.put(`/admin/users/${userId}/status`, { status });
        console.log(`Đã cập nhật user ${userId} sang trạng thái ${status}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi cập nhật trạng thái.' };
    }
};

// ============================================================
// CÁC HÀM GỌI API (NGHIỆP VỤ KHÁC)
// ============================================================

export const getEmployees = async () => {
    try {
        const response = await api.get('/employees');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tải danh sách nhân viên.' };
    }
};

export const createEmployee = async (empData) => {
    try {
        const response = await api.post('/employees/create', empData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tạo nhân viên.' };
    }
};

export const getProducts = async () => {
    try {
        const response = await api.get('/products');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tải sản phẩm.' };
    }
};



export const getOrders = async () => {
    try {
        const response = await api.get('/orders');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tải đơn hàng.' };
    }
};


export const getStockInReceipts = async () => {
    try {
        const response = await api.get('/stockin');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi tải phiếu nhập.' };
    }
};

export const getMonthlySummaryData = async (year) => {
    try {
        const response = await api.get(`/dashboard/summary?year=${year}`); 
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi Dashboard Summary.' };
    }
};

export const getDashboardCurrentStats = async () => {
    try {
        const response = await api.get('/dashboard/current-stats'); 
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Lỗi Dashboard Stats.' };
    }
};




export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    if (response.status !== 200) throw response.data || { message: 'Lỗi tải chi tiết sản phẩm.' };
    return response.data;
};

export const createProduct = async (product) => {
    const response = await api.post('/products', product);
    if (response.status !== 201) throw response.data || { message: 'Lỗi khi tạo sản phẩm.' };
    return response.data;
};

export const updateProduct = async (id, product) => {
    const response = await api.put(`/products/${id}`, product);
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi cập nhật sản phẩm.' };
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi xóa sản phẩm.' };
    return response.data;
};

// MỚI THÊM: Hàm lấy Danh mục (Fix lỗi ShopScreen)
export const getCategories = async () => {
    const response = await api.get('/categories');
    if (response.status !== 200) throw response.data || { message: 'Lỗi tải danh mục.' };
    return response.data;
};

export const getCustomers = async () => {
    const response = await api.get('/customers');
    if (response.status !== 200) throw response.data || { message: 'Lỗi tải khách hàng.' };
    return response.data;
};

export const getProfile = async () => {
    // Gọi API: GET /api/users/profile
    const response = await api.get('/users/profile'); 
    return response.data;
};

export const updateProfile = async (data) => {
    // Gọi API: PUT /api/users/profile
    const response = await api.put('/users/profile', data);
    return response.data;
};

export const getSalaries = async () => {
    const response = await api.get('/salaries');
    if (response.status !== 200) throw response.data || { message: 'Lỗi tải bảng lương.' };
    return response.data;
};

export const getSalary = async (salaryId) => {
    const response = await api.get(`/salaries/${encodeURIComponent(salaryId)}`);
    if (response.status === 404) throw response.data || { message: 'Không tìm thấy bảng lương.' };
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi tải bảng lương.' };
    return response.data;
};

export const deleteSalary = async (salaryId) => {
    const response = await api.delete(`/salaries/${encodeURIComponent(salaryId)}`);
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi xóa bảng lương.' };
    return response.data;
};

export const calculateSalaries = async (month) => {
    // month: 'YYYY-MM'
    const response = await api.post('/salaries/calculate', { month });
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi tính lương.' };
    return response.data;
};

export const paySalary = async (salaryId) => {
    const response = await api.patch(`/salaries/${encodeURIComponent(salaryId)}/pay`);
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi cập nhật trạng thái trả lương.' };
    return response.data;
};

export const patchSalary = async (salaryId, data) => {
    const response = await api.patch(`/salaries/${encodeURIComponent(salaryId)}`, data);
    if (response.status !== 200) throw response.data || { message: 'Lỗi khi cập nhật bảng lương.' };
    return response.data;
};


export default api;