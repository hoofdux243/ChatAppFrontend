import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { FaSmile, FaImage, FaPaperclip, FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext';
import Avatar from '../shared/Avatar';
import DateSeparator from '../shared/DateSeparator';
import ImageModal from '../shared/ImageModal';
import { formatMessageTime, groupMessagesByDate } from '../../utils/messageUtils';
import { formatLastSeen } from '../../utils/timeUtils';
import webSocketService from '../../services/webSocketService';
import WebSocketHelper from '../../utils/webSocketHelper';
import '../../assets/css/WindowChat.css';

// Component tối ưu cho user status để tránh re-render không cần thiết
const UserStatus = memo(({ conversation }) => (
  <div className="chat-window-status" style={{ display: 'flex', alignItems: 'center' }}>
    {conversation.type === 'group' || conversation.isGroup ? (
      `${conversation.memberCount || 3} thành viên`
    ) : (
      // Private chat - hiển thị status với chấm xanh
      conversation.isOnline ? (
        <>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            marginRight: '6px'
          }}></div>
          Đang hoạt động
        </>
      ) : conversation.lastSeen ? (
        formatLastSeen(conversation.lastSeen)
      ) : (
        'Offline'
      )
    )}
  </div>
));

const WindowChat = ({ conversation, currentUser, onToggleInfoPanel, isInfoPanelOpen, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const imageInputRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const { messages, loadMessages, addMessage, sendMessage, sendImageMessage, user } = useChat();

  // Lấy tin nhắn cho conversation hiện tại - chỉ theo dõi ID và messages
  const currentMessages = useMemo(() => {
    const msgs = conversation ? messages[conversation.id] || [] : [];
    return msgs;
  }, [conversation?.id, messages]); // Chỉ theo dõi conversation.id

  // Group messages by date để hiển thị date separators
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(currentMessages);
  }, [currentMessages]);

  // Khi conversation ID thay đổi (không phải status), load messages và scroll xuống cuối
  useEffect(() => {
    console.log(`🔄 [DEBUG] WindowChat useEffect triggered for conversation:`, {
      conversationId: conversation?.id,
      conversationName: conversation?.name,
      userName: user?.username,
      webSocketExists: !!webSocketService,
      webSocketConnected: webSocketService?.isConnected()
    });
    
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

      // Subscribe to WebSocket messages for this conversation
      let subscription = null;
      
      console.log(`🔍 [DEBUG] WebSocket connection check for conversation ${conversation.id}:`, {
        webSocketService: !!webSocketService,
        isConnected: webSocketService?.isConnected(),
        clientExists: !!webSocketService?.client,
        clientConnected: webSocketService?.client?.connected,
        conversationId: conversation.id,
        currentUser: user?.username,
        windowId: `window-${Date.now().toString().slice(-4)}` // Unique identifier per window
      });
      
      // If WebSocket is disconnected, attempt auto-reconnection
      if (webSocketService && !webSocketService.isConnected()) {
        console.log(`🔄 [DEBUG] WebSocket disconnected, attempting auto-reconnection for user ${user?.username}`);
        
        // Try to reconnect
        webSocketService.connect(user?.username).then(() => {
          console.log(`✅ [DEBUG] Auto-reconnection successful for ${user?.username}`);
          
          // After successful reconnection, subscribe to messages
          if (webSocketService.isConnected()) {
            subscription = webSocketService.subscribeToMessages(conversation.id, (newMessage) => {
              console.log(`📨 [${user?.username}] RECEIVED message in window for chatroom ${conversation.id}:`, {
                messageId: newMessage.messageId,
                content: newMessage.content.substring(0, 20),
                sender: newMessage.senderUsername,
                sentAt: newMessage.sentAt
              });
              addMessage(conversation.id, newMessage);
            });
          }
        }).catch(error => {
          console.error(`❌ [DEBUG] Auto-reconnection failed for ${user?.username}:`, error);
        });
      }
      
      // Expose debug methods to window for manual debugging
      window.debugWebSocket = {
        checkConnection: () => WebSocketHelper.checkConnection(),
        forceReconnect: () => WebSocketHelper.forceReconnect(),
        testConnection: () => WebSocketHelper.testConnection(),
        manualReconnect: async () => {
          console.log(`🔧 [MANUAL] Starting manual WebSocket reconnection for ${user?.username}`);
          try {
            await webSocketService.connect(user?.username);
            console.log(`✅ [MANUAL] Manual reconnection successful`);
            return true;
          } catch (error) {
            console.error(`❌ [MANUAL] Manual reconnection failed:`, error);
            return false;
          }
        }
      };
      
      // Expose WebSocket service for testing
      window.webSocketService = webSocketService;
      
      if (webSocketService && webSocketService.isConnected()) {
        console.log(`✅ [DEBUG] WebSocket is connected, subscribing to chatroom ${conversation.id} for user ${user?.username}`);
        subscription = webSocketService.subscribeToMessages(conversation.id, (newMessage) => {
          console.log(`📨 [${user?.username}] RECEIVED message in window for chatroom ${conversation.id}:`, {
            messageId: newMessage.messageId,
            content: newMessage.content.substring(0, 20),
            sender: newMessage.senderUsername,
            sentAt: newMessage.sentAt
          });
          console.log(`📨 [${user?.username}] Message sender: ${newMessage.senderName}, current user: ${user?.username}`);
          addMessage(conversation.id, newMessage);
        });
      } else {
        console.log(`⚠️ [DEBUG] WebSocket not available for subscription to chatroom ${conversation.id}`, {
          hasService: !!webSocketService,
          isConnected: webSocketService?.isConnected()
        });
      }

      // Cleanup subscription when conversation changes
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    } else {
      // Reset loading state khi không có conversation
      setIsInitialLoading(false);
    }
  }, [conversation?.id, loadMessages, addMessage, user?.username]); // Remove webSocketService dependency

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

  // Cleanup preview URL khi component unmount
  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log(`🖱️ [DEBUG] handleSendMessage triggered:`, {
      hasSelectedImage: !!selectedImage,
      messageContent: newMessage,
      conversationId: conversation?.id
    });
    
    if (selectedImage && conversation) {
      // Gửi ảnh
      console.log(`🖼️ [DEBUG] Sending image message`);
      try {
        await sendImageMessage(conversation.id, selectedImage);
        handleRemoveImage();
        // Force re-render để cập nhật UI ngay lập tức
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error('Error sending image:', error);
      }
    } else if (newMessage.trim() && conversation) {
      // Gửi text message
      console.log(`💬 [DEBUG] Sending text message from user ${user?.username}:`, {
        content: newMessage.trim(),
        conversationId: conversation.id,
        windowId: `window-${Date.now().toString().slice(-4)}`
      });
      try {
        await sendMessage(conversation.id, newMessage.trim());
        console.log(`✅ [DEBUG] Text message sent successfully`);
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

  // Function xử lý chọn ảnh
  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  // Function xử lý khi file được chọn
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Tạo preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImagePreview(previewUrl);
      
      // Clear text message khi chọn ảnh
      setNewMessage('');
    }
  };

  // Function xóa ảnh đã chọn
  const handleRemoveImage = () => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImage(null);
    setSelectedImagePreview(null);
    // Reset input file
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Function mở modal xem ảnh
  const handleImageClick = (imageSrc) => {
    setImageModalSrc(imageSrc);
    setImageModalOpen(true);
  };

  // Function đóng modal
  const handleCloseModal = () => {
    setImageModalOpen(false);
    setImageModalSrc('');
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
        {onBack && (
          <button 
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              marginRight: '8px'
            }}
            onMouseEnter={(e) => e.target.closest('button').style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.closest('button').style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        )}
        <Avatar 
          src={conversation.avatar} 
          alt={conversation.title}
          size="medium"
        />
        <div className="chat-window-info">
          <h3 className="chat-window-name">{conversation.title || conversation.name}</h3>
          <UserStatus conversation={conversation} />
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
            {groupedMessages.map((item) => (
              item.type === 'date-separator' ? (
                <DateSeparator key={item.uniqueId} date={item.date} />
              ) : (
                <div key={item.uniqueId} className={`message ${item.isOwn ? 'own' : ''}`}>
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
                  {item.messageType === 'IMAGE' ? (
                    <div className="message-image">
                      <img 
                        src={item.content || item.text} 
                        alt="Shared image"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleImageClick(item.content || item.text)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="image-error" style={{display: 'none'}}>
                        Không thể tải hình ảnh
                      </div>
                      <div className="message-time">
                        {formatMessageTime(item.sentAt || item.timestamp)}
                      </div>
                    </div>
                  ) : (
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
                  )}
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
          <button type="button" onClick={handleImageSelect} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaImage size={22} color="#6b7280" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaPaperclip size={22} color="#6b7280" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaMicrophone size={22} color="#6b7280" />
          </button>
        </div>
        
        {/* Hidden input file */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        <form onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedImagePreview ? (
              // Hiển thị ảnh preview trong input area
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <img
                  src={selectedImagePreview}
                  alt="Preview"
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'cover',
                    borderRadius: '6px'
                  }}
                />
                <span style={{ flex: 1, fontSize: '14px', color: '#6b7280' }}>
                  Ảnh đã chọn
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#ef4444',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Xóa ảnh"
                >
                  ✕
                </button>
              </div>
            ) : (
              // Hiển thị input text bình thường
              <input
                type="text"
                placeholder="Type a message..."
                className="chat-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1 }}
              />
            )}
            <button 
              type="submit" 
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '4px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                opacity: (!newMessage.trim() && !selectedImage) ? 0.5 : 1
              }} 
              disabled={!newMessage.trim() && !selectedImage}
              title={selectedImage ? 'Gửi ảnh' : 'Gửi tin nhắn'}
            >
              <FaPaperPlane size={22} color="#3b82f6" />
            </button>
          </div>
        </form>
      </div>

      {/* Image Modal */}
      <ImageModal 
        isOpen={imageModalOpen}
        imageSrc={imageModalSrc}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default memo(WindowChat);
