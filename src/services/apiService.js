import axiosInstance, { setAuthToken, clearAuthToken, getAuthToken } from '../utils/axiosConfig';

// API configuration
const API_BASE_URL = 'http://localhost:8080/chatapp/api';

// API endpoints
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  USER_PROFILE: '/auth/profile',
  REFRESH_TOKEN: '/auth/refresh',
  CHAT_ROOMS: '/chatrooms',
  MESSAGES: '/chatrooms/:id/messages'
};

// API service class - Đơn giản hóa không dùng localStorage
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Set token for authenticated requests
  setToken(token) {
    setAuthToken(token);
  }

  // Clear token (logout)
  clearToken() {
    clearAuthToken();
  }

  // Get token from memory
  getToken() {
    return getAuthToken();
  }

  // Generic request method using axios instance
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    try {
      const response = await axiosInstance({
        url,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : options.data,
        headers: options.headers,
        ...options
      });
      
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle backend error response format
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Format: { message: "User not found", status: 400, timestamp: 1756936933243 }
        if (errorData.message) {
          const customError = new Error(errorData.message);
          customError.status = errorData.status;
          customError.timestamp = errorData.timestamp;
          customError.originalError = error;
          throw customError;
        }
      }
      
      // Fallback for other error formats
      throw error;
    }
  }

  // Try to refresh token - Đơn giản hóa, không dùng refresh token
  async tryRefreshToken() {
    // Không implement refresh token để đơn giản
    return false;
  }

  // Register method
  async register(userData) {
    try {
      const response = await this.request(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Debug: Log response để xem format
      console.log('Register response:', response);

      // Backend trả về { message, status, result }
      return {
        message: response.message || 'Registration successful',
        status: response.status || 200,
        result: response.result
      };

    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Đăng ký thất bại');
    }
  }

  // Login method
  async login(credentials) {
    try {
      const response = await this.request(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Debug: Log response để xem format
      console.log('Backend response:', response);

      // Backend trả về { message, status, result: { token } }
      // Kiểm tra token từ response.result.token
      let token = null;
      if (response.result && response.result.token) {
        token = response.result.token;
      } else if (response.token) {
        token = response.token;
      } else if (response.access_token) {
        token = response.access_token;
      }

      console.log('Extracted token:', token ? token.substring(0, 50) + '...' : 'No token found');

      if (token) {
        this.setToken(token);
        
        // Thử decode JWT token để lấy thông tin user
        let user = response.user || { username: credentials.username };
        
        // Nếu có token, thử lấy thông tin từ payload
        try {
          // Decode JWT token (base64)
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', payload);
            
            // Merge thông tin từ token vào user object
            user = {
              ...user,
              id: payload.id || payload.userId || payload.sub,
              userId: payload.userId || payload.id || payload.sub,
              username: payload.username || user.username || credentials.username,
              name: payload.name || payload.username,
              email: payload.email
            };
          }
        } catch (e) {
          console.log('Cannot decode token:', e);
        }
        
        // Nếu response có thông tin user chi tiết từ result
        if (response.result) {
          user = {
            ...user,
            name: response.result.name || user.name,
            avatar: response.result.avatar || user.avatar,
            // Nếu có user object trong result
            ...(response.result.user || {})
          };
        }
        
        console.log('Final user object:', user);
        
        // Trả về format mà useAuth hook mong đợi
        return {
          access_token: token, // useAuth expects this field
          token: token,
          user: user,
          message: response.message || 'Login successful',
          status: response.status || 200
        };
      } else {
        throw new Error('Token không được tìm thấy trong response từ server');
      }

    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Đăng nhập thất bại');
    }
  }

  // Get user profile
  async getUserProfile() {
    return await this.request(API_ENDPOINTS.USER_PROFILE, {
      method: 'GET',
    });
  }


}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
