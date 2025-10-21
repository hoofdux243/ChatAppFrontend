import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import chatService from '../services/chatService';
import webSocketService from '../services/webSocketService';

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
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // idConversation => [msg1, msg2,...]
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Lấy danh sách conversation
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversationWithIdAccount();
      console.log('ChatContext - API response:', response);
      
      if (response && response.result) {
        console.log('ChatContext - Raw conversations:', response.result);
        
        // Transform data từ API response
        const transformedConversations = response.result.map(item => {
          console.log('ChatContext - Processing item:', item);
          console.log('ChatContext - item.memberId:', item.memberId);
          console.log('ChatContext - item.roomType:', item.roomType);
          return {
            id: item.chatRoomId,
            title: item.chatRoomName || item.chatRoomAvatar || `Chat ${item.chatRoomId.substring(0, 8)}` || 'Cuộc trò chuyện',
            avatar: item.chatRoomAvatar || null,
            lastMessage: item.lastMessage || null, // Giữ nguyên object thay vì chỉ lấy content
            lastMessageSender: item.lastMessage ? item.lastMessage.senderName : null, // Thêm tên người gửi
            timestamp: item.lastMessage ? chatService.formatMessageTime(item.lastMessage.sentAt) : '',
            isGroup: item.roomType === 'PUBLIC', 
            roomType: item.roomType, // Thêm roomType để dùng cho logic user status
            memberCount: item.memberCount,
            unreadCount: item.readCount || 0,
            memberId: item.memberId || null, // Thêm memberId cho private chat
            lastRead: item.lastMessage ? item.lastMessage.lastRead : true, // Thêm trường lastRead
            participants: [], // Có thể thêm thông tin participants nếu cần
            // Initialize user status fields for private chats
            isOnline: false, // Sẽ được update qua WebSocket
            lastSeen: null   // Sẽ được update qua WebSocket
          };
        });
        
        console.log('ChatContext - Transformed conversations:', transformedConversations);
        setConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      // Kiểm tra lỗi 401 (token expired)
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Không set mock data khi lỗi 401
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

  // Lấy tin nhắn cho một conversation
  // Load messages với phân trang, nối tin nhắn cũ vào đầu mảng
  const loadMessages = useCallback(async (conversationId, page = 0, size = 10) => {
    try {
      setLoading(true);
      console.log('ChatContext - Loading messages for conversation:', conversationId, 'page:', page);
      const response = await chatService.getMessagesByIdConversation(conversationId, page, size);
      console.log('ChatContext - Messages API response:', response);
      if (response && response.result && response.result.data) {
        const transformedMessages = response.result.data.map(msg => {
          // So sánh không phân biệt hoa thường cho username
          const isOwn = user && (
            (msg.senderUsername && user.username && msg.senderUsername.toLowerCase() === user.username.toLowerCase()) || 
            msg.senderId === user.id
          );
          
          return {
          id: msg.messageId,
          text: msg.content,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderUsername: msg.senderUsername,
          senderAvatar: msg.senderAvatar,
          timestamp: new Date(msg.sentAt),
          messageType: msg.messageType,
          messageStatus: msg.messageStatus,
          readCount: msg.readCount,
          lastRead: msg.lastRead,
          isOwn: isOwn
        }});
        // Reverse messages để tin nhắn cũ nhất ở trên, mới nhất ở dưới
        const sortedMessages = transformedMessages.reverse();
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: page === 0
            ? sortedMessages  // Page 0: tin nhắn mới nhất (đảo ngược để cũ nhất ở trên)
            : [...sortedMessages, ...(prev[conversationId] || [])]  // Page > 0: tin nhắn cũ hơn thêm vào đầu
        }));
        return {
          messages: sortedMessages,
          pagination: {
            page: response.result.page,
            totalPages: response.result.totalPages,
            totalElements: response.result.totalElements,
            hasNext: response.result.hasNext,
            hasPrevious: response.result.hasPrevious
          }
        };
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (conversationId, messageContent) => {
    try {
      const messageData = {
        content: messageContent,
        messageType: 'TEXT'
      };
      console.log('ChatContext - Sending message:', messageData);
      const response = await chatService.sendMessage(conversationId, messageData);
      console.log('ChatContext - Send message response:', response);
      if (response) {
        // Thêm tin nhắn vào state local
        const newMessage = {
          id: response.result?.messageId || Date.now(),
          text: response.result?.content || messageContent,
          senderId: response.result?.senderId || chatService.getCurrentUserId(user),
          senderName: response.result?.senderName || chatService.getCurrentUserName(user),
          senderUsername: response.result?.senderUsername || chatService.getCurrentUserName(user),
          timestamp: response.result?.sentAt ? new Date(response.result.sentAt) : new Date(),
          messageType: response.result?.messageType || 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: true,
          isOwn: true
        };
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage]
        }));
        
        // Cập nhật lastMessage trong conversations với format phù hợp
        const lastMessageObject = {
          content: messageContent,
          senderName: 'Bạn',
          messageType: 'TEXT'
        };
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, lastMessage: lastMessageObject, timestamp: 'Vừa xong' }
              : conv
          )
        );
        
        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user]);

  // Gửi tin nhắn ảnh
  const sendImageMessage = useCallback(async (conversationId, imageFile) => {
    try {
      console.log('ChatContext - Sending image message:', imageFile);
      const response = await chatService.sendImageMessage(conversationId, imageFile);
      console.log('ChatContext - Send image message response:', response);
      
      if (response) {
        // Thêm tin nhắn ảnh vào state local
        const newMessage = {
          id: response.result?.messageId || Date.now(),
          content: response.result?.content || 'Image',
          senderId: response.result?.senderId || chatService.getCurrentUserId(user),
          senderName: response.result?.senderName || chatService.getCurrentUserName(user),
          senderUsername: response.result?.senderUsername || chatService.getCurrentUserName(user),
          timestamp: response.result?.sentAt ? new Date(response.result.sentAt) : new Date(),
          messageType: 'IMAGE',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: true,
          isOwn: true
        };
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage]
        }));
        
        // Cập nhật lastMessage trong conversations với format phù hợp
        const lastMessageObject = {
          content: response.result?.content || 'Image',
          senderName: 'Bạn',
          messageType: 'IMAGE'
        };
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, lastMessage: lastMessageObject, timestamp: 'Vừa xong' }
              : conv
          )
        );
        
        return response;
      }
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }, [user]);

  // Load conversations khi component mount
  useEffect(() => {
    console.log('ChatContext useEffect - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'conversations.length:', conversations.length);
    
    // Chỉ load khi user đã authenticated và auth không còn loading
    if (isAuthenticated && !authLoading && conversations.length === 0) {
      console.log('ChatContext - Loading conversations...');
      // Delay slightly để đảm bảo token đã được set vào axios
      const timer = setTimeout(() => {
        loadConversations();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, loadConversations, conversations.length]); // Add conversations.length dependency

  // Define clearChatData function with useCallback to prevent re-creation
  const clearChatData = useCallback(() => {
    setConversations([]);
    setMessages({});
    setSelectedConversation(null);
    setError(null);
    console.log('ChatContext: Chat data cleared');
  }, []);

  // Update user status in conversations
  const updateUserStatus = (userStatus) => {
    console.log('SIMPLE updateUserStatus called:', userStatus.id, userStatus.online);
    console.log('� UserStatus ID:', userStatus.id);
    
    setConversations(prev => {
      console.log('🔍 All conversations memberIds:', prev.map(c => ({
        title: c.title,
        memberId: c.memberId,
        roomType: c.roomType
      })));
      
      const updated = prev.map(conv => {
        if (conv.roomType === 'PRIVATE' && conv.memberId === userStatus.id) {
          console.log(`✅ MATCHED! Updating conversation: ${conv.title}`);
          return {
            ...conv,
            isOnline: userStatus.online,
            lastSeen: userStatus.lastSeen
          };
        }
        return conv;
      });
      
      return updated;
    });
  };

  // Clear data when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      console.log('ChatContext - User logged out, clearing chat data...');
      clearChatData();
    }
  }, [isAuthenticated, authLoading, clearChatData]);

  // Setup WebSocket callback khi component mount
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔗 Setting up WebSocket user status callback...');
      webSocketService.setOnUserStatusUpdate(updateUserStatus);
    }
    
    return () => {
      // Cleanup callback khi unmount
      webSocketService.setOnUserStatusUpdate(null);
    };
  }, [isAuthenticated, updateUserStatus]);

  // Force reload conversations
  const reloadConversations = useCallback(() => {
    console.log('ChatContext: Force reloading conversations...');
    setConversations([]);
    loadConversations();
  }, [loadConversations]);

  const value = {
    conversations,
    messages,
    selectedConversation,
    loading,
    error,
    setSelectedConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    sendImageMessage,
    clearChatData, // Thêm function clear data
    reloadConversations, // Export reloadConversations
    
    // Thêm method để load more messages
    loadMoreMessages: useCallback(async (conversationId, page) => {
      try {
        const response = await chatService.getMessagesByIdConversation(conversationId, page, 20);
        
        if (response && response.result && response.result.data) {
          const transformedMessages = response.result.data.map(msg => ({
            id: msg.messageId,
            text: msg.content,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderUsername: msg.senderUsername,
            timestamp: new Date(msg.sentAt),
            messageType: msg.messageType,
            messageStatus: msg.messageStatus,
            readCount: msg.readCount,
            lastRead: msg.lastRead,
            isOwn: user && (
              (msg.senderUsername && user.username && msg.senderUsername.toLowerCase() === user.username.toLowerCase()) || 
              msg.senderId === user.id
            )
          }));
          
          // Reverse và thêm vào đầu (tin nhắn cũ hơn)
          const reversedMessages = transformedMessages.reverse();
          setMessages(prev => ({
            ...prev,
            [conversationId]: [...reversedMessages, ...(prev[conversationId] || [])]
          }));
          
          return {
            messages: reversedMessages,
            pagination: {
              page: response.result.page,
              totalPages: response.result.totalPages,
              totalElements: response.result.totalElements,
              hasNext: response.result.hasNext,
              hasPrevious: response.result.hasPrevious
            }
          };
        }
      } catch (error) {
        console.error('Error loading more messages:', error);
        throw error;
      }
    }, [user])
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
