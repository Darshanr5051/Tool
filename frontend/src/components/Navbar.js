import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiLogOut, FiSearch, FiX } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = ({ onToggleSidebar, onGlobalSearch }) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');

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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          disabled={!onGlobalSearch}
        />
        {query ? (
          <button type="button" className="nav-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <FiX />
          </button>
        ) : null}
      </form>
      <div className="nav-right">
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