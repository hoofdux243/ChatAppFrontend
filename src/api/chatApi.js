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

    // Gửi tin nhắn
    sendMessage: async (messageData) => {
        const response = await axios.post(`${addressAPI}/api/messages`, messageData);
        return response;
    },

    // Tạo chatroom mới
    createChatRoom: async (chatRoomData) => {
        const response = await axios.post(`${addressAPI}/api/chatrooms`, chatRoomData);
        return response;
    }
};

export default chatApi;
