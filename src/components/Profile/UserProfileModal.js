import React, { useState, useEffect } from 'react';
import chatService from '../../services/chatService';
import './UserProfileModal.css';

const UserProfileModal = ({ isOpen, onClose, userId, userName }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('UserProfileModal - isOpen:', isOpen, 'userId:', userId, 'userName:', userName);
    if (isOpen && userId) {
      loadUserProfile();
    } else if (isOpen && !userId) {
      setError('Không có thông tin người dùng để hiển thị');
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading profile for userId:', userId);
      
      const response = await chatService.getUserProfileById(userId);
      console.log('User profile response:', response);
      
      if (response && response.result) {
        setProfile(response.result);
      } else {
        // Fallback với thông tin cơ bản
        setProfile({
          name: userName,
          avatar: null,
          bio: 'Không có thông tin'
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback với thông tin cơ bản thay vì show error
      setProfile({
        name: userName,
        avatar: null,
        bio: 'Không thể tải thông tin chi tiết'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setProfile(null);
    setError(null);
  };

  const handleAddFriend = () => {
    // TODO: Implement add friend functionality
    console.log('Add friend:', userId);
    alert('Gửi lời mời kết bạn thành công!');
  };

  const handleSendMessage = () => {
    // TODO: Implement send message functionality
    console.log('Send message to:', userId);
    alert('Chuyển đến cuộc trò chuyện');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="user-profile-modal-overlay" onClick={handleClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h3>Thông tin tài khoản</h3>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="user-profile-content">
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Đang tải...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          {profile && (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  <img 
                    src={profile.avatar || '/api/placeholder/100/100'} 
                    alt={profile.name || userName}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/100/100';
                    }}
                  />
                  <div className="online-status"></div>
                </div>
                <h2 className="user-name">{profile.name || userName}</h2>
              </div>

              <div className="user-details">
                <div className="detail-section">
                  <h4>Bio</h4>
                  <p>{profile.bio || 'Chưa có tiểu sử'}</p>
                </div>
              </div>

              <div className="action-buttons">
                <button className="update-button" onClick={handleAddFriend}>
                  Kết bạn
                </button>
                <button className="message-button" onClick={handleSendMessage}>
                  Nhắn tin
                </button>
              </div>
            </>
          )}

          {!loading && !error && !profile && (
            <div className="no-data">
              <p>Không tìm thấy thông tin người dùng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;