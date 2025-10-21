import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiService from './apiService';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.onUserStatusUpdate = null; // Callback để update UI
  }

  setOnUserStatusUpdate(callback) {
    this.onUserStatusUpdate = callback;
  }

  connect(username = null) {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to WebSocket: http://localhost:8080/chatapp/ws');
      
      const socket = new SockJS('http://localhost:8080/chatapp/ws');
      const token = apiService.getToken();
      
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },
        debug: (str) => console.log('STOMP:', str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('✅ WebSocket Connected');
        this.connected = true;
        
        // Subscribe để nhận status updates từ backend - topic có username riêng
        if (username) {
          console.log(`🔔 Subscribing to: /topic/status/${username}`);
          this.client.subscribe(`/topic/status/${username}`, (message) => {
            console.log('📢 RAW WebSocket message:', message.body);
            const userStatus = JSON.parse(message.body);
            console.log('📢 PARSED User status update received:', userStatus);
            console.log('📢 userStatus.online type:', typeof userStatus.online);
            console.log('📢 userStatus.isOnline type:', typeof userStatus.isOnline);
            
            // Chuẩn hóa format - đảm bảo có trường online
            const normalizedStatus = {
              ...userStatus,
              online: userStatus.online !== undefined ? userStatus.online : userStatus.isOnline
            };
            console.log('📢 NORMALIZED user status:', normalizedStatus);
            
            // Gọi callback để update UI
            if (this.onUserStatusUpdate) {
              this.onUserStatusUpdate(normalizedStatus);
            }
          });
        } else {
          console.warn('⚠️ No username provided for WebSocket subscription');
        }
        
        resolve(frame);
      };

      this.client.onStompError = (frame) => {
        console.error('❌ STOMP Error:', frame);
        this.connected = false;
        reject(frame);
      };

      this.client.onWebSocketError = (error) => {
        console.error('❌ WebSocket Error:', error);
        this.connected = false;
        reject(error);
      };

      // Handle disconnect events
      this.client.onWebSocketClose = (event) => {
        console.log('🔌 WebSocket connection closed:', event);
        this.connected = false;
        
        // Notify UI that connection is lost
        if (this.onUserStatusUpdate) {
          console.log('📢 Broadcasting connection lost to UI');
          // Can add logic here to update UI state
        }
      };

      this.client.onDisconnect = () => {
        console.log('📴 WebSocket disconnected');
        this.connected = false;
      };

      this.client.activate();
    });
  }

  // Request user status for all friends
  requestFriendsStatus() {
    if (this.connected && this.client) {
      console.log('📡 Requesting friends status...');
      this.client.publish({
        destination: '/app/getUserStatus',
        body: JSON.stringify({ action: 'requestAllFriendsStatus' })
      });
    } else {
      console.warn('⚠️ WebSocket not connected, cannot request friends status');
    }
  }

  async setUserOnline() {
    try {
      if (this.client && this.connected) {
        console.log('🌐 Sending WebSocket message to: /app/user/connect');
        // Gửi STOMP message tới WebSocket controller
        this.client.publish({
          destination: '/app/user/connect',
          body: JSON.stringify({})
        });
        console.log('✅ User connect message sent successfully');
        return true;
      } else {
        console.error('❌ WebSocket not connected');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending connect message:', error);
      return false;
    }
  }

  sendTestMessage() {
    if (!this.connected || !this.client) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/test',
        body: JSON.stringify({ message: 'Test from frontend' })
      });
      
      console.log('📤 Test message sent to backend');
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Gửi tin nhắn qua WebSocket
  sendMessage(chatRoomId, messageData) {
    return new Promise((resolve, reject) => {
      console.log('🔍 WebSocket sendMessage called:', {
        connected: this.connected,
        client: !!this.client,
        chatRoomId,
        messageData
      });
      
      if (!this.connected || !this.client) {
        console.error('❌ WebSocket not connected:', {
          connected: this.connected,
          client: !!this.client
        });
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        console.log(`📤 [WebSocket] Sending message to chatroom ${chatRoomId}:`, messageData);
        
        // Chuẩn bị dữ liệu tin nhắn theo format backend expect
        const sendMessageRequest = {
          content: messageData.content,
          messageType: messageData.messageType || 'TEXT'
        };

        console.log(`📤 [WebSocket] Request payload:`, sendMessageRequest);
        console.log(`📤 [WebSocket] Destination: /app/chatrooms/${chatRoomId}/send-message`);

        // Gửi tin nhắn tới WebSocket endpoint - KHÔNG subscribe ở đây
        // Vì subscription đã được setup trong ChatContext
        this.client.publish({
          destination: `/app/chatrooms/${chatRoomId}/send-message`,
          body: JSON.stringify(sendMessageRequest)
        });

        console.log(`✅ [WebSocket] Message published successfully to chatroom ${chatRoomId}`);
        
        // Return success immediately - actual response sẽ đến qua subscription
        resolve({
          success: true,
          message: 'Message sent via WebSocket'
        });

      } catch (error) {
        console.error('❌ [WebSocket] Error sending message:', error);
        reject(error);
      }
    });
  }

  // Subscribe để nhận tin nhắn mới từ một chatroom
  subscribeToMessages(chatRoomId, onMessageReceived) {
    if (!this.connected || !this.client) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    console.log(`🔔 Subscribing to messages for chatroom: ${chatRoomId}`);
    console.log(`🔔 Topic: /topic/chatrooms/${chatRoomId}/new-message`);
    
    const subscription = this.client.subscribe(`/topic/chatrooms/${chatRoomId}/new-message`, (message) => {
      try {
        console.log(`📨 RAW message received on topic /topic/chatrooms/${chatRoomId}/new-message:`, message.body);
        const messageData = JSON.parse(message.body);
        console.log('📨 PARSED message received:', messageData);
        
        if (onMessageReceived) {
          onMessageReceived(messageData);
        }
      } catch (error) {
        console.error('❌ Error parsing received message:', error);
      }
    });

    console.log(`✅ Successfully subscribed to chatroom ${chatRoomId} messages`);
    return subscription;
  }

  // Kiểm tra trạng thái kết nối
  isConnected() {
    return this.connected && this.client && this.client.connected;
  }

  // Thử kết nối lại nếu bị mất kết nối
  async reconnectIfNeeded(username) {
    if (!this.isConnected()) {
      console.log('🔄 WebSocket not connected, attempting to reconnect...');
      try {
        await this.connect(username);
        return true;
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        return false;
      }
    }
    return true;
  }

  async setUserOffline() {
    try {
      if (this.client && this.connected) {
        console.log('🌐 Sending WebSocket message to: /app/user/disconnect');
        // Gửi STOMP message tới WebSocket controller để set offline
        this.client.publish({
          destination: '/app/user/disconnect',
          body: JSON.stringify({})
        });
        console.log('✅ User disconnect message sent successfully');
        return true;
      } else {
        console.error('❌ WebSocket not connected');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending disconnect message:', error);
      return false;
    }
  }

  disconnect() {
    if (this.client && this.connected) {
      // Gửi disconnect message trước khi đóng kết nối
      try {
        this.setUserOffline();
        // Delay một chút để message được gửi trước khi disconnect
        setTimeout(() => {
          this.client.deactivate();
        }, 100);
      } catch (error) {
        console.error('❌ Error during disconnect:', error);
        this.client.deactivate();
      }
      this.connected = false;
      console.log('🔌 WebSocket Disconnected');
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;