import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../shared/Avatar';
import Profile from '../Profile/Profile';
import chatService from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { 
  IoChatbubbleEllipsesOutline, 
  IoChatbubbleEllipses,
  IoPeopleOutline,
  IoPeople,
  IoSettingsOutline,
  IoSettings,
  IoPersonOutline,
  IoLogOutOutline,
  IoAppsOutline,
  IoApps,
  IoGridOutline,
  IoGrid
} from 'react-icons/io5';
import '../../assets/css/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Lấy từ context
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Ưu tiên dùng user từ context
        if (user) {
          setCurrentUser(user);
        } else {
          // Fallback: gọi API
          const userData = await chatService.getCurrentUser();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, [user]); // Dependency là user từ context

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserInfo && !event.target.closest('.sidebar-avatar') && !event.target.closest('.user-dropdown')) {
        setShowUserInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserInfo]);

  const isPathActive = (keyword) => {
    if (location.pathname === "/chat") {
      return keyword === "chats";
    }
    return location.pathname.includes(keyword);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout(); // Dùng logout từ useAuth context
      navigate('/');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-avatar" onClick={() => setShowUserInfo(!showUserInfo)}>
        <Avatar 
          src={currentUser?.avatar} 
          alt={currentUser?.username} 
          size="large"
        />
      </div>
      
      <div 
        className={`sidebar-icon ${isPathActive('chats') ? 'active' : ''}`}
        onClick={() => navigate('/chat')}
        title="Tin nhắn"
      >
        {isPathActive('chats') ? 
          <IoChatbubbleEllipses size={28} /> : 
          <IoChatbubbleEllipsesOutline size={28} />
        }
      </div>
      
      <div 
        className={`sidebar-icon ${isPathActive('contacts') ? 'active' : ''}`}
        onClick={() => navigate('/contacts')}
        title="Danh bạ"
      >
        {isPathActive('contacts') ? 
          <IoPeople size={28} /> : 
          <IoPeopleOutline size={28} />
        }
      </div>
      
      <div 
        className="sidebar-icon"
        title="Ứng dụng"
      >
        <IoAppsOutline size={28} />
      </div>

      <div 
        className="sidebar-icon"
        title="Bảng điều khiển"
      >
        <IoGridOutline size={28} />
      </div>
      
      <div 
        className="sidebar-icon"
        title="Cài đặt"
      >
        <IoSettingsOutline size={28} />
      </div>

      {/* User Info Dropdown */}
      {showUserInfo && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <Avatar 
              src={currentUser?.avatar} 
              alt={currentUser?.username} 
              size="medium"
            />
            <div>
              <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>{currentUser?.name || currentUser?.username}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="user-dropdown-menu">
            <div 
              className="user-dropdown-item"
              onClick={() => {
                setShowUserInfo(false);
                setShowProfile(true);
              }}
            >
              <IoPersonOutline size={20} />
              <span>Hồ sơ của bạn</span>
            </div>
            
            <div 
              className="user-dropdown-item"
              onClick={() => {
                setShowUserInfo(false);
                handleLogout();
              }}
            >
              <IoLogOutOutline size={20} />
              <span>Đăng xuất</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <Profile 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Sidebar;
