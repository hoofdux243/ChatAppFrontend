import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import chatService from '../services/chatService';
import apiService from '../services/apiService';
import { createWebSocketService } from '../services/webSocketService';

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
  
  // Create unique WebSocket service instance for this session to prevent token mixing
  const webSocketService = useMemo(() => {
    const service = createWebSocketService();
    console.log(`🔧 [DEBUG] Created new WebSocket service instance for session`);
    return service;
  }, []); // Only create once per ChatProvider instance
  
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
      console.error('Error loading conversations:', error);
      
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
      
      console.log(`🔍 [DEBUG] Raw messages from API (page ${page}):`, messages.map(m => ({
        content: m.content,
        sentAt: m.sentAt,
        messageId: m.messageId
      })));
      
      // Pagination ở cùng level với data, không phải nested
      const pagination = {
        hasNext: response?.result?.hasNext || false,
        hasPrevious: response?.result?.hasPrevious || false,
        page: response?.result?.page || 0,
        totalPages: response?.result?.totalPages || 0,
        totalElements: response?.result?.totalElements || 0
      };
      
      // Transform messages: compare senderUsername with current user's username
      const transformedMessages = messages.map(msg => ({
        ...msg,
        // Ensure senderUsername is available for both HTTP and WebSocket messages
        senderUsername: msg.senderUsername || msg.senderName,
        isOwn: (msg.senderUsername || msg.senderName) === user?.username
      }));
      
      // Backend sends NEWEST → OLDEST, but chat needs OLDEST → NEWEST (newest at bottom)
      const reversedMessages = [...transformedMessages].reverse();
      
      console.log(`📋 [DEBUG] Original order (newest first):`, transformedMessages.slice(0,3).map(m => ({
        content: m.content.substring(0,10),
        sentAt: m.sentAt
      })));
      
      console.log(`🔄 [DEBUG] Reversed order (oldest first):`, reversedMessages.slice(0,3).map(m => ({
        content: m.content.substring(0,10),
        sentAt: m.sentAt
      })));
      
      if (page === 0) {
        // Initial load - use reversed array (oldest → newest)
        setMessages(prev => ({
          ...prev,
          [conversationId]: reversedMessages
        }));
        console.log(`💬 [DEBUG] Set initial messages with reverse - newest should be at bottom`);
      } else {
        // Load older messages (pagination) - prepend reversed messages
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...reversedMessages, ...(prev[conversationId] || [])]
        }));
        console.log(`📜 [DEBUG] Prepended older messages with reverse`);
      }
      
      return {
        data: transformedMessages,
        pagination: pagination
      };
    } catch (error) {
      console.error('Error loading messages:', error);
      return { data: [], pagination: { hasNext: false } };
    }
  }, [user?.username]);

  // Thêm message mới vào conversation
  const addMessage = useCallback((conversationId, message) => {
    console.log(`📝 [DEBUG] addMessage called:`, {
      conversationId,
      message,
      messageType: typeof message,
      currentUserId: user?.id
    });
    
    // Validate message object
    if (!message || typeof message !== 'object' || !message.content) {
      console.warn('⚠️ Skipping invalid message:', message);
      return;
    }
    
    // Debug: Check if message content is empty
    console.log('🔍 Adding message:', message);
    if (!message.content || message.content.trim() === '') {
      console.warn('⚠️ Skipping empty message:', message);
      return; // Skip empty messages
    }
    
    // Debug isOwn logic in detail
    console.log(`🔍 [DEBUG] isOwn calculation:`, {
      messageSenderId: message.senderId,
      messageUsername: message.senderUsername || message.senderName,
      currentUserId: user?.id,
      currentUsername: user?.username,
      senderIdType: typeof message.senderId,
      currentIdType: typeof user?.id
    });
    
    // Try multiple ways to determine isOwn
    const isOwnById = message.senderId === user?.id;
    const isOwnByUsername = (message.senderUsername || message.senderName) === user?.username;
    
    console.log(`🔍 [DEBUG] isOwn comparison results:`, {
      isOwnById,
      isOwnByUsername,
      finalChoice: isOwnByUsername // Use username comparison as more reliable
    });
    
    const transformedMessage = {
      ...message,
      isOwn: isOwnByUsername // Use username comparison instead of ID
    };
    
    console.log(`🔄 [DEBUG] Transformed message:`, transformedMessage);
    
    setMessages(prev => {
      const existingMessages = prev[conversationId] || [];
      
      console.log(`📋 [DEBUG] Existing messages for conversation ${conversationId}:`, existingMessages.length);
      
      // Check for duplicates by messageId
      const isDuplicate = existingMessages.some(msg => 
        msg.messageId === transformedMessage.messageId
      );
      
      if (isDuplicate) {
        console.warn('⚠️ Skipping duplicate message:', transformedMessage.messageId);
        return prev;
      }
      
      const newMessages = [...existingMessages, transformedMessage];
      console.log(`✅ [DEBUG] Added message to conversation ${conversationId}. Total messages:`, newMessages.length);
      
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
    console.log(`🔔 [DEBUG] Received user status update:`, userStatus);
    console.log(`🔍 [DEBUG] Current conversations count:`, (conversations || []).length);
    console.log(`🔍 [DEBUG] Looking for conversations with user:`, {
      statusUserId: userStatus.id,
      statusUsername: userStatus.username
    });
    
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        // Check if this is a private chat with the user who changed status
        if (conv.roomType === 'PRIVATE' && conv.member) {
          // Match by username or id
          const isMatchingUser = 
            conv.member.id === userStatus.id || 
            conv.member.username === userStatus.username;
            
          if (isMatchingUser) {
            console.log(`✅ [DEBUG] Updating status for conversation with ${userStatus.username}:`, {
              conversationId: conv.id,
              conversationTitle: conv.title,
              oldStatus: conv.member.isOnline,
              newStatus: userStatus.isOnline || userStatus.online,
              oldIsOnline: conv.isOnline,
              memberObject: conv.member
            });
            
            const updatedConv = {
              ...conv,
              member: {
                ...conv.member,
                isOnline: userStatus.isOnline || userStatus.online,
                lastSeen: userStatus.lastSeen
              },
              // Also update root level status for compatibility
              isOnline: userStatus.isOnline || userStatus.online,
              lastSeen: userStatus.lastSeen
            };
            
            console.log(`🔄 [DEBUG] Updated conversation:`, updatedConv);
            return updatedConv;
          }
        }
        return conv;
      });
      
      console.log(`📊 [DEBUG] Status update result:`, {
        totalConversations: updatedConversations.length,
        updatedAny: JSON.stringify(updatedConversations) !== JSON.stringify(prev)
      });
      
      return updatedConversations;
    });
    
    // Also update selectedConversation if it matches the user whose status changed
    setSelectedConversation(prevSelected => {
      if (prevSelected && prevSelected.roomType === 'PRIVATE' && prevSelected.member) {
        const isMatchingUser = 
          prevSelected.member.id === userStatus.id || 
          prevSelected.member.username === userStatus.username;
          
        if (isMatchingUser) {
          console.log(`🔄 [DEBUG] Updating selected conversation status for ${userStatus.username}`);
          
          return {
            ...prevSelected,
            member: {
              ...prevSelected.member,
              isOnline: userStatus.isOnline || userStatus.online,
              lastSeen: userStatus.lastSeen
            },
            // Also update root level status for compatibility
            isOnline: userStatus.isOnline || userStatus.online,
            lastSeen: userStatus.lastSeen
          };
        }
      }
      return prevSelected;
    });
  }, []);

  // Send message via HTTP API only (disable WebSocket for now)  
  const sendMessage = useCallback(async (conversationId, content) => {
    console.log(`🎯 [DEBUG] ChatContext.sendMessage called:`, {
      conversationId,
      content
    });
    
    const messageData = {
      content: content,
      messageType: 'TEXT'
    };
    
    console.log(`📋 [DEBUG] Message data prepared:`, messageData);
    
    try {
      // Pass webSocketService instance to chatService
      const result = await chatService.sendMessage(conversationId, messageData, webSocketService);
      console.log(`📨 [DEBUG] ChatService returned result:`, result);
      
      // For WebSocket messages, don't add locally - they will come back via subscription
      // Only add locally for HTTP image messages that return actual message objects
      if (result && result.message && typeof result.message === 'object' && result.message.messageId) {
        console.log(`➕ [DEBUG] Adding HTTP message to local state:`, result.message);
        addMessage(conversationId, result.message);
      } else {
        console.log(`📡 [DEBUG] WebSocket message sent - waiting for subscription callback`);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [addMessage, webSocketService]);

  // Send image message via HTTP API
  const sendImageMessage = useCallback(async (conversationId, imageFile) => {
    const messageData = {
      content: '', // Content will be set by backend after upload
      messageType: 'IMAGE', 
      image: imageFile
    };
    
    try {
      // Pass webSocketService instance to chatService
      const result = await chatService.sendMessage(conversationId, messageData, webSocketService);
      
      // Add message locally for immediate UI update
      if (result && result.message) {
        addMessage(conversationId, result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending image:', error);
      throw error;
    }
  }, [addMessage, webSocketService]);

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
      // Setup WebSocket connection with user's token
      const connectWebSocket = async () => {
        try {
          console.log(`🔌 [DEBUG] Connecting WebSocket for user: ${user.username}`);
          
          // Get current token for this session
          const currentToken = apiService.getToken();
          console.log(`🔑 [DEBUG] Current token for ${user.username}:`, currentToken ? `${currentToken.substring(0, 20)}...` : 'null');
          
          // Connect with user-specific token
          await webSocketService.connect(user.username, currentToken);
          
          // Set user online after connection
          setTimeout(async () => {
            await webSocketService.setUserOnline();
          }, 1000);
          
          // Setup status subscription
          webSocketService.setOnUserStatusUpdate(updateUserStatus);
          
          // Subscribe to all chatrooms for notifications
          subscribeToAllChatrooms();
        } catch (error) {
          console.error('❌ [DEBUG] WebSocket connection failed:', error);
        }
      };
      
      connectWebSocket();
    }
    
    return () => {
      if (webSocketService && webSocketService.isConnected()) {
        webSocketService.setOnUserStatusUpdate(null);
        // Unsubscribe from all chatrooms when logging out
        unsubscribeFromAllChatrooms();
        // Set user offline and disconnect
        webSocketService.setUserOffline().finally(() => {
          webSocketService.disconnect();
        });
      }
    };
  }, [isAuthenticated, authLoading, user?.username, webSocketService]);

  // Subscribe to all chatrooms for global notifications
  const subscribeToAllChatrooms = useCallback(() => {
    console.log('🔔 [DEBUG] Subscribing to all chatrooms...');
    
    conversations.forEach(conversation => {
      if (webSocketService && webSocketService.isConnected()) {
        console.log(`🔔 [DEBUG] Subscribing to chatroom ${conversation.id} for notifications`);
        
        const subscription = webSocketService.subscribeToMessages(conversation.id, (newMessage) => {
          console.log(`📨 [GLOBAL] New message received for chatroom ${conversation.id}:`, newMessage);
          
          // Add message to the conversation
          addMessage(conversation.id, newMessage);
          
          // You can add notification logic here
          // For example: show browser notification if not in current chat
          if (selectedConversation?.id !== conversation.id) {
            console.log(`🔔 [NOTIFICATION] New message in other chatroom: ${conversation.title}`);
            // Could show browser notification here
          }
        });
        
        // Store subscription for cleanup
        if (!window.globalChatroomSubscriptions) {
          window.globalChatroomSubscriptions = new Map();
        }
        window.globalChatroomSubscriptions.set(conversation.id, subscription);
      }
    });
  }, [conversations, addMessage, selectedConversation]);

  // Unsubscribe from all chatrooms
  const unsubscribeFromAllChatrooms = useCallback(() => {
    console.log('🔕 [DEBUG] Unsubscribing from all chatrooms...');
    
    if (window.globalChatroomSubscriptions) {
      window.globalChatroomSubscriptions.forEach((subscription, chatroomId) => {
        console.log(`🔕 [DEBUG] Unsubscribing from chatroom ${chatroomId}`);
        subscription.unsubscribe();
      });
      window.globalChatroomSubscriptions.clear();
    }
  }, []);

  // Subscribe to new chatrooms when conversations list updates
  useEffect(() => {
    if (isAuthenticated && !authLoading && (conversations || []).length > 0 && webSocketService?.isConnected()) {
      // Subscribe to any new chatrooms
      subscribeToAllChatrooms();
    }
    
    return () => {
      // Cleanup when conversations change
      unsubscribeFromAllChatrooms();
    };
  }, [conversations, isAuthenticated, authLoading, subscribeToAllChatrooms, unsubscribeFromAllChatrooms, webSocketService]);

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