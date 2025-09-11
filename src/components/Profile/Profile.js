import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCamera, FaEdit, FaSave } from 'react-icons/fa';
import chatService from '../../services/chatService';
import './Profile.css';

const Profile = ({ isOpen, onClose, currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    bio: ''
  });

  const fileInputRef = React.useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always use fallback data first to avoid breaking login
      const mockProfile = {
        id: currentUser?.id || 1,
        name: currentUser?.name || 'Vũ',
        avatar: currentUser?.avatar || '/api/placeholder/150/150',
        bio: currentUser?.bio,
      };
      
      setProfile(mockProfile);
      setEditData({
        name: mockProfile.name,
        bio: mockProfile.bio
      });

      // Try to call real API but don't break if it fails
      try {
        const response = await chatService.getUserProfile();
        console.log('Profile API response:', response);
        
        if (response && response.result) {
          const profileData = response.result;
          
          // Update with real data if available
          setProfile(prev => ({
            ...prev,
            name: profileData.name || prev.name,
            username: profileData.username || 'vu1',
            email: profileData.email || '',
            avatar: profileData.avatar || prev.avatar,
            bio: profileData.bio || prev.bio,
            status: profileData.status
          }));
          
          setEditData(prev => ({
            ...prev,
            name: profileData.name || prev.name,
            bio: profileData.bio || prev.bio
          }));
        }
      } catch (apiError) {
        console.log('API call failed, using fallback data:', apiError.message);
        // Continue with mock data, don't throw error
      }
      
    } catch (error) {
      console.error('Error in loadProfile:', error);
      setError('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, loadProfile]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          avatar: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update profile with form data
      const updatedProfile = {
        ...profile,
        ...editData
      };
      
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Không thể lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: profile?.name || '',
      gender: profile?.gender || 'Nam',
      birthDate: {
        day: '24',
        month: '03',
        year: '2004'
      },
      phone: profile?.phone || '',
      bio: profile?.bio || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`profile-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`profile-modal ${isClosing ? 'closing' : ''}`}>
        {/* Header with title */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid #f0f0f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'white'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
            Thông tin tài khoản
          </h3>
          <button 
            className="profile-back-btn"
            onClick={handleClose}
            style={{ position: 'static', background: 'none', color: '#666' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Header with avatar */}
        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <img 
                src={profile?.avatar || '/api/placeholder/150/150'} 
                alt="Avatar" 
                className="profile-avatar"
                onClick={handleAvatarClick}
              />
              <div className="profile-avatar-edit" onClick={handleAvatarClick}>
                <FaCamera />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="profile-name">
            {profile?.name}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Content */}
        {loading ? (
          <div className="profile-content" style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div>Đang tải...</div>
          </div>
        ) : error ? (
          <div className="profile-content" style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ color: '#e74c3c' }}>{error}</div>
          </div>
        ) : isEditing ? (
          // Edit Form
          <div className="profile-form">
            <div className="profile-form-group">
              <label className="profile-form-label">Họ và tên</label>
              <input
                type="text"
                className="profile-form-input"
                value={editData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Bio</label>
              <textarea
                className="profile-form-textarea"
                value={editData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Viết vài dòng về bản thân..."
                rows="3"
              />
            </div>

            <div className="profile-form-actions">
              <button 
                className="profile-btn profile-btn-secondary"
                onClick={handleCancel}
              >
                <FaTimes /> Hủy
              </button>
              <button 
                className="profile-btn profile-btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                <FaSave /> {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          // Display Mode
          <div className="profile-content">
            {/* Bio Section */}
            <div className="profile-info-section">
              <div className="profile-info-title">Bio</div>
              <div className="profile-bio-text">
                {profile?.bio || 'Chưa có tiểu sử'}
              </div>
            </div>

            {/* Update Button */}
            <button 
              className="profile-update-btn"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit /> Cập nhật
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
