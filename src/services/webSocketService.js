import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiService from './apiService';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.onUserStatusUpdate = null; // Callback để update UI
    this.sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9); // Unique session ID
    this.userToken = null; // Store token for this WebSocket instance
    this.currentUser = null; // Store user info for this session
  }

  setOnUserStatusUpdate(callback) {
    this.onUserStatusUpdate = callback;
  }

  async connect(username = null, userToken = null) {
    return new Promise(async (resolve, reject) => {
      console.log(`🔌 [${this.sessionId}] Connecting to WebSocket for user: ${username}`);
      
      // Store token and user info for this WebSocket instance
      if (userToken) {
        this.userToken = userToken;
        this.currentUser = username;
        console.log(`💾 [${this.sessionId}] Stored token for user ${username}:`, userToken ? `${userToken.substring(0, 20)}...` : 'null');
      } else {
        // Fallback to global token if not provided
        this.userToken = apiService.getToken();
        this.currentUser = username;
        console.log(`💾 [${this.sessionId}] Using global token for user ${username}:`, this.userToken ? `${this.userToken.substring(0, 20)}...` : 'null');
      }
      
      // IMPORTANT: Force disconnect any existing connection first
      if (this.client) {
        console.log(`🔌 [${this.sessionId}] Force disconnecting existing WebSocket connection`);
        try {
          if (this.client.connected) {
            this.client.deactivate();
          }
        } catch (e) {
          console.log(`⚠️ [${this.sessionId}] Error during force disconnect:`, e);
        }
        this.client = null;
        this.connected = false;
        
        // Wait a bit to ensure clean disconnect
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🔌 [DEBUG] Creating SockJS connection to: http://localhost:8080/chatapp/ws`);
      // Add session parameter to make each connection unique
      const wsUrl = `http://localhost:8080/chatapp/ws?session=${this.sessionId}&user=${this.currentUser}&t=${Date.now()}`;
      console.log(`🔌 [DEBUG] Unique WebSocket URL:`, wsUrl);
      const socket = new SockJS(wsUrl);
      
      console.log(`🔌 [DEBUG] Token for WebSocket auth:`, this.userToken ? `Present (${this.userToken.substring(0, 20)}...)` : 'Missing');
      
      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${this.userToken}`,
          'Session-ID': this.sessionId, // Add unique session identifier
          'User': this.currentUser || 'unknown',
          'X-User-Session': `${this.currentUser}-${this.sessionId}`,
          'X-Timestamp': Date.now().toString(),
          'X-Force-New-Connection': 'true'
        },
        debug: (str) => console.log(`STOMP [${this.sessionId}]:`, str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log(`✅ [${this.sessionId}] WebSocket Connected for user: ${username}`);
        console.log(`🔍 [${this.sessionId}] Connection frame:`, frame);
        console.log(`🔍 [${this.sessionId}] Connection headers used:`, this.client.connectHeaders);
        console.log(`🔍 [${this.sessionId}] Stored token:`, this.userToken ? `${this.userToken.substring(0, 30)}...` : 'null');
        console.log(`🔍 [${this.sessionId}] Current user:`, this.currentUser);
        this.connected = true;
        
        // Subscribe để nhận status updates từ backend - topic có username riêng
        if (username) {
          console.log(`🔔 [${this.sessionId}] Subscribing to: /topic/status/${username}`);
          this.client.subscribe(`/topic/status/${username}`, (message) => {
            const userStatus = JSON.parse(message.body);
            console.log(`📢 [${this.sessionId}] User status update received:`, userStatus);
            console.log(`🔍 [${this.sessionId}] Status details:`, {
              id: userStatus.id,
              username: userStatus.username, 
              name: userStatus.name,
              isOnline: userStatus.isOnline,
              online: userStatus.online,
              lastSeen: userStatus.lastSeen,
              fullObject: userStatus
            });
            
            // Chuẩn hóa format - đảm bảo có trường online
            const normalizedStatus = {
              ...userStatus,
              online: userStatus.online !== undefined ? userStatus.online : userStatus.isOnline
            };
            
            console.log(`🔄 [${this.sessionId}] Normalized status:`, normalizedStatus);
            
            // Gọi callback để update UI
            if (this.onUserStatusUpdate) {
              console.log(`📤 [${this.sessionId}] Calling status update callback...`);
              this.onUserStatusUpdate(normalizedStatus);
            } else {
              console.log(`⚠️ [${this.sessionId}] No status update callback registered!`);
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
        console.log(`🌐 [${this.sessionId}] Sending WebSocket message to: /app/user/connect`);
        console.log(`👤 [${this.sessionId}] Setting user online for:`, this.currentUser);
        // Gửi STOMP message tới WebSocket controller
        this.client.publish({
          destination: '/app/user/connect',
          body: JSON.stringify({})
        });
        console.log(`✅ [${this.sessionId}] User connect message sent successfully`);
        return true;
      } else {
        console.error(`❌ [${this.sessionId}] WebSocket not connected`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error sending connect message:`, error);
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
    
    // Debug: Check current token being used by this WebSocket instance
    console.log(`🔍 [DEBUG] Current WebSocket token:`, {
      sessionId: this.sessionId,
      storedToken: this.userToken ? `${this.userToken.substring(0, 30)}...` : 'null',
      currentUser: this.currentUser,
      hasClient: !!this.client,
      connectionHeaders: this.client?.connectHeaders
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
      // Use stored user info and token for reconnection
      if (this.currentUser && this.userToken) {
        await this.connect(this.currentUser, this.userToken);
        console.log(`✅ [${this.sessionId}] WebSocket reconnection successful for user ${this.currentUser}`);
        return true;
      } else {
        // Fallback to localStorage if available
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
          throw new Error('No user info found for reconnection');
        }
        
        const user = JSON.parse(userInfo);
        const token = apiService.getToken();
        await this.connect(user.username, token);
        
        console.log(`✅ [${this.sessionId}] WebSocket reconnection successful`);
        return true;
      }
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

// Create new instance for each app session instead of singleton
// This prevents token/connection mixing between different browser windows
export const createWebSocketService = () => new WebSocketService();

// For backward compatibility, export a default instance
// But recommend using createWebSocketService() for multi-window support
const webSocketService = new WebSocketService();
export default webSocketService;