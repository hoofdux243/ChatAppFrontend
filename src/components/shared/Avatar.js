import React from 'react';
import '../../assets/css/Avatar.css';

const Avatar = ({ src, alt = "Avatar", size = "medium", onClick }) => {
  const getDefaultAvatar = () => {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
  };

  return (
    <img
      src={src || getDefaultAvatar()}
      alt={alt}
      className={`avatar ${size}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
};

export default Avatar;
