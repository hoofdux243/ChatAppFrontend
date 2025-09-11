import chatApi from "../api/chatApi";
import axios from 'axios';
import { getAuthToken } from '../utils/axiosConfig';

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

    // Gửi tin nhắn
    sendMessage: async (chatroomId, messageData) => {
        try {
            // TEXT cũng dùng FormData như IMAGE
            const formData = new FormData();
            formData.append('content', messageData.content);
            formData.append('messageType', messageData.messageType);
            
            // Dùng axios thuần như image
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
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
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

    // Tạo chatroom mới
    createChatRoom: async (chatRoomData) => {
        try {
            const response = await chatApi.createChatRoom(chatRoomData);
            return response.data;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    },

    // Lấy tên user từ context (không dùng localStorage)
    getUserName: () => {
        try {
            // Sẽ được lấy từ context thay vì localStorage
            return "Current User";
        } catch (error) {
            console.error('Error getting user name:', error);
            return 'User';
        }
    },

    // Lấy current user username từ parameter hoặc context
    getCurrentUserName: (currentUser = null) => {
        try {
            if (currentUser) {
                // Thử các trường có thể có trong user object
                return currentUser.username || currentUser.name || currentUser.email || 'currentUser';
            }
            // Fallback
            return 'currentUser';
        } catch (error) {
            console.error('Error getting current user name:', error);
            return 'CurrentUser';
        }
    },

    // Lấy thông tin user hiện tại bao gồm avatar
    getCurrentUser: async () => {
        try {
            // Thử lấy từ localStorage trước (user_info từ login response)
            const cachedUserInfo = localStorage.getItem("user_info");
            if (cachedUserInfo) {
                const user = JSON.parse(cachedUserInfo);
                return {
                    username: user.username || user.name || user.senderUsername || user.firstName,
                    name: user.name || user.username || user.firstName || 'Current User',
                    email: user.email || '',
                    avatar: user.avatar || user.senderAvatar || null,
                    id: user.id || user.senderId || null
                };
            }
            
            // Nếu không có trong localStorage hoặc không có avatar, gọi API
            try {
                const response = await chatApi.getCurrentUser();
                if (response && response.data) {
                    const userData = response.data.result || response.data;
                    const userInfo = {
                        username: userData.username || userData.name || userData.senderUsername,
                        name: userData.name || userData.username || 'Current User',
                        email: userData.email || '',
                        avatar: userData.avatar || userData.senderAvatar || null,
                        id: userData.id || userData.senderId || null
                    };
                    
                    // Cập nhật localStorage
                    localStorage.setItem("user_info", JSON.stringify(userData));
                    return userInfo;
                }
            } catch (apiError) {
                console.error('Error fetching user from API:', apiError);
            }
            
            // Fallback: thử lấy từ key 'user' (legacy)
            const fallbackUserInfo = localStorage.getItem("user");
            if (fallbackUserInfo) {
                const user = JSON.parse(fallbackUserInfo);
                return {
                    username: user.username || user.name || user.senderUsername || user.firstName,
                    name: user.name || user.username || user.firstName || 'Current User',
                    email: user.email || '',
                    avatar: user.avatar || user.senderAvatar || null,
                    id: user.id || user.senderId || null
                };
            }
            
            return {
                username: 'vu1',
                name: 'vu1',
                email: '',
                avatar: null,
                id: null
            };
        } catch (error) {
            console.error('Error getting current user:', error);
            return {
                username: 'CurrentUser',
                name: 'CurrentUser',
                email: '',
                avatar: null,
                id: null
            };
        }
    },

    // Tìm kiếm users
    searchUsers: async (keyword) => {
        try {
            if (!keyword || keyword.trim() === '') {
                return [];
            }
            const response = await chatApi.searchUsers(keyword.trim());
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },

    // Format thời gian tin nhắn
    formatMessageTime: (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return date.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                });
            } else if (diffDays === 1) {
                return 'Hôm qua';
            } else if (diffDays < 7) {
                const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                return weekdays[date.getDay()];
            } else {
                return date.toLocaleDateString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit' 
                });
            }
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    },

    // Lấy thông tin profile user
    getUserProfile: async (userId) => {
        try {
            const response = await chatApi.getUserProfile(userId);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
};

export default chatService;
