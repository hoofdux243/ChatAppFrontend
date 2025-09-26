import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import chatService from '../../services/chatService';
import Avatar from '../shared/Avatar';
import CreateGroupModal from '../CreateGroupModal/CreateGroupModal';
import '../../assets/css/ChatList.css';

const ChatList = ({ onSelectConversation, selectedConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' hoặc 'messages'
  const [chatSearchResults, setChatSearchResults] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const { conversations, loading, error, loadConversations } = useChat();

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
      // TODO: Implement create group API call
      const response = await chatService.createGroup(groupData);
      
      if (response && response.result) {
        // Refresh conversations to show new group
        await loadConversations();
        
        // Optionally select the new group
        const newGroup = {
          id: response.result.id,
          title: groupData.name,
          avatar: null,
          lastMessage: 'Nhóm đã được tạo',
          timestamp: 'Vừa xong',
          isGroup: true,
          memberCount: groupData.memberIds.length + 1, // +1 for current user
          unreadCount: 0
        };
        
        onSelectConversation(newGroup);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
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
              setSearchResults(results.result.data);
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
    if (conversations.length === 0) {
      loadConversations();
    }
  }, [conversations.length, loadConversations]);

  const handleConversationClick = (conversation) => {
    onSelectConversation(conversation);
  };

  const handleUserClick = (user) => {
    // Create a temporary conversation object for the selected user
    const userConversation = {
      id: `user_${user.id}`,
      title: user.name || user.username,
      avatar: user.avatar,
      lastMessage: 'Nhấn để bắt đầu trò chuyện',
      timestamp: '',
      isGroup: false,
      memberCount: 2,
      unreadCount: 0,
      isUserChat: true,
      userId: user.id
    };
    onSelectConversation(userConversation);
    setSearchTerm('');
    setShowSearchResults(false);
    setActiveTab('contacts'); // Reset về tab mặc định
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

  // Separate friends and strangers
  const friends = searchResults.filter(user => user.isContact === true);
  const strangers = searchResults.filter(user => user.isContact === false);

  if (loading && conversations.length === 0) {
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
                {friends.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Bạn bè ({friends.length})
                    </div>
                    {friends.map((user) => (
                      <div
                        key={`friend_${user.id}`}
                        className="chat-item"
                        onClick={() => handleUserClick(user)}
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
                
                {strangers.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Người lạ ({strangers.length})
                    </div>
                    {strangers.map((user) => (
                      <div
                        key={`stranger_${user.id}`}
                        className="chat-item"
                        onClick={() => handleUserClick(user)}
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
                
                {searchResults.length === 0 && !isSearching && searchTerm.trim() && (
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
                {chatSearchResults.length > 0 ? (
                  <div>
                    <div style={{ 
                      padding: '12px 20px 8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Cuộc trò chuyện ({chatSearchResults.length})
                    </div>
                    {chatSearchResults.map((conversation) => (
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
          conversations.map((conversation) => (
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
          ))
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default ChatList;
