import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiMonitor, FiUsers, FiX,
  FiChevronLeft, FiChevronRight, FiSettings, FiClipboard, FiFileText
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { isAdmin } = useAuth();
  const [logoOk, setLogoOk] = useState(true);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'inventory', label: 'Inventory', icon: FiMonitor },
    { id: 'requests', label: 'Requests', icon: FiClipboard, adminOnly: true },
    { id: 'logs', label: 'Logs', icon: FiFileText, adminOnly: true },
    { id: 'users', label: 'Users', icon: FiUsers, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  const handleClick = (id) => {
    setActiveTab(id);
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo">
            {logoOk ? (
              <img
                className="sb-logo-img"
                src={`${process.env.PUBLIC_URL}/logo.png`}
                alt="Logo"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="sb-logo-mark">S</div>
            )}
            {!isCollapsed && !logoOk && <span className="sb-logo-text">SIQOL</span>}
          </div>
          <button className="sb-mobile-close" onClick={onClose}><FiX /></button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin()) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sb-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleClick(item.id)}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="sb-nav-icon" />
                <span className="sb-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="sb-footer">
          <button className="sb-collapse-btn" onClick={onToggleCollapse}>
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;