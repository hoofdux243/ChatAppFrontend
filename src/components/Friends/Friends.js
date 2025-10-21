import React, { useState, useEffect } from 'react';
import { IoPeopleOutline, IoPersonAddOutline, IoPeople } from 'react-icons/io5';
import Avatar from '../shared/Avatar';
import chatService from '../../services/chatService';
import { formatLastSeen } from '../../utils/timeUtils';
import './Friends.css';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'groups', 'requests'
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);


  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'friends') {
      loadContacts();
    }
  }, [activeTab]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Gọi API thực để lấy danh sách contacts
      const contactsData = await chatService.getContacts();
      console.log('Contacts response:', contactsData);
      
      // Xử lý dữ liệu từ API
      const processedContacts = contactsData.map(contact => ({
        contactId: contact.id || contact.contactId,
        name: contact.name || contact.username,
        username: contact.username,
        avatar: contact.avatar || contact.profilePicture,
        online: contact.isOnline || contact.online || false,
        lastSeen: contact.lastSeen ? formatLastSeen(contact.lastSeen) : null
      }));
      
      setContacts(processedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      
      // Fallback to mock data if API fails
      const mockContacts = [
        {
          contactId: '1',
          name: 'An Nguyen',
          username: 'an_nguyen',
          avatar: null,
          online: true,
          lastSeen: null
        },
        {
          contactId: '2', 
          name: 'Anh Pha',
          username: 'anh_pha',
          avatar: null,
          online: false,
          lastSeen: '2 giờ trước'
        }
      ];
      
      setContacts(mockContacts);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFriends = () => (
    <div className="friends-content">
      <div className="friends-search">
        <input
          type="text"
          placeholder="Tìm bạn"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="friends-search-input"
        />
      </div>

      {loading ? (
        <div className="friends-loading">Đang tải...</div>
      ) : (
        <div className="friends-list">
          {filteredContacts.length === 0 ? (
            <div className="friends-empty">
              {searchTerm ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.contactId} className="friend-item">
                <Avatar 
                  src={contact.avatar} 
                  alt={contact.name || contact.username}
                  size="medium"
                />
                <div className="friend-info">
                  <div className="friend-name">{contact.name || contact.username}</div>
                  <div className="friend-status">
                    {contact.online ? (
                      <span className="status-online">Đang hoạt động</span>
                    ) : (
                      <span className="status-offline">
                        {contact.lastSeen ? `Hoạt động ${contact.lastSeen}` : 'Ngoại tuyến'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="friend-actions">
                  <button className="friend-action-btn" title="Nhắn tin">
                    💬
                  </button>
                  <button className="friend-action-btn" title="Thêm thông tin">
                    ⋯
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderGroups = () => (
    <div className="friends-content">
      <div className="friends-empty">Chức năng nhóm đang phát triển</div>
    </div>
  );

  const renderRequests = () => (
    <div className="friends-content">
      <div className="friends-empty">Chức năng lời mời kết bạn đang phát triển</div>
    </div>
  );

  return (
    <div className="friends-container">
      {/* Sidebar nhỏ */}
      <div className="friends-sidebar">
        <div className="friends-sidebar-header">
          <h2>Bạn bè</h2>
        </div>
        
        <div className="friends-sidebar-menu">
          <div 
            className={`friends-sidebar-item ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <IoPeopleOutline size={20} />
            <span>Danh sách bạn bè</span>
          </div>
          
          <div 
            className={`friends-sidebar-item ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <IoPeople size={20} />
            <span>Nhóm và cộng đồng</span>
          </div>
          
          <div 
            className={`friends-sidebar-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <IoPersonAddOutline size={20} />
            <span>Lời mời kết bạn</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="friends-main">
        <div className="friends-main-header">
          <div className="friends-tab-info">
            {activeTab === 'friends' && (
              <>
                <IoPeopleOutline size={24} />
                <div>
                  <h3>Bạn bè ({filteredContacts.length})</h3>
                  <p>Danh sách bạn bè của bạn</p>
                </div>
              </>
            )}
            {activeTab === 'groups' && (
              <>
                <IoPeople size={24} />
                <div>
                  <h3>Nhóm và cộng đồng</h3>
                  <p>Các nhóm bạn đã tham gia</p>
                </div>
              </>
            )}
            {activeTab === 'requests' && (
              <>
                <IoPersonAddOutline size={24} />
                <div>
                  <h3>Lời mời kết bạn</h3>
                  <p>Lời mời kết bạn đã gửi và nhận</p>
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'groups' && renderGroups()}
        {activeTab === 'requests' && renderRequests()}
      </div>
    </div>
  );
};

export default Friends;