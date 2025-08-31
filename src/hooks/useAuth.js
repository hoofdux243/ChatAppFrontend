import { useReducer, useEffect, createContext, useContext, useRef } from 'react';
import apiService from '../services/apiService';
import StorageService from '../services/storageService';

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial auth state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
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
      const newState = {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
      console.log('Auth reducer - LOGIN_SUCCESS new state:', newState);
      return newState;

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
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
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

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isLoggingOutRef = useRef(false); // Track if logout is in progress

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        const token = StorageService.getToken();
        const userInfo = StorageService.getUserInfo();

        if (token && userInfo) {
          // Set token in API service
          apiService.setToken(token);
          
          // Try to verify token with server (optional)
          try {
            const verifiedUser = await apiService.getUserProfile();
            dispatch({ 
              type: AUTH_ACTIONS.LOGIN_SUCCESS, 
              payload: { 
                user: verifiedUser, 
                token 
              } 
            });
          } catch (error) {
            // Token might be expired, use stored user info
            dispatch({ 
              type: AUTH_ACTIONS.SET_USER, 
              payload: userInfo 
            });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid data
        StorageService.clearAll();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    // Listen for logout events from axios interceptor
    const handleLogout = () => {
      console.log('Auth logout event received');
      StorageService.clearAll();
      apiService.clearToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      isLoggingOutRef.current = false; // Reset flag
    };

    window.addEventListener('auth:logout', handleLogout);
    checkAuth();

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []); // Remove state dependency to prevent re-creating the effect

  // Login function
  const login = async (credentials, rememberMe = false) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      console.log('Starting login process...');
      const response = await apiService.login(credentials);
      console.log('Login API response:', response);
      
      if (response.access_token) {
        // Store token with preference (session/persistent)
        StorageService.setToken(response.access_token, rememberMe);
        
        // Store refresh token if provided
        if (response.refresh_token) {
          StorageService.setRefreshToken(response.refresh_token);
        }

        // Store user info
        if (response.user) {
          StorageService.setUserInfo(response.user);
        }

        console.log('Dispatching LOGIN_SUCCESS with:', { 
          user: response.user, 
          token: response.access_token 
        });

        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: { 
            user: response.user, 
            token: response.access_token 
          } 
        });

        console.log('Login successful, returning result');
        return { success: true, data: response };
      }

      throw new Error('Không nhận được token từ server');
    } catch (error) {
      console.error('Login error in useAuth:', error);
      const errorMessage = error.message || 'Đăng nhập thất bại';
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API (optional)
      await apiService.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear all stored data
      StorageService.clearAll();
      apiService.clearToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user info
  const updateUser = (userData) => {
    StorageService.setUserInfo(userData);
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

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
