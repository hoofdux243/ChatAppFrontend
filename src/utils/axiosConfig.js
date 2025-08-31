import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/chatapp',
    headers: { 'Content-Type': 'application/json' },
});

// Gắn token vào mỗi request
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Dùng localStorage với key 'token'
        console.log('Axios request - Token from localStorage:', token ? token.substring(0, 50) + '...' : 'No token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('Axios request - URL:', config.url);
        console.log('Axios request - Headers:', config.headers);
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu lỗi 401
        if (error.response?.status === 401) {
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!originalRequest._retry && refreshToken) {
                originalRequest._retry = true;

                try {
                    // Gọi API refresh token
                    const response = await axios.post(`${instance.defaults.baseURL}/api/v1/auth-service/refresh-token`, {
                        refreshToken: refreshToken
                    });

                    const newAccessToken = response.data.accessToken;
                    localStorage.setItem('token', newAccessToken);
                    
                    // Cập nhật header và thử lại request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    // Refresh token thất bại, clear auth data nhưng không dispatch ngay
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    
                    // Throttle logout event - chỉ dispatch 1 lần trong 1 giây
                    if (!window._logoutInProgress) {
                        window._logoutInProgress = true;
                        console.log('Dispatching auth:logout event');
                        window.dispatchEvent(new CustomEvent('auth:logout'));
                        
                        setTimeout(() => {
                            window._logoutInProgress = false;
                        }, 1000);
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // Không có refresh token hoặc đã thử refresh, clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Throttle logout event
                if (!window._logoutInProgress) {
                    window._logoutInProgress = true;
                    console.log('Dispatching auth:logout event');
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                    
                    setTimeout(() => {
                        window._logoutInProgress = false;
                    }, 1000);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
