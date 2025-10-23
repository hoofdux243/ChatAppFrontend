import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import chatService from '../../services/chatService';
import './UserProfileModal.css';

const UserProfileModal = ({ isOpen, onClose, userId, userName, onSendMessage, onAddFriend }) => {
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
    if (onAddFriend) {
      onAddFriend('ADD_FRIEND');
    } else {
      console.log('Add friend:', userId);
      alert('Gửi lời mời kết bạn thành công!');
    }
  };

  const handleRemoveFriend = () => {
    if (onAddFriend) {
      onAddFriend('REMOVE_FRIEND');
    } else {
      console.log('Remove friend:', userId);
      alert('Đã hủy kết bạn!');
    }
  };

  const handleAcceptFriend = () => {
    if (onAddFriend) {
      onAddFriend('ACCEPT_FRIEND');
    } else {
      console.log('Accept friend request:', userId);
      alert('Đã chấp nhận lời mời kết bạn!');
    }
  };

  const handleRejectFriend = () => {
    if (onAddFriend) {
      onAddFriend('REJECT_FRIEND');
    } else {
      console.log('Reject friend request:', userId);
      alert('Đã từ chối lời mời kết bạn!');
    }
  };

  const handleCancelRequest = () => {
    if (onAddFriend) {
      onAddFriend('CANCEL_REQUEST');
    } else {
      console.log('Cancel friend request:', userId);
      alert('Đã hủy lời mời kết bạn!');
    }
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage();
    } else {
      // Fallback behavior
      console.log('Send message to:', userId);
      alert('Chuyển đến cuộc trò chuyện');
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
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
                {/* Hiển thị nút dựa trên trạng thái quan hệ */}
                {profile.isContact ? (
                  // Đã kết bạn - hiển thị nút hủy kết bạn
                  <button className="remove-friend-button" onClick={handleRemoveFriend}>
                    Hủy kết bạn
                  </button>
                ) : profile.isRequester ? (
                  // Người này gửi lời mời cho mình - hiển thị nút đồng ý và từ chối
                  <>
                    <button className="accept-button" onClick={handleAcceptFriend}>
                      Đồng ý lời mời kết bạn
                    </button>
                    <button className="reject-button" onClick={handleRejectFriend}>
                      Từ chối
                    </button>
                  </>
                ) : profile.isRecipient ? (
                  // Mình đã gửi lời mời cho người này - hiển thị nút hủy lời mời
                  <button className="cancel-request-button" onClick={handleCancelRequest}>
                    Hủy lời mời
                  </button>
                ) : (
                  // Chưa có quan hệ gì - hiển thị nút thêm bạn bè
                  <button className="update-button" onClick={handleAddFriend}>
                    Thêm bạn bè
                  </button>
                )}
                
                {/* Nút nhắn tin luôn hiển thị */}
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

  // Render modal using portal to body
  return createPortal(modalContent, document.body);
};

export default UserProfileModal;