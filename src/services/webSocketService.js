import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiService from './apiService';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.onUserStatusUpdate = null; // Callback để update UI
    this.sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9); // Unique session ID
  }

  setOnUserStatusUpdate(callback) {
    this.onUserStatusUpdate = callback;
  }

  connect(username = null) {
    return new Promise((resolve, reject) => {
      console.log(`🔌 [${this.sessionId}] Connecting to WebSocket for user: ${username}`);
      
      // IMPORTANT: Disconnect existing connection first
      if (this.client && this.connected) {
        console.log(`🔌 [${this.sessionId}] Disconnecting existing WebSocket connection before creating new one`);
        this.disconnect();
      }
      
      console.log(`🔌 [DEBUG] Creating SockJS connection to: http://localhost:8080/chatapp/ws (${Date.now()})`);
      const socket = new SockJS('http://localhost:8080/chatapp/ws');
      const token = apiService.getToken();
      
      console.log(`🔌 [DEBUG] Token for WebSocket auth:`, token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
      
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${token}`,
          'Session-ID': this.sessionId // Add unique session identifier
        },
        debug: (str) => console.log(`STOMP [${this.sessionId}]:`, str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log(`✅ [${this.sessionId}] WebSocket Connected for user: ${username}`);
        this.connected = true;
        
        // Subscribe để nhận status updates từ backend - topic có username riêng
        if (username) {
          console.log(`🔔 [${this.sessionId}] Subscribing to: /topic/status/${username}`);
          this.client.subscribe(`/topic/status/${username}`, (message) => {
            const userStatus = JSON.parse(message.body);
            console.log(`📢 [${this.sessionId}] User status update received:`, userStatus);
            
            // Chuẩn hóa format - đảm bảo có trường online
            const normalizedStatus = {
              ...userStatus,
              online: userStatus.online !== undefined ? userStatus.online : userStatus.isOnline
            };
            
            // Gọi callback để update UI
            if (this.onUserStatusUpdate) {
              this.onUserStatusUpdate(normalizedStatus);
            }
          });
        } else {
          console.warn(`⚠️ [${this.sessionId}] No username provided for WebSocket subscription`);
        }
        
        resolve(frame);
      };

      this.client.onStompError = (frame) => {
        console.error(`❌ [${this.sessionId}] STOMP Error:`, frame);
        console.error(`❌ [DEBUG] Error headers:`, frame.headers);
        console.error(`❌ [DEBUG] Error body:`, frame.body);
        this.connected = false;
        reject(frame);
      };

      this.client.onWebSocketError = (error) => {
        console.error(`❌ [${this.sessionId}] WebSocket Error:`, error);
        this.connected = false;
        reject(error);
      };

      // Handle disconnect events
      this.client.onWebSocketClose = (event) => {
        console.log(`🔌 [${this.sessionId}] WebSocket connection closed:`, event);
        this.connected = false;
        
        // Notify UI that connection is lost
        if (this.onUserStatusUpdate) {
          console.log(`📢 [${this.sessionId}] Broadcasting connection lost to UI`);
          // Can add logic here to update UI state
        }
      };

      this.client.onDisconnect = () => {
        console.log(`📴 [${this.sessionId}] WebSocket disconnected`);
        this.connected = false;
      };

      console.log(`🔌 [DEBUG] Activating STOMP client...`);
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
    console.log(`🚀 [DEBUG] WebSocket sendMessage called:`, {
      chatRoomId,
      messageData,
      sessionId: this.sessionId,
      connected: this.connected,
      clientExists: !!this.client
    });
    
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        console.error(`❌ [${this.sessionId}] WebSocket not connected`);
        reject(new Error('WebSocket not connected - please check connection and try again'));
        return;
      }

      try {
        // Chỉ gửi text messages qua WebSocket
        const sendMessageRequest = {
          content: messageData.content || '',
          messageType: messageData.messageType || 'TEXT'
        };

        // Nếu có replyToMessageId, thêm vào request  
        if (messageData.replyToMessageId) {
          sendMessageRequest.replyToMessageId = messageData.replyToMessageId;
        }

        console.log(`📤 [DEBUG] Sending message via WebSocket:`, {
          destination: `/app/chatrooms/${chatRoomId}/send-message`,
          payload: sendMessageRequest
        });

        // Gửi text message qua WebSocket
        this.client.publish({
          destination: `/app/chatrooms/${chatRoomId}/send-message`,
          body: JSON.stringify(sendMessageRequest)
        });
        
        console.log(`✅ [DEBUG] Message published to WebSocket successfully`);
        
        resolve({
          success: true,
          message: 'Message sent via WebSocket'
        });

      } catch (error) {
        console.error(`💥 [DEBUG] Error sending message via WebSocket:`, error);
        reject(error);
      }
    });
  }

  // Subscribe để nhận tin nhắn mới từ một chatroom
  subscribeToMessages(chatRoomId, onMessageReceived) {
    if (!this.connected || !this.client) {
      console.error(`❌ [${this.sessionId}] WebSocket not connected`);
      return null;
    }

    console.log(`🔔 [${this.sessionId}] Subscribing to messages for chatroom: ${chatRoomId}`);
    
    const subscription = this.client.subscribe(`/topic/chatrooms/${chatRoomId}/new-message`, (message) => {
      try {
        console.log(`📨 [DEBUG] RAW message received from WebSocket:`, {
          topic: `/topic/chatrooms/${chatRoomId}/new-message`,
          body: message.body
        });
        
        const messageData = JSON.parse(message.body);
        console.log(`📨 [DEBUG] PARSED message received:`, messageData);
        
        if (onMessageReceived) {
          console.log(`🔔 [DEBUG] Calling onMessageReceived callback with:`, messageData);
          onMessageReceived(messageData);
        } else {
          console.log(`⚠️ [DEBUG] No onMessageReceived callback provided`);
        }
      } catch (error) {
        console.error(`❌ [${this.sessionId}] Error parsing received message:`, error);
      }
    });

    console.log(`✅ [${this.sessionId}] Successfully subscribed to chatroom ${chatRoomId} messages`);
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
    if (this.client) {
      console.log('🔌 Disconnecting WebSocket...');
      
      // Set flags first
      this.connected = false;
      
      try {
        // Gửi disconnect message nếu vẫn connected
        if (this.client.connected) {
          this.setUserOffline();
        }
        
        // Deactivate client
        this.client.deactivate();
        
        // Clear client reference
        this.client = null;
        
        console.log('🔌 WebSocket Disconnected successfully');
      } catch (error) {
        console.error('❌ Error during disconnect:', error);
        // Force cleanup
        this.client = null;
      }
    }
  }

  // Attempt to reconnect WebSocket
  async attemptReconnect() {
    console.log(`🔄 [${this.sessionId}] Attempting WebSocket reconnection...`);
    
    try {
      // Get current user info for reconnection
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        throw new Error('No user info found for reconnection');
      }
      
      const user = JSON.parse(userInfo);
      await this.connect(user.username);
      
      console.log(`✅ [${this.sessionId}] WebSocket reconnection successful`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.sessionId}] WebSocket reconnection failed:`, error);
      throw error;
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.client && this.client.connected;
  }
}

// Use singleton but with session-based isolation
const webSocketService = new WebSocketService();
export default webSocketService;