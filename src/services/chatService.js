import chatApi from "../api/chatApi";

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
            console.log('Raw messages response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching messages with pagination:', error);
            throw error;
        }
    },

    // Gửi tin nhắn
    sendMessage: async (messageData) => {
        try {
            const response = await chatApi.sendMessage(messageData);
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
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

    // Lấy tên user từ localStorage
    getUserName: () => {
        try {
            const userInfo = localStorage.getItem("user");
            if (userInfo) {
                const user = JSON.parse(userInfo);
                return user.username || user.firstName || 'User';
            }
            return 'User';
        } catch (error) {
            console.error('Error getting user name:', error);
            return 'User';
        }
    },

    // Lấy current user username để so sánh với tin nhắn
    getCurrentUserName: () => {
        try {
            console.log('Getting current user name...');
            
            const userInfo = localStorage.getItem("user_info");
            console.log('user_info from localStorage:', userInfo);
            
            if (userInfo) {
                const user = JSON.parse(userInfo);
                console.log('Parsed user_info:', user);
                const username = user.username || user.senderUsername || user.firstName;
                console.log('Extracted username from user_info:', username);
                if (username) return username;
            }
            
            // Fallback: thử lấy từ key 'user' 
            const fallbackUserInfo = localStorage.getItem("user");
            console.log('fallback user from localStorage:', fallbackUserInfo);
            
            if (fallbackUserInfo) {
                const user = JSON.parse(fallbackUserInfo);
                console.log('Parsed fallback user:', user);
                const username = user.username || user.senderUsername || user.firstName;
                console.log('Extracted username from fallback user:', username);
                if (username) return username;
            }
            
            console.log('No user found, returning default');
            
            // Temporary hardcode for testing - thay bằng username thực tế của bạn
            console.log('==== RETURNING HARDCODED vu1 ====');
            return 'vu1'; // Thay 'vu1' bằng username thực tế
        } catch (error) {
            console.error('Error getting current user name:', error);
            return 'CurrentUser';
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
    }
};

export default chatService;
