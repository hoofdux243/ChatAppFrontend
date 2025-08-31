import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import Avatar from '../shared/Avatar';

const ChatList = ({ onSelectConversation, selectedConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { conversations, loading, error, loadConversations } = useChat();

  // Reload conversations khi component mount
  useEffect(() => {
    if (conversations.length === 0) {
      loadConversations();
    }
  }, [conversations.length, loadConversations]);

  const filteredConversations = conversations.filter(conv =>
    (conv.title || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const handleConversationClick = (conversation) => {
    onSelectConversation(conversation);
  };

  const handleRefresh = () => {
    loadConversations();
  };

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
      
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search conversations..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="chat-list-items">
        {filteredConversations.map((conversation) => (
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
              <p className="chat-item-message">{conversation.lastMessage || 'Chưa có tin nhắn'}</p>
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
    </div>
  );
};

export default ChatList;
