import { useReducer, createContext, useContext, useEffect } from 'react';
import apiService from '../services/apiService';
import chatService from '../services/chatService';
// Remove global webSocketService import - will be passed from context

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial auth state - Đơn giản, chỉ lưu trong memory
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component - Đơn giản, không có localStorage
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await apiService.login(credentials);
      
      if (response && response.access_token && response.user) {
        // Chỉ set token trong API service, không lưu persistent
        apiService.setToken(response.access_token);
        
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: { 
            user: response.user, 
            token: response.access_token 
          } 
        });

        // WebSocket connection will be handled by ChatContext
        
        return { success: true, data: response };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract error message từ backend response - hiển thị trực tiếp
      let errorMessage = 'Đăng nhập thất bại';
      
      if (error.message) {
        // Custom error từ apiService (backend message)
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        // Backup case - direct backend response
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        // Alternative error field
        errorMessage = error.response.data.error;
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function - Đơn giản
  const logout = async () => {
    // Clear token từ API service và reset state
    apiService.clearToken();
    // Clear chat service cache
    chatService.clearCache();
    // WebSocket disconnect will be handled by ChatContext
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update user info
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Handle page unload - set user offline when close browser/tab
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // WebSocket cleanup will be handled by ChatContext
    };

    const handleUnload = () => {
      // WebSocket cleanup will be handled by ChatContext
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [state.isAuthenticated]);

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    token: state.token,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
