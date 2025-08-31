import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/css/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log('Login component - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login useEffect - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to /chat');
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Clear previous errors

    // Validate form
    if (!username || !password) {
      return;
    }

    try {
      console.log('Login form submit - calling login API...');
      const result = await login({
        username: username,
        password: password
      }, rememberMe);

      console.log('Login form submit - result:', result);
      if (result.success) {
        // Login successful - redirect to chat page
        console.log('Login successful, user data:', result.data);
        console.log('Navigating to /chat...');
        navigate('/chat');
      }
    } catch (error) {
      console.error('Login error in component:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Left side - Logo and description */}
        <div className="login-left">
          <h1 className="facebook-logo">facebook</h1>
          <p className="facebook-desc">
            Facebook giúp bạn kết nối và chia sẻ với mọi người trong cuộc sống của bạn.
          </p>
        </div>

        {/* Right side - Login form */}
        <div>
          <div className="login-form-container">
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="login-input"
                disabled={loading}
              />
              
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                disabled={loading}
              />

              <div className="remember-me-container">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="remember-me-checkbox"
                  />
                  <span className="remember-me-text">Ghi nhớ đăng nhập</span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="login-btn"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              
              <button
                type="button"
                className="forgot-link"
                disabled={loading}
              >
                Quên mật khẩu?
              </button>
              
              <hr className="divider" />
              
              <button
                type="button"
                className="create-btn"
                disabled={loading}
              >
                Tạo tài khoản mới
              </button>
            </form>
          </div>
          
          <div className="footer">
            <small>Meta © 2025</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
