import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import Avatar from '../shared/Avatar';

const WindowChat = ({ conversation, currentUser, onToggleInfoPanel, isInfoPanelOpen }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, loadMessages, sendMessage } = useChat();

  // Lấy tin nhắn cho conversation hiện tại
  const currentMessages = conversation ? messages[conversation.id] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  // Load messages khi conversation thay đổi
  useEffect(() => {
    if (conversation && conversation.id) {
      console.log('WindowChat - Loading messages for conversation:', conversation.id);
      loadMessages(conversation.id);
    }
  }, [conversation, loadMessages]);

  console.log('WindowChat - Current conversation:', conversation);
  console.log('WindowChat - Current messages:', currentMessages);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && conversation) {
      try {
        await sendMessage(conversation.id, newMessage.trim());
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        // Có thể hiển thị notification lỗi ở đây
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!conversation) {
    return (
      <div className="chat-window">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
          fontSize: '18px'
        }}>
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <Avatar 
          src={conversation.avatar} 
          alt={conversation.title}
          size="medium"
        />
        <div className="chat-window-info">
          <h3 className="chat-window-name">{conversation.title}</h3>
          <p className="chat-window-status">
            {conversation.isGroup ? `${conversation.memberCount || 3} members` : 'Active now'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.closest('button').style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.closest('button').style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h9v14z"/>
            </svg>
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.closest('button').style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.closest('button').style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
              <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
          <button 
            onClick={onToggleInfoPanel}
            style={{
              background: isInfoPanelOpen ? '#3b82f6' : 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isInfoPanelOpen) {
                e.target.closest('button').style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isInfoPanelOpen) {
                e.target.closest('button').style.backgroundColor = 'transparent';
              }
            }}
            title="Thông tin cuộc trò chuyện"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isInfoPanelOpen ? 'white' : '#6b7280'}>
              <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2ZM13,17H11V15H13V17ZM13,13H11V7H13V13Z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {currentMessages.map((message) => (
          <div key={message.messageId || message.id} className={`message ${message.isOwn ? 'own' : ''}`}>
            {!message.isOwn && (
              <div className="message-avatar">
                <img 
                  src={message.senderAvatar || '/public/sidebar/boy.png'} 
                  alt={message.senderName || 'Avatar'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    e.target.src = '/public/sidebar/boy.png';
                  }}
                />
              </div>
            )}
            <div className="message-content">
              {!message.isOwn && conversation.isGroup && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#3b82f6', 
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  {message.senderName}
                </div>
              )}
              <div>{message.content || message.text}</div>
              <div className="message-time">
                {formatTime(message.sentAt || message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper">
            <button 
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button 
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
            <button
              type="submit"
              className="chat-send-button"
              disabled={!newMessage.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WindowChat;
