import React from 'react';
import { 
  IoPeopleOutline, 
  IoPeople,
  IoPersonAddOutline,
  IoMailOutline,
  IoSendOutline
} from 'react-icons/io5';
import './FriendsPanel.css';

const FriendsPanel = ({ activeTab, onTabChange }) => {
  return (
    <div className="friends-panel">
      {/* Friends Tab Navigation - nằm ở sidebar trái */}
      <div className="friends-tabs">
        <div 
          className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => onTabChange('friends')}
        >
          {activeTab === 'friends' ? 
            <IoPeople size={18} /> : 
            <IoPeopleOutline size={18} />
          }
          <span>Danh sách bạn bè</span>
        </div>
        
        <div 
          className={`friends-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => onTabChange('groups')}
        >
          {activeTab === 'groups' ? 
            <IoPeople size={18} /> : 
            <IoPeopleOutline size={18} />
          }
          <span>Danh sách nhóm và cộng đồng</span>
        </div>
        
        <div 
          className={`friends-tab ${activeTab === 'friend-requests' ? 'active' : ''}`}
          onClick={() => onTabChange('friend-requests')}
        >
          <IoMailOutline size={18} />
          <span>Lời mời kết bạn</span>
        </div>

        <div 
          className={`friends-tab ${activeTab === 'sent-requests' ? 'active' : ''}`}
          onClick={() => onTabChange('sent-requests')}
        >
          <IoSendOutline size={18} />
          <span>Lời mời kết bạn đã gửi</span>
        </div>
      </div>
    </div>
  );
};

export default FriendsPanel;