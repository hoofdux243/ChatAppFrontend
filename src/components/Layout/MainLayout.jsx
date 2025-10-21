// 🏗️ Main Layout Component - Tái sử dụng cho Chat, Friends, Profile...
import React, { useState } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Sidebar from '../Sidebar/Sidebar';
import InfoPanel from '../InfoPanel/InfoPanel';
import './MainLayout.css';

const MainLayout = ({ 
  leftPanel,           // Component bên trái (ChatList, FriendsPanel...)
  mainContent,         // Content chính (WindowChat, FriendsMainContent...)
  showInfoPanel = false,  // Có hiển thị InfoPanel không
  selectedConversation,   // Conversation được chọn
  onToggleInfoPanel,      // Callback toggle InfoPanel
  onCloseInfoPanel,       // Callback đóng InfoPanel
  className = ''          // Custom CSS class
}) => {
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const currentUser = useCurrentUser(); // ✅ Sử dụng hook chung

  // Handle InfoPanel toggle
  const handleToggleInfoPanel = () => {
    const newState = !isInfoPanelOpen;
    setIsInfoPanelOpen(newState);
    onToggleInfoPanel?.(newState);
  };

  const handleCloseInfoPanel = () => {
    setIsInfoPanelOpen(false);
    onCloseInfoPanel?.();
  };

  return (
    <div className={`main-layout ${className}`}>
      {/* 🎯 Sidebar - Luôn có */}
      <div className="main-layout__sidebar">
        <Sidebar user={currentUser} />
      </div>

      {/* 📋 Left Panel - Flexible content */}
      <div className="main-layout__left-panel">
        {React.cloneElement(leftPanel, { currentUser })}
      </div>

      {/* 💬 Main Content - Flexible content */}
      <div className="main-layout__main-content">
        {React.cloneElement(mainContent, { 
          currentUser,
          onToggleInfoPanel: handleToggleInfoPanel,
          isInfoPanelOpen
        })}
      </div>

      {/* ℹ️ Info Panel - Conditional */}
      {showInfoPanel && (
        <div className={`main-layout__info-panel ${isInfoPanelOpen ? 'open' : ''}`}>
          <InfoPanel 
            isOpen={isInfoPanelOpen}
            onClose={handleCloseInfoPanel}
            selectedConversation={selectedConversation}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
};

export default MainLayout;