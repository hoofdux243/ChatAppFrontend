import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import chatService from '../../services/chatService';
import Avatar from '../shared/Avatar';
import './CreateGroupModal.css';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Prevent body scroll when modal is open
      document.body.classList.add('modal-open');
    } else {
      // Remove body scroll prevention when modal closes
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to ensure body class is removed
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Search users when search term changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchTerm);
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await chatService.getContacts();
      
      if (response && response.result && response.result.contacts) {
        setUsers(response.result.contacts);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Check if it's an auth error
      if (error.response && error.response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setUsers([]);
      } else {
        // Use fallback data for testing
        setUsers([
          { contactId: 'fallback1', userId: 'user1', name: 'Vũ 3', username: 'vu3', avatar: null },
          { contactId: 'fallback2', userId: 'user2', name: 'Test User', username: 'testuser', avatar: null }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (keyword = '') => {
    try {
      setSearching(true);
      const response = await chatService.getContacts(keyword);
      
      if (response && response.result && response.result.contacts) {
        setUsers(response.result.contacts);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => {
      // Use userId for unique identification, fallback to contactId for backwards compatibility
      const userId = user.userId || user.contactId;
      const isSelected = prev.some(u => (u.userId || u.contactId) === userId);
      if (isSelected) {
        return prev.filter(u => (u.userId || u.contactId) !== userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên để tạo cuộc trò chuyện');
      return;
    }

    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    try {
      setLoading(true);
      
      // Nếu chỉ có 1 user được chọn, tạo private chat
      // Nếu có nhiều user, tạo group chat
      const groupData = {
        // Use userId for creating chatroom, fallback to contactId for backwards compatibility
        memberIds: selectedUsers.map(user => user.userId || user.contactId),
        name: groupName.trim() // Required field
      };
      
      await onCreateGroup(groupData);
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
      
      // Better error handling
      let errorMessage = 'Lỗi tạo cuộc trò chuyện. Vui lòng thử lại.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSelectedUsers([]);
    // Remove body scroll prevention
    document.body.classList.remove('modal-open');
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="create-group-modal">
        <div className="modal-header">
          <h3>Tạo cuộc trò chuyện</h3>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Group Name Input - Required */}
          <div className="group-name-section">
            <input
              type="text"
              placeholder="Nhập tên nhóm *"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-name-input"
              required
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="selected-users-section">
              <div className="section-title">Đã chọn ({selectedUsers.length})</div>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <div key={user.userId || user.contactId} className="selected-user-item">
                    <Avatar 
                      src={user.avatar} 
                      alt={user.name || user.username}
                      size="small"
                    />
                    <span className="user-name">{user.name || user.username}</span>
                    <button 
                      className="remove-user-btn"
                      onClick={() => handleUserSelect(user)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="search-users-section">
            <div className="section-title">Thêm thành viên</div>
            <input
              type="text"
              placeholder="Nhập tên, số điện thoại hoặc danh sách số điện thoại"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Users List */}
          <div className="users-list-section">
            <div className="section-subtitle">Gợi ý</div>
            {loading || searching ? (
              <div className="loading-state">
                {searching ? 'Đang tìm kiếm...' : 'Đang tải...'}
              </div>
            ) : (
              <div className="users-list">
                {users.map(user => {
                  const userId = user.userId || user.contactId;
                  const isSelected = selectedUsers.some(u => (u.userId || u.contactId) === userId);
                  return (
                    <div 
                      key={user.userId || user.contactId} 
                      className={`user-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="user-checkbox">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleUserSelect(user)}
                        />
                      </div>
                      <Avatar 
                        src={user.avatar} 
                        alt={user.name || user.username}
                        size="medium"
                      />
                      <div className="user-info">
                        <div className="user-name">{user.name || user.username}</div>
                        {user.username && user.name && (
                          <div className="user-username">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleClose}>
            Hủy
          </button>
          <button 
            className="create-btn" 
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0 || !groupName.trim() || loading}
          >
            {loading ? 'Đang tạo...' : selectedUsers.length === 1 ? 'Tạo cuộc trò chuyện' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

export default CreateGroupModal;