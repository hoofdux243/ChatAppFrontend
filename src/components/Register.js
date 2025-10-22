import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/apiService';
import '../assets/css/Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '' // Đổi từ fullName thành name để khớp với API
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Full name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Họ và tên không được để trống';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      // Prepare data for API call (exclude confirmPassword)
      const registerData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim()
      };

      console.log('Sending registration data:', registerData);
      
      // Call register API
      const response = await apiService.register(registerData);
      
      console.log('Registration successful:', response);
      
      // Show success message and redirect to login
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error messages from backend
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.message) {
        // Check for common error cases
        if (error.message.includes('username') && error.message.includes('already exists')) {
          errorMessage = 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.';
        } else if (error.message.includes('email') && error.message.includes('already exists')) {
          errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-form-container">
          <div className="register-header">
            <h1 className="register-title">Tạo tài khoản mới</h1>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}
            
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
                value={formData.name}
                onChange={handleChange}
                className={`register-input ${errors.name ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.name && (
                <div className="field-error">{errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                className={`register-input ${errors.username ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.username && (
                <div className="field-error">{errors.username}</div>
              )}
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`register-input ${errors.email ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <div className="field-error">{errors.email}</div>
              )}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
                className={`register-input ${errors.password ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.password && (
                <div className="field-error">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`register-input ${errors.confirmPassword ? 'error' : ''}`}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <div className="field-error">{errors.confirmPassword}</div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="register-btn"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
            
            <hr className="divider" />
            
            <div className="login-link-container">
              <span className="login-link-text">Đã có tài khoản? </span>
              <button
                type="button"
                className="login-link-btn"
                disabled={loading}
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;