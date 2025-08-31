import StorageService from './storageService';
import axiosInstance from '../utils/axiosConfig';

// API configuration
const API_BASE_URL = 'http://localhost:8080/chatapp/api'; // Thay đổi URL này theo backend của bạn

// API endpoints
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  USER_PROFILE: '/auth/profile',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  CHAT_ROOMS: '/chatrooms',
  MESSAGES: '/chatrooms/:id/messages'
};

// API service class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = StorageService.getToken();
  }

  // Set token for authenticated requests
  setToken(token) {
    this.token = token;
    // Note: Don't store here, let the calling code decide storage method
  }

  // Get token from storage
  getToken() {
    return StorageService.getToken();
  }

  // Clear token (logout)
  clearToken() {
    this.token = null;
    StorageService.clearAll();
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
      throw error;
    }
  }

  // Try to refresh token
  async tryRefreshToken() {
    try {
      const refreshToken = StorageService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          this.setToken(data.access_token);
          StorageService.setToken(data.access_token, true); // Maintain persistence
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
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
        
        // Nếu response có thông tin user chi tiết
        if (response.result && response.result.user) {
          user = {
            ...user,
            ...response.result.user
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

  // Logout
  async logout() {
    try {
      await this.request(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearToken();
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
