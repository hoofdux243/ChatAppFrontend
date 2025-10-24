import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import chatService from '../../services/chatService';
import Avatar from '../shared/Avatar';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal';
import UserProfileModal from '../Profile/UserProfileModal';
import { formatLastSeen } from '../../utils/timeUtils';
import '../../assets/css/ChatList.css';

const ChatList = ({ onSelectConversation, selectedConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' hoặc 'messages'
  const [chatSearchResults, setChatSearchResults] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
  const { conversations, loading, error, loadConversations, user } = useChat();

  // Function để format message content dựa vào messageType
  const formatMessageContent = (lastMessage) => {
    if (!lastMessage) return 'Chưa có tin nhắn';
    
    if (lastMessage.messageType === 'IMAGE') {
      return `${lastMessage.senderName} đã gửi 1 ảnh`;
    }
    
    if (lastMessage.senderName && lastMessage.content !== 'Chưa có tin nhắn') {
      return `${lastMessage.senderName}: ${lastMessage.content}`;
    }
    
    return lastMessage.content || 'Chưa có tin nhắn';
  };

  // Handle create group
  const handleCreateGroup = async (groupData) => {
    try {
      const response = await chatService.createGroup(groupData);
      
      if (response && response.result) {
        // Refresh conversations to show new chat/group
        await loadConversations();
        
        // Determine chat type and create conversation object
        const isGroupChat = (groupData.memberIds || []).length > 1;
        const conversationTitle = isGroupChat 
          ? (groupData.name || `Nhóm ${(groupData.memberIds || []).length + 1} người`)
          : 'Cuộc trò chuyện mới';
        
        // Create conversation object to select
        const newConversation = {
          id: response.result.chatRoomId || response.result.id,
          chatRoomId: response.result.chatRoomId || response.result.id,
          title: conversationTitle,
          avatar: null,
          lastMessage: isGroupChat ? 'Nhóm đã được tạo' : 'Cuộc trò chuyện đã được tạo',
          timestamp: 'Vừa xong',
          isGroup: isGroupChat,
          roomType: isGroupChat ? 'PUBLIC' : 'PRIVATE',
          memberCount: (groupData.memberIds || []).length + 1, // +1 for current user
          unreadCount: 0
        };
        
        onSelectConversation(newConversation);
        
        // Show success message
        const successMessage = isGroupChat ? 'Tạo nhóm thành công!' : 'Tạo cuộc trò chuyện thành công!';
        alert(successMessage);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error creating group:', error);
      
      // Better error handling and user feedback
      let errorMessage = 'Không thể tạo cuộc trò chuyện';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Debounce search function
  const debounceSearch = useCallback((searchValue, tabType = 'contacts') => {
    const timeoutId = setTimeout(async () => {
      if (searchValue.trim()) {
        setIsSearching(true);
        try {
          if (tabType === 'contacts') {
            // Search users
            const results = await chatService.searchUsers(searchValue);
            
            if (results && results.result && results.result.data) {
              setSearchResults(Array.isArray(results.result.data) ? results.result.data : []);
              setShowSearchResults(true);
            } else {
              setSearchResults([]);
              setShowSearchResults(false);
            }
          } else if (tabType === 'messages') {
            // Search chats - TODO: implement chat search API
            // For now, filter existing conversations
            const filteredChats = conversations.filter(conv =>
              (conv.title || '').toLowerCase().includes(searchValue.toLowerCase())
            );
            setChatSearchResults(filteredChats);
            setShowSearchResults(true);
          }
        } catch (error) {
          console.error('Search error:', error);
          if (tabType === 'contacts') {
            setSearchResults([]);
          } else {
            setChatSearchResults([]);
          }
          setShowSearchResults(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setChatSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    }, 1000); // 1 second delay

    return timeoutId;
  }, [conversations]);

  // Handle search input change
  useEffect(() => {
    const timeoutId = debounceSearch(searchTerm, activeTab);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab, debounceSearch]);

  // Reload conversations khi component mount
  useEffect(() => {
    if ((conversations || []).length === 0) {
      loadConversations();
    }
  }, [(conversations || []).length, loadConversations]);

  const handleConversationClick = (conversation) => {
    onSelectConversation(conversation);
  };

  const handleShowUserProfile = (selectedUser) => {
    setSelectedUserForProfile(selectedUser);
    setShowUserProfileModal(true);
  };

  const handleStartChatFromProfile = async (selectedUser) => {
    try {
      // Get usernames instead of IDs
      const currentUsername = user?.username || user?.id;
      const selectedUsername = selectedUser?.username;
      
      if (!currentUsername || !selectedUsername) {
        console.error('❌ Missing usernames:', { currentUsername, selectedUsername });
        return;
      }
      
      // Call API to get chatroom between current user and selected user using usernames
      let chatroomResponse = null;
      let chatroomId = null;
      
      try {
        chatroomResponse = await chatService.getChatroomByUsernames(currentUsername, selectedUsername);
        
        if (chatroomResponse && chatroomResponse.result && chatroomResponse.result.chatRoomId) {
          chatroomId = chatroomResponse.result.chatRoomId;
        }
        
      } catch (getChatroomError) {
        // Any error means chatroom doesn't exist or can't be accessed
      }
      
      // If no chatroom ID found, create new one
      if (!chatroomId) {
        try {
          // Create new chatroom with selected user's ID
          const memberIds = [selectedUser.id];
          
          const createResponse = await chatService.createChatroom(memberIds);
          
          if (createResponse && createResponse.result && createResponse.result.chatRoomId) {
            chatroomId = createResponse.result.chatRoomId;
          }
          
        } catch (createError) {
          console.error('❌ Error creating chatroom:', createError);
          // Will use fallback behavior below
        }
      }
      
      // If we have a chatroom ID (either existing or newly created)
      if (chatroomId) {
        // Create conversation object with real chatroom ID
        const conversation = {
          id: chatroomId,
          title: selectedUser.name || selectedUser.username,
          avatar: selectedUser.avatar,
          lastMessage: '',
          timestamp: '',
          isGroup: false,
          memberCount: 2,
          unreadCount: 0,
          userId: selectedUser.id
        };
        
        // Select conversation and load messages
        onSelectConversation(conversation);
        
        // Clear search and close modal
        setSearchTerm('');
        setShowSearchResults(false);
        setActiveTab('contacts');
        setShowUserProfileModal(false);
        
      } else {
        // Fallback to old behavior if no chatroom exists
        const userConversation = {
          id: `user_${selectedUser.id}`,
          title: selectedUser.name || selectedUser.username,
          avatar: selectedUser.avatar,
          lastMessage: 'Nhấn để bắt đầu trò chuyện',
          timestamp: '',
          isGroup: false,
          memberCount: 2,
          unreadCount: 0,
          isUserChat: true,
          userId: selectedUser.id
        };
        onSelectConversation(userConversation);
        setSearchTerm('');
        setShowSearchResults(false);
        setActiveTab('contacts');
        setShowUserProfileModal(false);
      }
      
    } catch (error) {
      console.error('❌ Error handling user click:', error);
      
      // Fallback to old behavior on error
      const userConversation = {
        id: `user_${selectedUser.id}`,
        title: selectedUser.name || selectedUser.username,
        avatar: selectedUser.avatar,
        lastMessage: 'Nhấn để bắt đầu trò chuyện',
        timestamp: '',
        isGroup: false,
        memberCount: 2,
        unreadCount: 0,
        isUserChat: true,
        userId: selectedUser.id
      };
      onSelectConversation(userConversation);
      setSearchTerm('');
      setShowSearchResults(false);
      setActiveTab('contacts');
      setShowUserProfileModal(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      setChatSearchResults([]);
      setActiveTab('contacts'); // Reset về tab mặc định khi xóa search
    }
  };

  const handleTabChange = (tab) => {
    // Chỉ thực hiện khi tab thực sự thay đổi
    if (tab === activeTab) {
      return; // Không làm gì nếu click vào tab đang active
    }
    
    setActiveTab(tab);
    // Re-trigger search with current search term for new tab
    if (searchTerm.trim()) {
      setIsSearching(true);
      const timeoutId = debounceSearch(searchTerm, tab);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleRefresh = () => {
    loadConversations();
  };

  // Separate friends and strangers with safety check
  const friends = (searchResults || []).filter(user => user.isContact === true);
  const strangers = (searchResults || []).filter(user => user.isContact === false);

  if (loading && (conversations || []).length === 0) {
    return (
      <div className="chat-list-container">
        <div className="chat-list-header">
          <h2>Chats</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Phiên đăng nhập đã hết hạn');
    
    return (
      <div className="chat-list-container">
        <div className="chat-list-header">
          <h2>Chats</h2>
        </div>
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: isAuthError ? '#f59e0b' : '#ef4444'
        }}>
          {error}
          <br />
          {!isAuthError && (
            <button 
              onClick={handleRefresh}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          )}
          {isAuthError && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
              Hệ thống sẽ tự động chuyển hướng...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowCreateGroupModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
            title="Tạo nhóm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button 
            onClick={handleRefresh}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
            title="Refresh"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearchInputChange}
        />
        {isSearching && (
          <div style={{ 
            position: 'absolute', 
            right: '30px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Đang tìm...
          </div>
        )}
      </div>

      {/* Search Tabs - chỉ hiện khi có search term */}
      {showSearchResults && searchTerm.trim() && (
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={() => handleTabChange('contacts')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'contacts' ? 'white' : 'transparent',
              color: activeTab === 'contacts' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'contacts' ? '600' : '400',
              fontSize: '14px',
              borderBottom: activeTab === 'contacts' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Liên hệ
          </button>
          <button
            onClick={() => handleTabChange('messages')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'messages' ? 'white' : 'transparent',
              color: activeTab === 'messages' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'messages' ? '600' : '400',
              fontSize: '14px',
              borderBottom: activeTab === 'messages' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Tin nhắn
          </button>
        </div>
      )}
      
      <div className="chat-list-items">
        {showSearchResults ? (
          <div>
            {activeTab === 'contacts' ? (
              // Hiển thị kết quả search users
              <>
                {(friends || []).length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Bạn bè ({(friends || []).length})
                    </div>
                    {(friends || []).map((user) => (
                      <div
                        key={`friend_${user.id}`}
                        className="chat-item"
                        onClick={() => handleShowUserProfile(user)}
                      >
                        <Avatar 
                          src={user.avatar} 
                          alt={user.name || user.username}
                          size="medium"
                        />
                        <div className="chat-item-content">
                          <h4 className="chat-item-name">
                            {user.name || user.username}
                          </h4>
                          <p className="chat-item-message" style={{ color: '#22c55e' }}>
                            Bạn bè • Nhấn để nhắn tin
                          </p>
                        </div>
                        <div className="chat-item-right">
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#22c55e' 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {(strangers || []).length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Người lạ ({(strangers || []).length})
                    </div>
                    {(strangers || []).map((user) => (
                      <div
                        key={`stranger_${user.id}`}
                        className="chat-item"
                        onClick={() => handleShowUserProfile(user)}
                      >
                        <Avatar 
                          src={user.avatar} 
                          alt={user.name || user.username}
                          size="medium"
                        />
                        <div className="chat-item-content">
                          <h4 className="chat-item-name">
                            {user.name || user.username}
                          </h4>
                          <p className="chat-item-message" style={{ color: '#6b7280' }}>
                            Người lạ • Nhấn để nhắn tin
                          </p>
                        </div>
                        <div className="chat-item-right">
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#6b7280' 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {(searchResults || []).length === 0 && !isSearching && searchTerm.trim() && (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Không tìm thấy liên hệ nào
                  </div>
                )}
              </>
            ) : (
              // Hiển thị kết quả search tin nhắn
              <>
                {(chatSearchResults || []).length > 0 ? (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Cuộc trò chuyện ({(chatSearchResults || []).length})
                    </div>
                    {(chatSearchResults || []).map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`chat-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <Avatar 
                          src={conversation.avatar} 
                          alt={conversation.title || 'Avatar'}
                          size="medium"
                        />
                        <div className="chat-item-content">
                          <h4 className="chat-item-name">
                            {conversation.title || 'Cuộc trò chuyện'}
                            {conversation.isGroup && (
                              <span style={{ 
                                marginLeft: '6px', 
                                fontSize: '12px', 
                                color: '#6b7280',
                                fontWeight: '400'
                              }}>
                                (Group)
                              </span>
                            )}
                          </h4>
                          <p 
                            className="chat-item-message"
                            style={{ 
                              fontWeight: conversation.lastRead === false ? '600' : 'normal',
                              color: conversation.lastRead === false ? '#1f2937' : '#6b7280'
                            }}
                          >
                            {formatMessageContent(conversation.lastMessage)}
                          </p>

                        </div>
                        <div className="chat-item-right">
                          <span className="chat-item-time">{conversation.timestamp || ''}</span>
                          {(conversation.unreadCount || 0) > 0 && (
                            <span className="chat-item-unread">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Không tìm thấy cuộc trò chuyện nào
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Hiển thị tất cả conversations như bình thường
          (conversations || []).map((conversation) => {
            return (
              <div
                key={conversation.id}
                className={`chat-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <Avatar 
                  src={conversation.avatar} 
                  alt={conversation.title || 'Avatar'}
                  size="medium"
                />
                <div className="chat-item-content">
                  <h4 className="chat-item-name">
                    {conversation.title || 'Cuộc trò chuyện'}
                    {conversation.isGroup && (
                      <span style={{ 
                        marginLeft: '6px', 
                        fontSize: '12px', 
                        color: '#6b7280',
                        fontWeight: '400'
                      }}>
                        (Group)
                      </span>
                    )}
                  </h4>
                  <p 
                    className="chat-item-message"
                    style={{ 
                      fontWeight: conversation.lastRead === false ? '600' : 'normal',
                      color: conversation.lastRead === false ? '#1f2937' : '#6b7280'
                    }}
                  >
                    {formatMessageContent(conversation.lastMessage)}
                  </p>

                </div>
                <div className="chat-item-right">
                  <span className="chat-item-time">{conversation.timestamp || ''}</span>
                  {(conversation.unreadCount || 0) > 0 && (
                    <span className="chat-item-unread">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserForProfile(null);
        }}
        userId={selectedUserForProfile?.id}
        userName={selectedUserForProfile?.name || selectedUserForProfile?.username}
        onSendMessage={() => handleStartChatFromProfile(selectedUserForProfile)}
        onAddFriend={async (action) => {
          try {
            switch (action) {
              case 'ADD_FRIEND':
                await chatService.sendFriendRequest(selectedUserForProfile?.id);
                alert('Gửi lời mời kết bạn thành công!');
                // Refresh profile để cập nhật trạng thái
                setShowUserProfileModal(false);
                setTimeout(() => {
                  setShowUserProfileModal(true);
                }, 100);
                break;
              case 'ACCEPT_FRIEND':
                await chatService.acceptFriendRequest(selectedUserForProfile?.id);
                alert('Đã chấp nhận lời mời kết bạn!');
                // Refresh profile để cập nhật trạng thái
                setShowUserProfileModal(false);
                setTimeout(() => {
                  setShowUserProfileModal(true);
                }, 100);
                break;
              case 'REMOVE_FRIEND':
                // TODO: Implement remove friend API
                alert('Đã hủy kết bạn!');
                break;
              case 'REJECT_FRIEND':
                // TODO: Implement reject friend request API
                alert('Đã từ chối lời mời kết bạn!');
                break;
              case 'CANCEL_REQUEST':
                // TODO: Implement cancel friend request API
                alert('Đã hủy lời mời kết bạn!');
                break;
              default:
                break;
            }
          } catch (error) {
            console.error('Error with friend action:', error);
            if (error.response?.status === 400) {
              alert('Lỗi: ' + (error.response?.data?.message || 'Không thể thực hiện thao tác này'));
            } else if (error.response?.status === 404) {
              alert('Người dùng không tồn tại');
            } else {
              alert('Có lỗi xảy ra, vui lòng thử lại');
            }
          }
        }}
      />
    </div>
  );
};

export default ChatList;
