import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import chatService from '../services/chatService';
import webSocketService from '../services/webSocketService';
import { chatLogger } from '../utils/debugLogger';

// 1. Tạo Context
const ChatContext = createContext();

// 2. Custom hook để dùng
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// 3. Provider
export const ChatProvider = ({ children }) => {
  // Get user from Auth context
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // idConversation => [msg1, msg2,...]
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Remove local user state since we get it from useAuth
  // const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Lấy danh sách conversation
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversationWithIdAccount();
      
      if (response && response.result) {
        // Transform data từ API response
        const transformedConversations = response.result.map(item => {
          return {
            id: item.chatRoomId,
            title: item.chatRoomName || item.chatRoomAvatar || `Chat ${item.chatRoomId.substring(0, 8)}` || 'Cuộc trò chuyện',
            avatar: item.chatRoomAvatar || null,
            lastMessage: item.lastMessage || null,
            lastMessageSender: item.lastMessage ? item.lastMessage.senderName : null,
            timestamp: item.lastMessage ? chatService.formatMessageTime(item.lastMessage.sentAt) : '',
            isGroup: item.roomType === 'PUBLIC', 
            roomType: item.roomType,
            memberCount: item.memberCount,
            unreadCount: item.readCount || 0,
            member: item.member || null, // Contains member info for private chats
            lastRead: item.lastMessage ? item.lastMessage.lastRead : true,
            participants: [],
          };
        });
        
        setConversations(transformedConversations);
      }
    } catch (error) {
      chatLogger.error('Error loading conversations:', error);
      
      // Kiểm tra lỗi 401 (token expired)
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setConversations([]);
      } else {
        setError('Không thể tải danh sách cuộc trò chuyện');
        // Sử dụng mock data nếu API lỗi khác
        setConversations([
          {
            id: 1,
            title: "John Doe",
            avatar: null,
            lastMessage: "Hey, how are you doing?",
            timestamp: "2 min ago",
            isGroup: false,
            unreadCount: 2
          },
          {
            id: 2,
            title: "Team Alpha",
            avatar: null,
            lastMessage: "Meeting at 3 PM today",
            timestamp: "5 min ago",
            isGroup: true,
            unreadCount: 1
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy messages cho một conversation
  const loadMessages = useCallback(async (conversationId, page = 0, size = 20) => {
    try {
      const response = await chatService.getMessagesByIdConversation(conversationId, page, size);
      const messages = response?.result?.data || [];
      
      // Pagination ở cùng level với data, không phải nested
      const pagination = {
        hasNext: response?.result?.hasNext || false,
        hasPrevious: response?.result?.hasPrevious || false,
        page: response?.result?.page || 0,
        totalPages: response?.result?.totalPages || 0,
        totalElements: response?.result?.totalElements || 0
      };
      
      // Transform messages: Test multiple comparison methods  
      const transformedMessages = messages.map(msg => {
        const isOwnByUsername = (msg.senderUsername || msg.senderName) === user?.username;
        const isOwnByUserId = (msg.senderUsername || msg.senderName) === user?.id;
        const isOwnBySenderId = msg.senderId === user?.id;
        
        return {
          ...msg,
          senderUsername: msg.senderUsername || msg.senderName,
          isOwn: isOwnByUsername || isOwnByUserId || isOwnBySenderId
        };
      });
      
      // Backend sends NEWEST → OLDEST, but chat needs OLDEST → NEWEST (newest at bottom)
      const reversedMessages = [...transformedMessages].reverse();
      
      if (page === 0) {
        // Initial load - use reversed array (oldest → newest)
        setMessages(prev => ({
          ...prev,
          [conversationId]: reversedMessages
        }));
      } else {
        // Load older messages (pagination) - prepend reversed messages
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...reversedMessages, ...(prev[conversationId] || [])]
        }));
      }
      
      return {
        data: transformedMessages,
        pagination: pagination
      };
    } catch (error) {
      chatLogger.error('Error loading messages:', error);
      return { data: [], pagination: { hasNext: false } };
    }
  }, [user?.username]);

  // Thêm message mới vào conversation
  const addMessage = useCallback((conversationId, message) => {
    // Validate message object
    if (!message || typeof message !== 'object' || !message.content) {
      chatLogger.message('⚠️ Skipping invalid message:', message);
      return;
    }
    
    // Skip empty messages
    if (!message.content || message.content.trim() === '') {
      chatLogger.message('⚠️ Skipping empty message:', message);
      return;
    }
    
    // Test both comparison methods
    const isOwnByUsername = (message.senderUsername || message.senderName) === user?.username;
    const isOwnByUserId = (message.senderUsername || message.senderName) === user?.id;
    const isOwnBySenderId = message.senderId === user?.id;
    
    // Use whichever method works
    const finalIsOwn = isOwnByUsername || isOwnByUserId || isOwnBySenderId;
    
    const transformedMessage = {
      ...message,
      isOwn: finalIsOwn
    };
    
    setMessages(prev => {
      const existingMessages = prev[conversationId] || [];
      
      // Check for duplicates by messageId
      const isDuplicate = existingMessages.some(msg => 
        msg.messageId === transformedMessage.messageId
      );
      
      if (isDuplicate) {
        chatLogger.message('⚠️ Skipping duplicate message:', transformedMessage.messageId);
        return prev;
      }
      
      const newMessages = [...existingMessages, transformedMessage];
      
      return {
        ...prev,
        [conversationId]: newMessages
      };
    });
    
    // Update last message in conversations list
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            lastMessage: transformedMessage,
            timestamp: chatService.formatMessageTime(transformedMessage.sentAt || transformedMessage.timestamp)
          }
        : conv
    ));
  }, [user?.username]);

  // Clear data when logout
  const clearChatData = useCallback(() => {
    setConversations([]);
    setMessages({});
    setSelectedConversation(null);
    setError(null);
  }, []);

  // Update user status in conversations
  const updateUserStatus = useCallback((userStatus) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.roomType === 'PRIVATE' && conv.member?.id === userStatus.id) {
          return {
            ...conv,
            member: {
              ...conv.member,
              isOnline: userStatus.isOnline || userStatus.online,
              lastSeen: userStatus.lastSeen
            }
          };
        }
        return conv;
      });
    });
  }, []);

  // Send message via HTTP API only (disable WebSocket for now)  
  const sendMessage = useCallback(async (conversationId, content) => {
    const messageData = {
      content: content,
      messageType: 'TEXT'
    };
    
    try {
      const result = await chatService.sendMessage(conversationId, messageData);
      
      // For WebSocket messages, don't add locally - they will come back via subscription
      // Only add locally for HTTP image messages that return actual message objects
      if (result && result.message && typeof result.message === 'object' && result.message.messageId) {
        addMessage(conversationId, result.message);
      }
      
      return result;
    } catch (error) {
      chatLogger.error('Error sending message:', error);
      throw error;
    }
  }, [addMessage]);

  // Send image message via HTTP API
  const sendImageMessage = useCallback(async (conversationId, imageFile) => {
    const messageData = {
      content: '', // Content will be set by backend after upload
      messageType: 'IMAGE', 
      image: imageFile
    };
    
    try {
      const result = await chatService.sendMessage(conversationId, messageData);
      
      // Add message locally for immediate UI update
      if (result && result.message) {
        addMessage(conversationId, result.message);
      }
      
      return result;
    } catch (error) {
      chatLogger.error('Error sending image:', error);
      throw error;
    }
  }, [addMessage]);

  // Clear data when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      clearChatData();
    }
  }, [isAuthenticated, authLoading, clearChatData]);

  // Auto load conversations when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadConversations();
    }
  }, [isAuthenticated, authLoading, loadConversations]);

  // Setup WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && webSocketService && user?.username) {
      // Check token first
      const apiService = require('../services/apiService').default;
      const token = apiService.getToken();
      chatLogger.websocket(`Attempting WebSocket connection with token: ${token ? token.substring(0, 20) + '...' : 'NONE'}`);
      
      // Connect to WebSocket first
      webSocketService.connect(user.username).then(() => {
        chatLogger.success('WebSocket connected successfully');
        // Setup status subscription after connection
        webSocketService.setOnUserStatusUpdate(updateUserStatus);
      }).catch(error => {
        chatLogger.error('Failed to connect WebSocket - continuing without real-time features:', error);
        // Continue without WebSocket for now
      });
    }
    
    return () => {
      if (webSocketService && webSocketService.isConnected()) {
        webSocketService.setOnUserStatusUpdate(null);
        webSocketService.disconnect();
      }
    };
  }, [isAuthenticated, authLoading, user?.username, updateUserStatus, webSocketService]);

  const value = {
    // State
    conversations,
    messages,
    selectedConversation,
    loading,
    error,
    user, // Add user from useAuth
    
    // Actions
    loadConversations,
    loadMessages,
    addMessage,
    sendMessage,
    sendImageMessage,
    setSelectedConversation,
    clearChatData,
    updateUserStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;