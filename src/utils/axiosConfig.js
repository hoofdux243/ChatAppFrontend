import axios from 'axios';

// Token sẽ được lưu trong memory - đơn giản
let authToken = null;

const instance = axios.create({
    baseURL: 'http://localhost:8080/chatapp',
    headers: { 'Content-Type': 'application/json' },
});

// Function để set token từ bên ngoài
export const setAuthToken = (token) => {
    authToken = token;
};

// Function để clear token
export const clearAuthToken = () => {
    authToken = null;
};

// Gắn token vào mỗi request
instance.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor đơn giản
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Xử lý lỗi đơn giản
        if (error.response?.status === 401) {
            // Clear token và dispatch logout event
            clearAuthToken();
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

export default instance;
