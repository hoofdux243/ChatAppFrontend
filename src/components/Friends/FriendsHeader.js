import React from 'react';
import { IoPeopleOutline } from 'react-icons/io5';
import './FriendsHeader.css';

const FriendsHeader = ({ friendsCount = 0, selectedContact }) => {
  return (
    <div className="friends-header">
      <div className="friends-header-left">
        <div className="friends-icon">
          <IoPeopleOutline size={24} />
        </div>
        <div className="friends-title">
          <h2>Bạn bè ({friendsCount})</h2>
          <p className="friends-subtitle">Danh sách bạn bè của bạn</p>
        </div>
      </div>
      
      {selectedContact && (
        <div className="selected-friend-info">
          <span>Đã chọn: {selectedContact.name}</span>
        </div>
      )}
    </div>
  );
};

export default FriendsHeader;