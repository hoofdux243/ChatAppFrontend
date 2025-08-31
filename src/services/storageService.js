// Storage utility for handling localStorage and cookies
class StorageService {
  // Cookie methods
  static setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  static getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  static deleteCookie(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }

  // localStorage methods with error handling
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Combined methods - use cookies for sensitive data, localStorage for others
  static setToken(token, rememberMe = false) {
    // Always use localStorage with key 'token' for compatibility
    localStorage.setItem('token', token);
    
    if (rememberMe) {
      // Also use cookie for persistent login
      this.setCookie('access_token', token, 7); // 7 days
    } else {
      // Also use sessionStorage for session-only login
      sessionStorage.setItem('access_token', token);
    }
  }

  static getToken() {
    // Check localStorage first (for axios compatibility), then sessionStorage, then cookies
    return localStorage.getItem('token') || 
           sessionStorage.getItem('access_token') || 
           this.getCookie('access_token');
  }

  static clearToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('access_token');
    this.deleteCookie('access_token');
  }

  static setUserInfo(userInfo) {
    this.setItem('user_info', userInfo);
  }

  static getUserInfo() {
    return this.getItem('user_info');
  }

  static clearUserInfo() {
    this.removeItem('user_info');
  }

  static setRefreshToken(token) {
    // Always use httpOnly cookie for refresh token (most secure)
    this.setCookie('refresh_token', token, 30); // 30 days
  }

  static getRefreshToken() {
    return this.getCookie('refresh_token');
  }

  static clearRefreshToken() {
    this.deleteCookie('refresh_token');
  }

  static clearAll() {
    this.clearToken();
    this.clearUserInfo();
    this.clearRefreshToken();
  }
}

export default StorageService;
