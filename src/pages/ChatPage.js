import React from 'react';
import { useChat } from '../context/ChatContext';
import { MainLayout } from '../components/Layout';
import ChatList from '../components/ChatList/ChatList';
import WindowChat from '../components/WindowChat/WindowChat';

const ChatPage = () => {
  const { selectedConversation, setSelectedConversation } = useChat();

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  // 📋 Left Panel Component
  const leftPanel = (
    <ChatList 
      onSelectConversation={handleSelectConversation}
      selectedConversation={selectedConversation}
    />
  );

  // 💬 Main Content Component  
  const mainContent = (
    <WindowChat 
      conversation={selectedConversation}
    />
  );

  return (
    <MainLayout
      leftPanel={leftPanel}
      mainContent={mainContent}
      showInfoPanel={true}
      selectedConversation={selectedConversation}
      className="main-layout--chat"
    />
  );
};

export default ChatPage;
