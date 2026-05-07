import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const getThemeDetails = () => {
    switch (theme) {
      case 'light': return { icon: <FiSun />, title: 'Classic Light' };
      case 'dark': return { icon: <FiMoon />, title: 'Classic Dark' };
      case 'midnight': return { icon: <FiMoon style={{ color: '#38bdf8' }} />, title: 'Midnight Blue' };
      case 'cyberpunk': return { icon: <FiMoon style={{ color: '#f0abfc' }} />, title: 'Cyberpunk Neon' };
      default: return { icon: <FiSun />, title: 'Theme' };
    }
  };

  const { icon, title } = getThemeDetails();

  return (
    <button className="theme-btn" onClick={toggleTheme} title={`Current: ${title} (Click to change)`}>
      {icon}
    </button>
  );
};

export default ThemeToggle;