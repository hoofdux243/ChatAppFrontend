import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../shared/Avatar';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserInfo, setShowUserInfo] = useState(false);

  const isPathActive = (keyword) => {
    if (location.pathname === "/chat") {
      return keyword === "chats";
    }
    return location.pathname.includes(keyword);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log("User logged out successfully");
      navigate('/');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-avatar" onClick={() => setShowUserInfo(!showUserInfo)}>
        <Avatar 
          src={user?.avatar} 
          alt={user?.username} 
          size="large"
        />
      </div>
      
      <div 
        className={`sidebar-icon ${isPathActive('chats') ? 'active' : ''}`}
        onClick={() => navigate('/chat')}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      
      <div 
        className={`sidebar-icon ${isPathActive('contacts') ? 'active' : ''}`}
        onClick={() => navigate('/contacts')}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 16.96 6c-.8 0-1.54.37-2.01.97L12 10.9l-2.95-3.93A2.996 2.996 0 0 0 6.04 6c-1.3 0-2.4.84-2.82 2.01L1 16h2.5v6h2v-6h3l.5-2H7l1.5-4.5L12 14.1l3.5-4.6L17 14h-1.5l.5 2h3v6h2z"/>
        </svg>
      </div>
      
      <div className="sidebar-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </div>
      
      <div className="sidebar-icon" onClick={handleLogout}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
      </div>

      {showUserInfo && (
        <div style={{
          position: 'absolute',
          left: '70px',
          top: '20px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '200px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{user?.username}</h3>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>{user?.email}</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
