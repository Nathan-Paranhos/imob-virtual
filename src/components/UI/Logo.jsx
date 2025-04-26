// src/components/UI/Logo.jsx
import React from 'react';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo">
      <div className="logo-icon">
        <div className="logo-house"></div>
        <div className="logo-3d"></div>
      </div>
      <div className="logo-text">ImmoVision</div>
    </div>
  );
};

export default Logo;