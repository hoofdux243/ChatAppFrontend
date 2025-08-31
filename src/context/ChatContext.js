import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import chatService from '../services/chatService';

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
  
  const { isAuthenticated, loading: authLoading } = useAuth();

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
          return {
            id: item.chatRoomId,
            title: item.chatRoomName || item.chatRoomAvatar || `Chat ${item.chatRoomId.substring(0, 8)}` || 'Cuộc trò chuyện',
            avatar: item.chatRoomAvatar || null,
            lastMessage: item.lastMessage ? item.lastMessage.content : 'Chưa có tin nhắn',
            timestamp: item.lastMessage ? chatService.formatMessageTime(item.lastMessage.sentAt) : '',
            isGroup: item.roomType === 'GROUP' || item.roomType === 'PUBLIC',
            memberCount: item.memberCount,
            unreadCount: item.readCount || 0,
            participants: [] // Có thể thêm thông tin participants nếu cần
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
  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      console.log('ChatContext - Loading messages for conversation:', conversationId);
      
      const response = await chatService.getMessagesByIdConversation(conversationId, 0, 50);
      console.log('ChatContext - Messages API response:', response);
      
      if (response && response.result && response.result.data) {
        const currentUserName = chatService.getCurrentUserName();
        console.log('ChatContext - Current user name for comparison:', currentUserName);
        
        const transformedMessages = response.result.data.map(msg => {
          console.log('ChatContext - Processing message:', msg);
          console.log('ChatContext - Message senderUsername:', msg.senderUsername);
          console.log('ChatContext - Current user:', currentUserName);
          
          const isOwn = msg.senderUsername?.toLowerCase() === currentUserName?.toLowerCase();
          console.log('ChatContext - Is own message?', isOwn);
          
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
          };
        });
        
        console.log('ChatContext - Transformed messages:', transformedMessages);
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: transformedMessages
        }));
        
        return {
          messages: transformedMessages,
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
      // Mock messages với cả own và other messages để test layout
      const mockMessages = [
        {
          id: 'mock-1',
          text: "Hello! How are you doing today?",
          senderId: 'other-user-id',
          senderName: 'John',
          senderUsername: 'john123', // Username khác với current user
          timestamp: new Date(Date.now() - 3600000),
          messageType: 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: false,
          isOwn: false
        },
        {
          id: 'mock-2',
          text: "I'm doing great! Thanks for asking.",
          senderId: 'current-user-id',
          senderName: 'Vũ',
          senderUsername: 'vu1', // Username giống với current user
          timestamp: new Date(Date.now() - 3500000),
          messageType: 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: true,
          isOwn: true
        },
        {
          id: 'mock-3',
          text: "What are you up to today?",
          senderId: 'other-user-id',
          senderName: 'John',
          senderUsername: 'john123',
          timestamp: new Date(Date.now() - 3000000),
          messageType: 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: false,
          isOwn: false
        },
        {
          id: 'mock-4',
          text: "Just working on some projects. You?",
          senderId: 'current-user-id',
          senderName: 'Vũ',
          senderUsername: 'vu1',
          timestamp: new Date(Date.now() - 2500000),
          messageType: 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: true,
          isOwn: true
        }
      ];
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: mockMessages
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (conversationId, messageContent) => {
    try {
      const messageData = {
        chatRoomId: conversationId,
        content: messageContent,
        senderName: chatService.getCurrentUserName(),
        messageType: 'TEXT'
      };
      
      console.log('ChatContext - Sending message:', messageData);
      const response = await chatService.sendMessage(messageData);
      console.log('ChatContext - Send message response:', response);
      
      if (response) {
        // Thêm tin nhắn vào state local
        const newMessage = {
          id: response.messageId || Date.now(),
          text: messageContent,
          senderId: response.senderId || 'me',
          senderName: chatService.getCurrentUserName(),
          senderUsername: chatService.getCurrentUserName(),
          timestamp: new Date(),
          messageType: 'TEXT',
          messageStatus: 'SENT',
          readCount: 0,
          lastRead: true,
          isOwn: true
        };
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage]
        }));
        
        // Cập nhật lastMessage trong conversations
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, lastMessage: messageContent, timestamp: 'Vừa xong' }
              : conv
          )
        );
        
        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

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
  }, [isAuthenticated, authLoading, loadConversations]); // Add auth dependencies

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
            isOwn: msg.senderUsername === chatService.getCurrentUserName()
          }));
          
          // Prepend to existing messages (older messages)
          setMessages(prev => ({
            ...prev,
            [conversationId]: [...transformedMessages, ...(prev[conversationId] || [])]
          }));
          
          return {
            messages: transformedMessages,
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
    }, [])
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
