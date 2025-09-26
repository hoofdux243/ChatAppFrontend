import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar/Sidebar';
import FriendsPanel from '../components/Friends/FriendsPanel';
import FriendsMainContent from '../components/Friends/FriendsMainContent';
import WindowChat from '../components/WindowChat/WindowChat';
import InfoPanel from '../components/InfoPanel/InfoPanel';
import '../assets/css/ChatPage.css';

const FriendsPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsCount, setFriendsCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const { user } = useAuth(); // Lấy user từ context
  const { setSelectedConversation } = useChat();

  useEffect(() => {
    // Sử dụng user từ auth context - copy y hệt từ ChatPage
    if (user) {
      setCurrentUser({
        id: user.id || 'me',
        username: user.username || user.name || 'Current User',
        email: user.email || 'user@example.com',
        avatar: user.avatar || null
      });
    }
  }, [user]); // Dependency là user từ context

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFriendsCountChange = (count) => {
    setFriendsCount(count);
  };

  const handleSelectChat = (group) => {
    // Convert group object to conversation format
    const conversation = {
      id: group.chatRoomId,
      chatRoomId: group.chatRoomId,
      name: group.chatRoomName,
      avatar: group.chatRoomAvatar,
      type: 'group',
      memberCount: group.memberCount,
      lastMessage: group.lastMessage
    };
    
    setSelectedChat(conversation);
    setSelectedConversation(conversation);
  };

  const handleBackToFriends = () => {
    setSelectedChat(null);
    setSelectedConversation(null);
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
      
      <FriendsPanel 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="chat-window-container">
        {selectedChat ? (
          <WindowChat 
            conversation={selectedChat}
            currentUser={currentUser}
            onToggleInfoPanel={handleToggleInfoPanel}
            isInfoPanelOpen={isInfoPanelOpen}
            onBack={handleBackToFriends}
          />
        ) : (
          <FriendsMainContent 
            activeTab={activeTab}
            friendsCount={friendsCount}
            onFriendsCountChange={handleFriendsCountChange}
            onSelectChat={handleSelectChat}
          />
        )}
      </div>

      {selectedChat && (
        <InfoPanel 
          isOpen={isInfoPanelOpen}
          onClose={handleCloseInfoPanel}
          selectedConversation={selectedChat}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default FriendsPage;