import webSocketService from '../services/webSocketService';

// Helper utility để debug và quản lý WebSocket connection
export const WebSocketHelper = {
  // Kiểm tra trạng thái kết nối
  checkConnection: () => {
    const isConnected = webSocketService.isConnected();
    console.log(`🔍 [WebSocketHelper] Connection status:`, {
      connected: isConnected,
      hasClient: !!webSocketService.client,
      clientConnected: webSocketService.client?.connected
    });
    return isConnected;
  },

  // Force reconnect
  forceReconnect: async () => {
    console.log(`🔄 [WebSocketHelper] Forcing WebSocket reconnection...`);
    
    try {
      // Get user info from localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        throw new Error('No user info found');
      }
      
      const user = JSON.parse(userInfo);
      
      // Disconnect first if connected
      if (webSocketService.client) {
        webSocketService.disconnect();
      }
      
      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect
      await webSocketService.connect(user.username);
      
      console.log(`✅ [WebSocketHelper] Force reconnection successful`);
      return true;
    } catch (error) {
      console.error(`❌ [WebSocketHelper] Force reconnection failed:`, error);
      throw error;
    }
  },

  // Test connection bằng cách gửi test message
  testConnection: () => {
    console.log(`🧪 [WebSocketHelper] Testing WebSocket connection...`);
    
    if (!webSocketService.isConnected()) {
      console.error(`❌ [WebSocketHelper] WebSocket not connected`);
      return false;
    }
    
    try {
      const testResult = webSocketService.sendTestMessage();
      console.log(`🧪 [WebSocketHelper] Test message result:`, testResult);
      return testResult;
    } catch (error) {
      console.error(`❌ [WebSocketHelper] Test message failed:`, error);
      return false;
    }
  }
};

// Expose to window for manual debugging
if (typeof window !== 'undefined') {
  window.WebSocketHelper = WebSocketHelper;
}

export default WebSocketHelper;