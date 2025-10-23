import chatApi from "../api/chatApi";
import axios from 'axios';
import { getAuthToken } from '../utils/axiosConfig';
import webSocketService from './webSocketService';

const chatService = {
    // Lấy danh sách conversation theo user ID
    getConversationWithIdAccount: async () => {
        try {
            const response = await chatApi.getConversationWithIdAccount();
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Lấy tin nhắn theo conversation ID
    getMessages: async (idConversation) => {
        try {
            const response = await chatApi.getMessages(idConversation);
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    // Lấy tin nhắn với phân trang
    getMessagesByIdConversation: async (idConversation, page = 0, size = 20) => {
        try {
            const response = await chatApi.getMessagesByIdConversation(idConversation, page, size);
            return response.data;
        } catch (error) {
            console.error('Error fetching messages with pagination:', error);
            throw error;
        }
    },

    // Gửi tin nhắn qua WebSocket
    sendMessage: async (chatroomId, messageData) => {
        try {
            console.log('📤 Sending message via WebSocket:', { chatroomId, messageData });
            
            // Sử dụng WebSocket thay vì HTTP API
            const response = await webSocketService.sendMessage(chatroomId, messageData);
            console.log('✅ Message sent successfully via WebSocket:', response);
            
            return response;
        } catch (error) {
            console.error('❌ Error sending message via WebSocket:', error);
            
            // Fallback về HTTP API nếu WebSocket fail
            console.log('🔄 Falling back to HTTP API...');
            try {
                const formData = new FormData();
                formData.append('content', messageData.content);
                formData.append('messageType', messageData.messageType);
                
                const token = getAuthToken();
                const config = {
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                };
                
                const response = await axios.post(
                    `http://localhost:8080/chatapp/api/chatrooms/${chatroomId}/send-message`,
                    formData,
                    config
                );
                console.log('✅ Message sent via HTTP API fallback:', response.data);
                return response.data;
            } catch (httpError) {
                console.error('❌ HTTP API fallback also failed:', httpError);
                throw httpError;
            }
        }
    },

    // Gửi tin nhắn ảnh
    sendImageMessage: async (chatroomId, imageFile) => {
        try {
            const formData = new FormData();
            formData.append('content', '');
            formData.append('messageType', 'IMAGE');
            formData.append('image', imageFile);
            
            // Dùng axios thuần, KHÔNG qua interceptor
            const token = getAuthToken();
            const config = {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                    // KHÔNG set Content-Type
                }
            };
            
            const response = await axios.post(
                `http://localhost:8080/chatapp/api/chatrooms/${chatroomId}/send-message`, 
                formData, 
                config
            );
            return response.data;
        } catch (error) {
            console.error('Error sending image message:', error);
            throw error;
        }
    },

    // Tạo phòng chat mới
    createChatRoom: async (chatRoomData) => {
        try {
            const response = await chatApi.createChatRoom(chatRoomData);
            return response.data;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    },

    // Lấy username - Không dùng localStorage
    getUserName: (currentUser = null) => {
        try {
            if (currentUser && (currentUser.username || currentUser.name)) {
                return currentUser.username || currentUser.name;
            }
            return 'Unknown User';
        } catch (error) {
            console.error('Error getting username:', error);
            return 'Unknown User';
        }
    },

    // Lấy ID người dùng hiện tại  
    getCurrentUserId: async (currentUser = null) => {
        // Trả về user hiện tại từ context - không dùng localStorage
        if (currentUser && (currentUser.username || currentUser.id)) {
            return currentUser.username || currentUser.id;
        }
        
        return null; // Không có user
    },

    // Lấy tên người dùng hiện tại - không dùng localStorage
    getCurrentUserName: (currentUser = null) => {
        try {
            if (currentUser && (currentUser.username || currentUser.name)) {
                return currentUser.username || currentUser.name;
            }
            
            return null; // Không có user
        } catch (error) {
            console.error('Error getting current user name:', error);
            return null;
        }
    },

    // Lấy thông tin người dùng hiện tại - không dùng localStorage
    getCurrentUser: async (currentUser = null) => {
        try {
            // Sử dụng user từ context thay vì localStorage
            if (currentUser) {
                return currentUser;
            }

            // Nếu không có currentUser, gọi API
            const response = await chatApi.getCurrentUser();
            const userData = response.data;
            
            return userData;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Format thời gian tin nhắn
    formatMessageTime: (timestamp) => {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInMs = now - date;
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInMinutes < 1) {
                return 'Vừa xong';
            } else if (diffInMinutes < 60) {
                return `${diffInMinutes} phút trước`;
            } else if (diffInHours < 24) {
                return `${diffInHours} giờ trước`;
            } else if (diffInDays < 7) {
                return `${diffInDays} ngày trước`;
            } else {
                return date.toLocaleDateString('vi-VN');
            }
        } catch (error) {
            console.error('Error formatting message time:', error);
            return '';
        }
    },

    // Tìm kiếm người dùng
    searchUsers: async (keyword) => {
        try {
            const response = await chatApi.searchUsers(keyword);
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },

    // Tìm kiếm tin nhắn
    searchMessages: async (keyword) => {
        try {
            const response = await chatApi.searchMessages(keyword);
            return response.data;
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    },

    // Lấy thông tin user profile theo ID
    getUserProfileById: async (userId) => {
        try {
            const token = getAuthToken();
            const config = {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };

            const response = await axios.get(
                `http://localhost:8080/chatapp/api/users/${userId}/profile`,
                config
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile by ID:', error);
            throw error;
        }
    },

    // Lấy thông tin user profile
    getUserProfile: async (userId) => {
        try {
            const response = await chatApi.getUserProfile(userId);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    getContacts: async (keyword = '') => {
        try {
            const token = getAuthToken();
            const config = {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };

            let url = 'http://localhost:8080/chatapp/api/contacts';
            if (keyword && keyword.trim()) {
                url += `?keyword=${encodeURIComponent(keyword.trim())}`;
            }

            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    },

    createGroup: async (groupData) => {
        try {
            const token = getAuthToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };

            const response = await axios.post(
                'http://localhost:8080/chatapp/api/chatrooms/group',
                {
                    name: groupData.name,
                    memberIds: groupData.memberIds
                },
                config
            );
            return response.data;
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    },

    // Lấy chatroom ID giữa 2 users bằng username
    getChatroomByUsernames: async (username1, username2) => {
        try {
            const url = `http://localhost:8080/chatapp/api/chatrooms/id?username1=${username1}&username2=${username2}`;
            console.log('📡 API Call URL:', url);
            console.log('📡 Parameters:', { username1, username2 });
            
            const token = getAuthToken();
            console.log('🔍 Token check:', token ? 'Token exists' : 'No token found');
            console.log('🔍 Token preview:', token ? token.substring(0, 50) + '...' : 'null');
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            console.log('🔍 Request headers:', config.headers);
            
            const response = await axios.get(url, config);
            console.log('✅ Chatroom API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error getting chatroom by usernames:');
            console.error('  - Status:', error.response?.status);
            console.error('  - Status Text:', error.response?.statusText);
            console.error('  - Response Data:', error.response?.data);
            console.error('  - Full Error:', error);
            throw error;
        }
    },

    // Tạo chatroom mới
    createChatroom: async (memberIds) => {
        try {
            const url = 'http://localhost:8080/chatapp/api/chatrooms/create-chatroom';
            console.log('📡 Creating chatroom with memberIds:', memberIds);
            
            const token = getAuthToken();
            console.log('🔍 Token check for create chatroom:', token ? 'Token exists' : 'No token found');
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            const requestData = {
                memberIds: memberIds
            };
            
            console.log('🔍 Create chatroom request data:', requestData);
            
            const response = await axios.post(url, requestData, config);
            console.log('✅ Create chatroom API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating chatroom:');
            console.error('  - Status:', error.response?.status);
            console.error('  - Status Text:', error.response?.statusText);
            console.error('  - Response Data:', error.response?.data);
            console.error('  - Full Error:', error);
            throw error;
        }
    },

    // Lấy danh sách chatrooms public
    getPublicChatrooms: async (keyword = '') => {
        try {
            const response = await chatApi.getPublicChatrooms(keyword);
            return response.data;
        } catch (error) {
            console.error('Error fetching public chatrooms:', error);
            throw error;
        }
    },

    // Clear cache - không cần localStorage
    clearCache: () => {
        try {
            console.log('ChatService: Cache cleared (no localStorage)');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    },

    // Gửi lời mời kết bạn
    sendFriendRequest: async (recipientId) => {
        try {
            const url = `http://localhost:8080/chatapp/api/users/${recipientId}/request`;
            console.log('📤 Sending friend request to:', recipientId);
            
            const token = getAuthToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            const response = await axios.post(url, {}, config);
            console.log('✅ Friend request sent successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error sending friend request:', error);
            console.error('  - Status:', error.response?.status);
            console.error('  - Response Data:', error.response?.data);
            throw error;
        }
    },

    // Chấp nhận lời mời kết bạn
    acceptFriendRequest: async (requesterId) => {
        try {
            const url = `http://localhost:8080/chatapp/api/users/${requesterId}/accept-request`;
            console.log('✅ Accepting friend request from:', requesterId);
            
            const token = getAuthToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            const response = await axios.put(url, {}, config);
            console.log('✅ Friend request accepted successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error accepting friend request:', error);
            console.error('  - Status:', error.response?.status);
            console.error('  - Response Data:', error.response?.data);
            throw error;
        }
    },

    // Lấy danh sách lời mời kết bạn nhận được
    getFriendRequesters: async () => {
        try {
            const url = 'http://localhost:8080/chatapp/api/friend-request/requesters';
            console.log('📡 Getting friend requesters...');
            
            const token = getAuthToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            const response = await axios.get(url, config);
            console.log('✅ Friend requesters retrieved successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error getting friend requesters:', error);
            console.error('  - Status:', error.response?.status);
            console.error('  - Response Data:', error.response?.data);
            throw error;
        }
    },

    // Lấy danh sách lời mời kết bạn đã gửi
    getFriendRecipients: async () => {
        try {
            const url = 'http://localhost:8080/chatapp/api/friend-request/recipients';
            console.log('📡 Getting friend recipients...');
            
            const token = getAuthToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                }
            };
            
            const response = await axios.get(url, config);
            console.log('✅ Friend recipients retrieved successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error getting friend recipients:', error);
            console.error('  - Status:', error.response?.status);
            console.error('  - Response Data:', error.response?.data);
            throw error;
        }
    }
};

export default chatService;