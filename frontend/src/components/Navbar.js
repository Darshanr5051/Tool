import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiLogOut, FiSearch, FiX, FiBell } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const API_URL = 'https://siqol-backend.onrender.com/api';

const Navbar = ({ onToggleSidebar, onGlobalSearch, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Search Suggestions State
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`${API_URL}/inventory`);
        const unique = [...new Set(res.data.flatMap(i => [i.deviceName, i.assetTag]).filter(Boolean))];
        setSearchSuggestions(unique);
      } catch (err) {}
    };
    fetchSuggestions();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_URL}/requests`);
        if (isAdmin && isAdmin()) {
          const pending = res.data.filter(r => r.status === 'Pending').reverse();
          setNotifications(pending);
        } else {
          const resolved = res.data.filter(r => r.status === 'Approved' || r.status === 'Rejected').reverse();
          setNotifications(resolved);
        }
      } catch (err) {
        // silently fail for background poll
      }
    };

    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Handle clicking outside the notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (onGlobalSearch) onGlobalSearch(q);
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="nav-menu-btn" onClick={onToggleSidebar}><FiMenu /></button>
        <span className="nav-title">Hardware Inventory</span>
      </div>
      <form className="nav-search" onSubmit={submit} role="search" aria-label="Global search">
        <FiSearch className="nav-search-ico" />
        <input
          className="nav-search-input"
          type="text"
          value={query}
          list="global-search-suggestions"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          disabled={!onGlobalSearch}
        />
        <datalist id="global-search-suggestions">
          {searchSuggestions.map(s => <option key={s} value={s} />)}
        </datalist>
        {query ? (
          <button type="button" className="nav-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <FiX />
          </button>
        ) : null}
      </form>
      <div className="nav-right">
          <div className="nav-notifications" ref={notifRef}>
            <button 
              className="nav-bell-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <FiBell />
              {notifications.length > 0 && (
                <span className="notif-badge">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <h4>{isAdmin && isAdmin() ? 'Pending Requests' : 'Request Updates'}</h4>
                  <span className="notif-count">{notifications.length} New</span>
                </div>
                <div className="notif-body">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No new notifications</div>
                  ) : (
                    notifications.slice(0, 5).map(req => (
                      <div 
                        key={req.id} 
                        className="notif-item"
                        onClick={() => {
                          setShowNotifications(false);
                          if(onNavigate) onNavigate('requests');
                        }}
                      >
                        <div className="notif-avatar">
                          {req.user ? req.user.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="notif-content">
                          <div className="notif-title">
                            {isAdmin && isAdmin() ? (
                              <><strong>{req.user}</strong> requested {req.itemData.deviceName || 'a device'}</>
                            ) : (
                              <>Your request for <strong>{req.itemData.deviceName || 'a device'}</strong> was {req.status}</>
                            )}
                          </div>
                          <div className="notif-time">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="notif-footer" onClick={() => { setShowNotifications(false); if(onNavigate) onNavigate('requests'); }}>
                    View all requests
                  </div>
                )}
              </div>
            )}
          </div>

        <ThemeToggle />
        <div className="nav-user">
          <div className="nav-avatar">{(user?.fullName || 'U')[0]}</div>
          <div className="nav-user-info">
            <span className="nav-user-name">{user?.fullName || user?.username}</span>
            <span className="nav-user-role">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
          </div>
        </div>
        <button className="nav-logout" onClick={logout} title="Sign out"><FiLogOut /></button>
      </div>
    </nav>
  );
};

export default Navbar;