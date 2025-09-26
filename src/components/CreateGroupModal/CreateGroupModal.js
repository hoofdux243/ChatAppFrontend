import React, { useState, useEffect } from 'react';
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
    }
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
          { contactId: 'fallback1', name: 'Vũ 3', username: 'vu3', avatar: null },
          { contactId: 'fallback2', name: 'Test User', username: 'testuser', avatar: null }
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
      const isSelected = prev.some(u => u.contactId === user.contactId);
      if (isSelected) {
        return prev.filter(u => u.contactId !== user.contactId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Vui lòng nhập tên nhóm và chọn ít nhất 1 thành viên');
      return;
    }

    try {
      setLoading(true);
      const groupData = {
        name: groupName.trim(),
        memberIds: selectedUsers.map(user => user.contactId)
      };
      
      await onCreateGroup(groupData);
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Lỗi tạo nhóm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h3>Tạo nhóm</h3>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Group Name Input */}
          <div className="group-name-section">
            <input
              type="text"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-name-input"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="selected-users-section">
              <div className="section-title">Đã chọn ({selectedUsers.length})</div>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <div key={user.contactId} className="selected-user-item">
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
                  const isSelected = selectedUsers.some(u => u.contactId === user.contactId);
                  return (
                    <div 
                      key={user.contactId} 
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
            disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
          >
            {loading ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;