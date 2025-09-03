import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaSmile, FaImage, FaPaperclip, FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';
import Avatar from '../shared/Avatar';
import DateSeparator from '../shared/DateSeparator';
import { formatMessageTime, groupMessagesByDate } from '../../utils/messageUtils';
import '../../assets/css/WindowChat.css';

const WindowChat = ({ conversation, currentUser, onToggleInfoPanel, isInfoPanelOpen }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const { messages, loadMessages, sendMessage } = useChat();

  // Lấy tin nhắn cho conversation hiện tại với dependency
  const currentMessages = useMemo(() => {
    const msgs = conversation ? messages[conversation.id] || [] : [];
    console.log('WindowChat - Current messages count:', msgs.length);
    return msgs;
  }, [conversation, messages]);

  // Group messages by date để hiển thị date separators
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(currentMessages);
  }, [currentMessages]);

  // Khi conversation thay đổi, load messages và scroll xuống cuối
  useEffect(() => {
    if (conversation && conversation.id) {
      setIsInitialLoading(true);
      setPage(0);
      setHasNextPage(true);
      loadMessages(conversation.id, 0).then((result) => {
        if (result && result.pagination) {
          setHasNextPage(result.pagination.hasNext);
        }
        setIsInitialLoading(false);
      }).catch(() => {
        setIsInitialLoading(false);
      });
    } else {
      // Reset loading state khi không có conversation
      setIsInitialLoading(false);
    }
  }, [conversation, loadMessages]);

  // Scroll về cuối khi vừa vào chatroom (page = 0), giữ vị trí khi lazy loading
  useEffect(() => {
    if (chatMessagesRef.current && page === 0) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
    // Nếu vừa load thêm trang cũ, giữ nguyên vị trí scroll
    if (chatMessagesRef.current && page > 0 && prevScrollHeightRef.current) {
      const newScrollHeight = chatMessagesRef.current.scrollHeight;
      chatMessagesRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [conversation, currentMessages, page]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && conversation) {
      try {
        await sendMessage(conversation.id, newMessage.trim());
        setNewMessage('');
        // Force re-render để cập nhật UI ngay lập tức
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
        // Có thể hiển thị notification lỗi ở đây
      }
    }
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

      <div className="chat-messages" ref={chatMessagesRef} style={{ overflowY: 'auto', height: '400px' }}
        onScroll={async (e) => {
          if (e.target.scrollTop === 0 && !isLoadingMore && hasNextPage && currentMessages.length > 0) {
            prevScrollHeightRef.current = chatMessagesRef.current.scrollHeight;
            setIsLoadingMore(true);
            const nextPage = page + 1;
            const result = await loadMessages(conversation.id, nextPage);
            if (result && result.pagination) {
              setHasNextPage(result.pagination.hasNext);
            }
            setPage(nextPage);
            setIsLoadingMore(false);
          }
        }}>
        {isInitialLoading ? (
          // Hiển thị loading spinner khi đang load messages lần đầu
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: '#6b7280'
          }}>
            <div style={{
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            marginTop: '40px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <Avatar src={conversation.avatar} alt={conversation.title} size="large" />
            <h3 style={{ margin: '16px 0 8px', fontWeight: 600 }}>{conversation.title}</h3>
            <p style={{ color: '#6b7280', marginBottom: '8px', textAlign: 'center' }}>{conversation.description || 'Hãy bắt đầu cùng nhau chia sẻ những điều thú vị!'}</p>
            {conversation.isGroup ? (
              <p style={{ color: '#3b82f6', fontWeight: 500 }}>
                {conversation.memberCount} thành viên
              </p>
            ) : (
              <p style={{ color: '#3b82f6', fontWeight: 500 }}>
                Gửi tin nhắn để bắt đầu đoạn chat
              </p>
            )}
          </div>
        ) : (
          <>
            {groupedMessages.map((item, index) => (
              item.type === 'date-separator' ? (
                <DateSeparator key={`date-${index}`} date={item.date} />
              ) : (
                <div key={item.messageId || item.id} className={`message ${item.isOwn ? 'own' : ''}`}>
                  {!item.isOwn && (
                    <div className="message-avatar">
                      <img 
                        src={item.senderAvatar || '/public/sidebar/boy.png'} 
                        alt={item.senderName || 'Avatar'}
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
                    {!item.isOwn && conversation.isGroup && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#3b82f6', 
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        {item.senderName}
                      </div>
                    )}
                    <div>{item.content || item.text}</div>
                    <div className="message-time">
                      {formatMessageTime(item.sentAt || item.timestamp)}
                    </div>
                  </div>
                </div>
              )
            ))}
            <div ref={messagesEndRef} />
          </>
          
        )}

      </div>

      <div className="chat-input-container">
        {/* Thanh icon riêng phía trên thanh nhập */}
        <div className="chat-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaSmile size={22} color="#6b7280" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaImage size={22} color="#6b7280" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaPaperclip size={22} color="#6b7280" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaMicrophone size={22} color="#6b7280" />
          </button>
        </div>
        <form onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              className="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} disabled={!newMessage.trim()}>
              <FaPaperPlane size={22} color="#3b82f6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WindowChat;
