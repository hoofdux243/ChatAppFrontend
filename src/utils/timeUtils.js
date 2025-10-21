// Utility functions để format thời gian

export const formatLastSeen = (lastSeenISO) => {
  if (!lastSeenISO) return 'Không rõ';
  
  try {
    const lastSeen = new Date(lastSeenISO);
    const now = new Date();
    const diffMs = now - lastSeen;
    
    // Convert to different units
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return '1 phút trước';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      // Format as date for older times
      return lastSeen.toLocaleDateString('vi-VN');
    }
  } catch (error) {
    console.error('Error formatting last seen:', error);
    return 'Không rõ';
  }
};

export const isUserOnline = (userStatus) => {
  return userStatus && userStatus.isOnline === true;
};