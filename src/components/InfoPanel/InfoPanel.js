import React, { useState } from 'react';
import UserProfileModal from '../Profile/UserProfileModal';
import './InfoPanel.css';

const InfoPanel = ({ isOpen, onClose, selectedConversation, currentUser }) => {
  const conversation = selectedConversation || {};
  const isGroup = conversation.isGroup || false;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleViewProfile = () => {
    if (!conversation || isGroup) return;
    
    console.log('InfoPanel - handleViewProfile:', {
      conversation,
      memberId: conversation.memberId,
      title: conversation.title,
      isGroup
    });
    
    setIsProfileModalOpen(true);
  };

  return (
    <div className={`info-panel ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <div className="info-panel-content-wrapper">
          {/* Header */}
          <div className="info-panel-header">
            <h3>Thông tin {isGroup ? 'nhóm' : 'chat'}</h3>
            <button className="info-panel-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="info-panel-content">
            {/* User/Group Info */}
            <div className="info-section">
              <div className="info-avatar">
                <img 
                  src={conversation.avatar || '/api/placeholder/80/80'} 
                  alt={conversation.title || 'Avatar'}
                  onError={(e) => {
                    e.target.src = '/api/placeholdSer/80/80';
                  }}
                />
              </div>
              <h2 className="info-name">{conversation.title || 'Cuộc trò chuyện'}</h2>
              {isGroup && (
                <p className="info-members">{conversation.memberCount || 2} thành viên</p>
              )}
              {!isGroup && (
                <p className="info-status">Hoạt động gần đây</p>
              )}
            </div>

            {/* Group Members */}
            {isGroup && (
              <div className="info-section">
                <h4 className="section-title">
                  <span>Thành viên nhóm</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                </h4>
                <div className="members-list">
                  <div className="member-item">
                    <div className="member-avatar">
                      <img src="/api/placeholder/40/40" alt="Member" />
                    </div>
                    <div className="member-info">
                      <span className="member-name">Bạn</span>
                      <span className="member-role">Thành viên</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Settings */}
            <div className="info-section">
              <h4 className="section-title">
                <span>Tùy chọn chat</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </h4>
              
              <div className="settings-list">
                {/* Nút xem trang cá nhân - chỉ hiện cho chat private */}
                {!isGroup && (
                  <div className="setting-item" onClick={handleViewProfile}>
                    <div className="setting-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span>Xem trang cá nhân</span>
                  </div>
                )}

                <div className="setting-item">
                  <div className="setting-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span>Đánh dấu đã đọc</span>
                </div>

                <div className="setting-item">
                  <div className="setting-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <span>Ghim cuộc trò chuyện</span>
                </div>

                <div className="setting-item">
                  <div className="setting-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 13.5L8.5 16 12 18.5 15.5 16 12 13.5z"/>
                    </svg>
                  </div>
                  <span>Tắt thông báo</span>
                </div>
              </div>
            </div>

            {/* Media and Files */}
            <div className="info-section">
              <h4 className="section-title">
                <span>File, ảnh, video</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </h4>
              
              <div className="media-grid">
                <div className="media-item">
                  <img src="/api/placeholder/60/60" alt="Media" />
                </div>
                <div className="media-item">
                  <img src="/api/placeholder/60/60" alt="Media" />
                </div>
                <div className="media-item">
                  <img src="/api/placeholder/60/60" alt="Media" />
                </div>
                <div className="media-item see-all">
                  <span>Xem tất cả</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="info-section">
              <h4 className="section-title">
                <span>Link</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </h4>
              
              <div className="links-list">
                <div className="link-item">
                  <div className="link-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.2 7 2 9.2 2 12s2.2 5 5 5H11v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.01c2.8 0 5 2.2 5 5s-2.2 5-5 5H13v1.9h4.01c3.87 0 7-3.13 7-7s-3.13-7-7-7H13v1.9z"/>
                    </svg>
                  </div>
                  <div className="link-info">
                    <span className="link-title">KPDL_APRIORI.mp4</span>
                    <span className="link-url">drive.google.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={conversation.memberId}
        userName={conversation.title}
      />
    </div>
  );
};

export default InfoPanel;
