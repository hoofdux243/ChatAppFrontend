import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { MainLayout } from '../components/Layout';
import FriendsPanel from '../components/Friends/FriendsPanel';
import FriendsMainContent from '../components/Friends/FriendsMainContent';
import WindowChat from '../components/WindowChat/WindowChat';

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsCount, setFriendsCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const { setSelectedConversation } = useChat();

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

  // 📋 Left Panel Component
  const leftPanel = (
    <FriendsPanel 
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );

  // 💬 Main Content Component - Conditional rendering
  const mainContent = selectedChat ? (
    <WindowChat 
      conversation={selectedChat}
      onBack={handleBackToFriends}
    />
  ) : (
    <FriendsMainContent 
      activeTab={activeTab}
      friendsCount={friendsCount}
      onFriendsCountChange={handleFriendsCountChange}
      onSelectChat={handleSelectChat}
    />
  );

  return (
    <MainLayout
      leftPanel={leftPanel}
      mainContent={mainContent}
      showInfoPanel={Boolean(selectedChat)}
      selectedConversation={selectedChat}
      className="main-layout--friends"
    />
  );
};

export default FriendsPage;