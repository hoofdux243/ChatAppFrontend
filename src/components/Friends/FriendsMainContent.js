import React, { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import chatService from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import './FriendsMainContent.css';

const FriendsMainContent = ({ activeTab, onSelectChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [friendRequestsLoaded, setFriendRequestsLoaded] = useState(false);
  const [sentRequestsLoaded, setSentRequestsLoaded] = useState(false);
  
  const { isAuthenticated } = useAuth();

  // Clear cache khi user logout
  useEffect(() => {
    if (!isAuthenticated) {
      setContacts([]);
      setGroups([]);
      setFriendRequests([]);
      setSentRequests([]);
      setContactsLoaded(false);
      setGroupsLoaded(false);
      setFriendRequestsLoaded(false);
      setSentRequestsLoaded(false);
      setSearchTerm('');
      console.log('FriendsMainContent: Cache cleared on logout');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'friends' && !contactsLoaded) {
      loadContacts();
    } else if (activeTab === 'groups' && !groupsLoaded) {
      loadGroups();
    } else if (activeTab === 'friend-requests' && !friendRequestsLoaded) {
      loadFriendRequests();
    } else if (activeTab === 'sent-requests' && !sentRequestsLoaded) {
      loadSentRequests();
    }
    
    // Reset search term khi chuyển tab
    setSearchTerm('');
  }, [activeTab, contactsLoaded, groupsLoaded, friendRequestsLoaded, sentRequestsLoaded]);

  // Debounce search - chỉ khi có searchTerm
  useEffect(() => {
    if (!searchTerm) return; // Không search nếu không có keyword
    
    const timeoutId = setTimeout(() => {
      if (activeTab === 'friends') {
        loadContacts(searchTerm);
      } else if (activeTab === 'groups') {
        loadGroups(searchTerm);
      } else if (activeTab === 'friend-requests') {
        loadFriendRequests(searchTerm);
      } else if (activeTab === 'sent-requests') {
        loadSentRequests(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  const loadContacts = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await chatService.getContacts(keyword);
      
      if (response && response.result && response.result.contacts) {
        setContacts(response.result.contacts);
      }
      setContactsLoaded(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Fallback data với filter theo keyword
      const fallbackData = [
        { contactId: '1', name: 'An Nguyen', username: 'an_nguyen', avatar: null, online: true },
        { contactId: '2', name: 'Anh Pha', username: 'anh_pha', avatar: null, online: false },
        { contactId: '3', name: 'Anh Thu', username: 'anh_thu', avatar: null, online: true }
      ];
      
      if (keyword) {
        const filtered = fallbackData.filter(contact => 
          contact.name.toLowerCase().includes(keyword.toLowerCase()) ||
          contact.username.toLowerCase().includes(keyword.toLowerCase())
        );
        setContacts(filtered);
      } else {
        setContacts(fallbackData);
      }
      setContactsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await chatService.getPublicChatrooms(keyword);
      
      if (response && response.result) {
        setGroups(response.result);
      }
      setGroupsLoaded(true);
    } catch (error) {
      console.error('Error loading groups:', error);
      // Fallback data
      const fallbackData = [
        { 
          chatRoomId: 'g1', 
          chatRoomName: 'g1', 
          roomType: 'PUBLIC',
          chatRoomAvatar: 'https://res.cloudinary.com/dzt55a6ah/image/upload/v1757038563/chat-app/messages/oqlnc411cemznjlsa5crb.jpg',
          memberCount: 3,
          updatedAt: '2025-09-14T08:31:452',
          lastMessage: {
            messageId: '4456971ac-a5e3-4758-9a3d-489966eaae97',
            content: 'https://res.cloudinary.com/dzt55a6ah/image/upload/v1757038563/chat-app/messages/oqlnc411cemznjlsa5crb.jpg',
            senderName: 'Vũ 3',
            sentAt: '2025-09-14T08:31:452',
            messageType: 'IMAGE',
            readCount: 0,
            lastRead: false
          }
        }
      ];
      
      if (keyword) {
        const filtered = fallbackData.filter(group => 
          group.chatRoomName.toLowerCase().includes(keyword.toLowerCase())
        );
        setGroups(filtered);
      } else {
        setGroups(fallbackData);
      }
      setGroupsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await chatService.getFriendRequesters();
      
      if (response && response.result) {
        let requestsData = response.result;
        
        // Filter by keyword if provided
        if (keyword) {
          requestsData = requestsData.filter(request => 
            (request.requesterUsername || '').toLowerCase().includes(keyword.toLowerCase()) ||
            (request.requesterId || '').toLowerCase().includes(keyword.toLowerCase())
          );
        }
        
        setFriendRequests(requestsData);
      } else {
        setFriendRequests([]);
      }
      setFriendRequestsLoaded(true);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
      setFriendRequestsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSentRequests = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await chatService.getFriendRecipients();
      
      if (response && response.result) {
        let requestsData = response.result;
        
        // Filter by keyword if provided
        if (keyword) {
          requestsData = requestsData.filter(request => 
            (request.requesterUsername || '').toLowerCase().includes(keyword.toLowerCase()) ||
            (request.recipientId || '').toLowerCase().includes(keyword.toLowerCase())
          );
        }
        
        setSentRequests(requestsData);
      } else {
        setSentRequests([]);
      }
      setSentRequestsLoaded(true);
    } catch (error) {
      console.error('Error loading sent requests:', error);
      setSentRequests([]);
      setSentRequestsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await chatService.acceptFriendRequest(requesterId);
      alert('Đã chấp nhận lời mời kết bạn!');
      // Refresh the requests list
      setFriendRequestsLoaded(false);
      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Có lỗi xảy ra khi chấp nhận lời mời');
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      // TODO: Implement reject friend request API
      console.log('Rejecting friend request from:', requesterId);
      alert('Đã từ chối lời mời kết bạn!');
      // Refresh the requests list
      setFriendRequestsLoaded(false);
      loadFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Có lỗi xảy ra khi từ chối lời mời');
    }
  };

  const handleCancelRequest = async (recipientId) => {
    try {
      // TODO: Implement cancel friend request API
      console.log('Canceling friend request to:', recipientId);
      alert('Đã hủy lời mời kết bạn!');
      // Refresh the sent requests list
      setSentRequestsLoaded(false);
      loadSentRequests();
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Có lỗi xảy ra khi hủy lời mời');
    }
  };

  const renderFriendsContent = () => (
    <>
      <div className="friends-header">
        <h2>Bạn bè ({contacts.length})</h2>
        <div className="header-actions">
          <button className="btn-secondary">Tìm (A-Z)</button>
          <button className="btn-primary">Tất cả</button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Tìm bạn"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="content-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : contacts.length === 0 && searchTerm ? (
          <div className="no-results">
            <p>Không tìm thấy bạn bè nào với từ khóa "{searchTerm}"</p>
          </div>
        ) : (
          <div className="friends-list">
            {contacts.map(contact => (
              <div key={contact.contactId} className="friend-item">
                <Avatar 
                  src={contact.avatar} 
                  alt={contact.name || contact.username}
                  size="medium"
                />
                <div className="friend-info">
                  <div className="friend-name">{contact.name || contact.username}</div>
                  <div className="friend-status">
                    {contact.online ? 'Đang hoạt động' : '2 giờ trước'}
                  </div>
                </div>
                <div className="friend-actions">
                  <button className="action-btn message-btn">Nhắn tin</button>
                  <button className="action-btn more-btn">•••</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderGroupsContent = () => (
    <>
      <div className="friends-header">
        <h2>Danh sách nhóm và cộng đồng ({groups.length})</h2>
        <div className="header-actions">
          <button className="btn-primary">Tạo nhóm</button>
        </div>
      </div>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="Tìm nhóm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="content-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : groups.length === 0 && searchTerm ? (
          <div className="no-results">
            <p>Không tìm thấy nhóm nào với từ khóa "{searchTerm}"</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Chưa có nhóm nào</h3>
            <p>Tạo nhóm để trò chuyện với nhiều bạn bè cùng lúc</p>
            <button className="btn-primary">Tạo nhóm mới</button>
          </div>
        ) : (
          <div className="friends-list">
            {groups.map(group => (
              <div 
                key={group.chatRoomId} 
                className="friend-item clickable"
                onClick={() => onSelectChat && onSelectChat(group)}
              >
                <Avatar 
                  src={group.chatRoomAvatar} 
                  alt={group.chatRoomName}
                  size="medium"
                />
                <div className="friend-info">
                  <div className="friend-name">{group.chatRoomName}</div>
                  <div className="friend-status">
                    {group.memberCount} thành viên
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderRequestsContent = () => (
    <>
      <div className="friends-header">
        <h2>Lời mời kết bạn ({friendRequests.length})</h2>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Tìm lời mời"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="content-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : friendRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📩</div>
            <h3>Không có lời mời kết bạn nào</h3>
            <p>Khi có người gửi lời mời kết bạn, chúng sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="friends-list">
            {friendRequests.map(request => (
              <div key={request.id} className="friend-item">
                <Avatar 
                  src={null} 
                  alt={request.requesterUsername}
                  size="medium"
                />
                <div className="friend-info">
                  <div className="friend-name">{request.requesterUsername}</div>
                  <div className="friend-status">
                    Gửi lời mời {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="friend-actions">
                  <button 
                    className="action-btn accept-btn"
                    onClick={() => handleAcceptRequest(request.requesterId)}
                  >
                    Chấp nhận
                  </button>
                  <button 
                    className="action-btn reject-btn"
                    onClick={() => handleRejectRequest(request.requesterId)}
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderSentRequestsContent = () => (
    <>
      <div className="friends-header">
        <h2>Lời mời kết bạn đã gửi ({sentRequests.length})</h2>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Tìm lời mời đã gửi"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="content-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : sentRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📤</div>
            <h3>Chưa gửi lời mời kết bạn nào</h3>
            <p>Các lời mời kết bạn bạn đã gửi sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="friends-list">
            {sentRequests.map(request => (
              <div key={request.id} className="friend-item">
                <Avatar 
                  src={null} 
                  alt={request.requesterUsername}
                  size="medium"
                />
                <div className="friend-info">
                  <div className="friend-name">{request.requesterUsername}</div>
                  <div className="friend-status">
                    Đã gửi lời mời {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="friend-actions">
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleCancelRequest(request.recipientId)}
                  >
                    Hủy lời mời
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="friends-main-content">
      {activeTab === 'friends' && renderFriendsContent()}
      {activeTab === 'groups' && renderGroupsContent()}
      {activeTab === 'friend-requests' && renderRequestsContent()}
      {activeTab === 'sent-requests' && renderSentRequestsContent()}
    </div>
  );
};

export default FriendsMainContent;
