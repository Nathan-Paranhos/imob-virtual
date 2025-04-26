// src/components/UI/ThemeToggle.jsx
import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = ({ darkMode, toggleTheme }) => {
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      <div className={`toggle-track ${darkMode ? 'dark' : 'light'}`}>
        <div className="toggle-thumb"></div>
        <div className="toggle-icon">
          {darkMode ? <FaMoon /> : <FaSun />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;