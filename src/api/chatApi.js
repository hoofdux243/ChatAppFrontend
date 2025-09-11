import axios from '../utils/axiosConfig';
import { addressAPI } from '../utils/prefixAPI';

const chatApi = {
    // Lấy danh sách chatroom theo idAccount
    getConversationWithIdAccount: async () => {
        const response = await axios.get(`${addressAPI}/api/chatrooms`);
        return response;
    },

    // Lấy tin nhắn theo idConversation  
    getMessages: async (idConversation) => {
        const response = await axios.get(`${addressAPI}/api/messages/${idConversation}`);
        return response;
    },

    // Lấy tin nhắn với phân trang
    getMessagesByIdConversation: async (idConversation, page = 0, size = 20) => {
        const response = await axios.get(`${addressAPI}/api/chatrooms/${idConversation}/messages?page=${page}&size=${size}`);
        return response;
    },

    // Gửi tin nhắn đúng endpoint
    sendMessage: async (chatroomId, messageData) => {
        const response = await axios.post(`${addressAPI}/api/chatrooms/${chatroomId}/send-message`, messageData);
        return response;
    },

    // Tạo chatroom mới
    createChatRoom: async (chatRoomData) => {
        const response = await axios.post(`${addressAPI}/api/chatrooms`, chatRoomData);
        return response;
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: async () => {
        const response = await axios.get(`${addressAPI}/api/users/me`);
        return response;
    },

    // Tìm kiếm users theo keyword
    searchUsers: async (keyword) => {
        const response = await axios.get(`${addressAPI}/api/users?keyword=${keyword}`);
        return response;
    },

    // Lấy thông tin profile user
    getUserProfile: async (userId) => {
        const response = await axios.get(`${addressAPI}/api/users/profile`);
        return response;
    }
};

export default chatApi;
