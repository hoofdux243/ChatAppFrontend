// 🔐 Auth Layout - Cho Login, Register pages
import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ 
  children,
  title,
  subtitle,
  backgroundImage,
  className = ''
}) => {
  return (
    <div className={`auth-layout ${className}`}>
      {/* 🎨 Background */}
      <div className="auth-layout__background">
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            alt="Background" 
            className="auth-layout__bg-image"
          />
        )}
        <div className="auth-layout__overlay" />
      </div>

      {/* 📱 Content Container */}
      <div className="auth-layout__container">
        <div className="auth-layout__card">
          {/* 🏷️ Header */}
          {(title || subtitle) && (
            <div className="auth-layout__header">
              {title && (
                <h1 className="auth-layout__title">{title}</h1>
              )}
              {subtitle && (
                <p className="auth-layout__subtitle">{subtitle}</p>
              )}
            </div>
          )}

          {/* 📝 Content */}
          <div className="auth-layout__content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;