import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatList from '../components/ChatList/ChatList';
import WindowChat from '../components/WindowChat/WindowChat';
import InfoPanel from '../components/InfoPanel/InfoPanel';
import '../assets/css/ChatPage.css';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const { selectedConversation, setSelectedConversation } = useChat();
  const { user } = useAuth(); // Lấy user từ context

  useEffect(() => {
    // Sử dụng user từ auth context
    if (user) {
      setCurrentUser({
        id: user.id || 'me',
        username: user.username || user.name || 'Current User',
        email: user.email || 'user@example.com',
        avatar: user.avatar || null
      });
    }
  }, [user]); // Dependency là user từ context

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleToggleInfoPanel = () => {
    setIsInfoPanelOpen(!isInfoPanelOpen);
  };

  const handleCloseInfoPanel = () => {
    setIsInfoPanelOpen(false);
  };

  return (
    <div className="chat-main-container">
      <Sidebar user={currentUser} />
      
      <ChatList 
        onSelectConversation={handleSelectConversation}
        selectedConversation={selectedConversation}
      />
      
      <div className="chat-window-container">
        <WindowChat 
          conversation={selectedConversation}
          currentUser={currentUser}
          onToggleInfoPanel={handleToggleInfoPanel}
          isInfoPanelOpen={isInfoPanelOpen}
        />
      </div>

      <InfoPanel 
        isOpen={isInfoPanelOpen}
        onClose={handleCloseInfoPanel}
        selectedConversation={selectedConversation}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ChatPage;
