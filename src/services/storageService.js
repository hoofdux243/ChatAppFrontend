// Storage utility - không dùng localStorage, chỉ dùng sessionStorage và cookies
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

  // sessionStorage methods với error handling
  static setItem(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }

  static getItem(key) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }

  static removeItem(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }

  // Token methods - không dùng localStorage
  static setToken(token, rememberMe = false) {
    if (rememberMe) {
      // Sử dụng cookie cho persistent login
      this.setCookie('access_token', token, 7); // 7 days
    } else {
      // Sử dụng sessionStorage cho session-only login
      sessionStorage.setItem('access_token', token);
    }
  }

  static getToken() {
    // Kiểm tra sessionStorage trước, sau đó cookies
    return sessionStorage.getItem('access_token') || 
           this.getCookie('access_token');
  }

  static clearToken() {
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
