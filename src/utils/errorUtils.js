// Utility for translating backend error messages to Vietnamese

export const translateErrorMessage = (errorMessage) => {
  const errorTranslations = {
    // Authentication errors
    'User not found': 'Không tìm thấy người dùng',
    'Invalid credentials': 'Tên đăng nhập hoặc mật khẩu không đúng',
    'Invalid password': 'Mật khẩu không đúng',
    'Username not found': 'Tên đăng nhập không tồn tại',
    'Account is locked': 'Tài khoản đã bị khóa',
    'Account is disabled': 'Tài khoản đã bị vô hiệu hóa',
    'Token expired': 'Phiên đăng nhập đã hết hạn',
    'Unauthorized': 'Không có quyền truy cập',
    
    // Validation errors
    'Username is required': 'Vui lòng nhập tên đăng nhập',
    'Password is required': 'Vui lòng nhập mật khẩu',
    'Email is required': 'Vui lòng nhập email',
    'Invalid email format': 'Định dạng email không hợp lệ',
    'Password too short': 'Mật khẩu quá ngắn',
    'Username already exists': 'Tên đăng nhập đã tồn tại',
    
    // Network errors
    'Network error': 'Lỗi kết nối mạng',
    'Server error': 'Lỗi máy chủ',
    'Service unavailable': 'Dịch vụ tạm thời không khả dụng',
    'Request timeout': 'Yêu cầu bị timeout',
    
    // Chat errors
    'Conversation not found': 'Không tìm thấy cuộc trò chuyện',
    'Message not found': 'Không tìm thấy tin nhắn',
    'Cannot send message': 'Không thể gửi tin nhắn',
    'File too large': 'File quá lớn',
    'Unsupported file type': 'Loại file không được hỗ trợ',
    
    // Default fallbacks
    'Login failed': 'Đăng nhập thất bại',
    'Something went wrong': 'Đã có lỗi xảy ra'
  };

  // Check for exact match first
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Check for partial matches (case insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [english, vietnamese] of Object.entries(errorTranslations)) {
    if (lowerMessage.includes(english.toLowerCase())) {
      return vietnamese;
    }
  }

  // If no translation found, return original message
  return errorMessage;
};

export const getErrorSeverity = (errorMessage) => {
  const criticalErrors = [
    'account is locked',
    'account is disabled',
    'server error',
    'service unavailable'
  ];

  const warningErrors = [
    'token expired',
    'unauthorized',
    'invalid credentials'
  ];

  const lowerMessage = errorMessage.toLowerCase();

  if (criticalErrors.some(error => lowerMessage.includes(error))) {
    return 'critical';
  }

  if (warningErrors.some(error => lowerMessage.includes(error))) {
    return 'warning';
  }

  return 'error';
};
