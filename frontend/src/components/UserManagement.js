import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiUsers, FiPlus, FiTrash2, FiShield, FiUser, FiX, FiSave,
  FiMail, FiSearch, FiEdit2, FiEye, FiEyeOff,
  FiUserCheck
} from 'react-icons/fi';
import { SkeletonUserTable, SkeletonCard } from './Skeleton';
import { useAuth } from '../context/AuthContext';
import './UserManagement.css';

const API_URL = 'https://siqol-backend.onrender.com/api';

/* ── Helpers ── */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
};

const AVATAR_COLORS = [
  ['#556df7', 'rgba(85,109,247,0.15)'],
  ['#a855f7', 'rgba(168,85,247,0.15)'],
  ['#22c55e', 'rgba(34,197,94,0.15)'],
  ['#f97316', 'rgba(249,115,22,0.15)'],
  ['#06b6d4', 'rgba(6,182,212,0.15)'],
  ['#ec4899', 'rgba(236,72,153,0.15)'],
];

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* Animated counter hook */
const useCountUp = (target, duration = 800) => {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = Date.now();
    const startVal = count;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]); // eslint-disable-line
  return count;
};

const AnimatedStat = ({ value }) => {
  const display = useCountUp(value);
  return <>{display}</>;
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [togglingRoleId, setTogglingRoleId] = useState(null);

  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', email: '', role: 'user'
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/users`);
      setUsers(res.data);
    } catch (err) { toast.error('Error loading users'); }
    finally { setLoading(false); }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
  };

  const copyText = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      toast.success(`${label} copied`);
    } catch (err) {
      toast.error('Copy failed');
    }
  };

  // Password strength calculator
  useEffect(() => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    setPasswordStrength(Math.min(strength, 5));
  }, [formData.password]);

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: case 1: return { text: 'Very Weak', color: '#ef4444' };
      case 2: return { text: 'Weak', color: '#f97316' };
      case 3: return { text: 'Fair', color: '#eab308' };
      case 4: return { text: 'Good', color: '#22c55e' };
      case 5: return { text: 'Strong', color: '#16a34a' };
      default: return { text: '', color: 'transparent' };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const allowed = new Set(filteredUsers.map((u) => u.id));
      const next = new Set(Array.from(prev).filter((id) => allowed.has(id)));
      return next;
    });
  }, [searchTerm, roleFilter, users]);

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        password: '',
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'user'
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '', password: '', fullName: '', email: '', role: 'user'
      });
    }
    setShowPassword(false);
    setPasswordStrength(0);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName) {
      toast.error('Required fields missing');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await axios.put(`${API_URL}/auth/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await axios.post(`${API_URL}/auth/users`, formData);
        toast.success('User access granted');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Revoke user access?')) return;
    // Trigger exit animation
    setDeletingId(id);
    await new Promise(r => setTimeout(r, 380));
    try {
      await axios.delete(`${API_URL}/auth/users/${id}`);
      toast.success('Access revoked');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleToggle = async (user) => {
    if (togglingRoleId) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? 'Administrator' : 'Operator';
    setTogglingRoleId(user.id);
    try {
      await axios.put(`${API_URL}/auth/users/${user.id}`, { role: newRole });
      toast.success(`${user.fullName} → ${label}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role update failed');
    } finally {
      setTogglingRoleId(null);
    }
  };

  const toggleSelectAll = () => {
    if (filteredUsers.length === 0) return;
    const visibleIds = filteredUsers.map((u) => u.id);
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(visibleIds);
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Revoke access for ${selectedIds.size} user${selectedIds.size > 1 ? 's' : ''}?`)) return;
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(ids.map((id) => axios.delete(`${API_URL}/auth/users/${id}`)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failResults = results.filter((r) => r.status === 'rejected');

      if (successCount > 0) toast.success(`${successCount} user${successCount > 1 ? 's' : ''} revoked`);

      if (failResults.length > 0) {
        const msg = failResults[0]?.reason?.response?.data?.message
          || failResults[0]?.reason?.message
          || 'Bulk revoke failed';
        toast.error(`${failResults.length} failed: ${msg}`);
      }

      setSelectedIds(new Set());
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk revoke failed');
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (!newRole || selectedIds.size === 0) return;
    if (!window.confirm(`Change role for ${selectedIds.size} user${selectedIds.size > 1 ? 's' : ''} to ${newRole === 'admin' ? 'Administrator' : 'Operator'}?`)) return;
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(ids.map((id) => axios.put(`${API_URL}/auth/users/${id}`, { role: newRole })));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failResults = results.filter((r) => r.status === 'rejected');

      if (successCount > 0) toast.success(`${successCount} updated`);
      if (failResults.length > 0) {
        const msg = failResults[0]?.reason?.response?.data?.message
          || failResults[0]?.reason?.message
          || 'Bulk update failed';
        toast.error(`${failResults.length} failed: ${msg}`);
      }

      setSelectedIds(new Set());
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk update failed');
    }
  };

  // Stats calculations
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    operators: users.filter(u => u.role === 'user').length,
  };

  if (loading) {
    return (
      <div className="um-container-3d">
        <div className="um-header-3d">
          <div className="um-header-left">
            <div className="um-header-icon">
              <FiUsers />
            </div>
            <div>
              <h2 className="um-title-3d">ACCESS CONTROL</h2>
              <p className="um-subtitle-3d">Manage system users and permissions</p>
            </div>
          </div>
        </div>
        <SkeletonUserTable rows={6} />
      </div>
    );
  }

  return (
    <div className="um-container-3d">
      {/* Header */}
      <div className="um-header-3d">
        <div className="um-header-left">
          <div className="um-header-icon">
            <FiUsers />
          </div>
          <div>
            <h2 className="um-title-3d">ACCESS CONTROL</h2>
            <p className="um-subtitle-3d">Manage system users and permissions</p>
          </div>
        </div>
        <button className="um-add-btn-3d" onClick={() => openModal()}>
          <FiPlus /> <span>GRANT ACCESS</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="um-stats-grid">
        <div className="um-stat-card">
          <div className="um-stat-top">
            <span className="um-stat-label">Total Users</span>
            <div className="um-stat-icon-box total"><FiUsers /></div>
          </div>
          <div className="um-stat-value" style={{ color: '#3b82f6' }}><AnimatedStat value={stats.total} /></div>
        </div>
        <div className="um-stat-card">
          <div className="um-stat-top">
            <span className="um-stat-label">Administrators</span>
            <div className="um-stat-icon-box admin"><FiShield /></div>
          </div>
          <div className="um-stat-value" style={{ color: '#ef4444' }}><AnimatedStat value={stats.admins} /></div>
        </div>
        <div className="um-stat-card">
          <div className="um-stat-top">
            <span className="um-stat-label">Operators</span>
            <div className="um-stat-icon-box operator"><FiUserCheck /></div>
          </div>
          <div className="um-stat-value" style={{ color: '#22c55e' }}><AnimatedStat value={stats.operators} /></div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="um-filters-3d">
        <div className="um-search-3d">
          <FiSearch className="um-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-search-input"
          />
          {searchTerm && (
            <button className="um-search-clear" onClick={() => setSearchTerm('')}>
              <FiX />
            </button>
          )}
        </div>
        <div className="um-filter-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="um-filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Operators</option>
          </select>
        </div>
        {(searchTerm || roleFilter) && (
          <button type="button" className="um-clear-filters" onClick={clearFilters}>
            <FiX /> Clear
          </button>
        )}
      </div>

      {(searchTerm || roleFilter) && (
        <div className="um-active-filters">
          {searchTerm && (
            <button type="button" className="um-filter-chip" onClick={() => setSearchTerm('')} title="Remove search filter">
              Search: {searchTerm} <FiX />
            </button>
          )}
          {roleFilter && (
            <button type="button" className="um-filter-chip" onClick={() => setRoleFilter('')} title="Remove role filter">
              Role: {roleFilter === 'admin' ? 'Administrator' : 'Operator'} <FiX />
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="um-results-info">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {selectedIds.size > 0 && (
        <div className="um-bulk-bar">
          <span className="um-bulk-count">{selectedIds.size} selected</span>
          <div className="um-bulk-actions">
            <button type="button" className="um-bulk-btn danger" onClick={handleBulkDelete}>
              <FiTrash2 /> Revoke
            </button>
            <select
              className="um-bulk-select"
              value=""
              onChange={(e) => {
                if (e.target.value) handleBulkRoleChange(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Change Role...</option>
              <option value="user">Operator</option>
              <option value="admin">Administrator</option>
            </select>
            <button type="button" className="um-bulk-btn" onClick={() => setSelectedIds(new Set())}>
              <FiX /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="um-cards-mobile">
        {filteredUsers.length === 0 ? (
          <div className="um-empty-state um-empty-state-mobile">
            <FiUsers size={48} />
            <p>NO USERS FOUND</p>
            <span>Adjust search or filter criteria</span>
            {(searchTerm || roleFilter) && (
              <button type="button" className="um-empty-cta" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelf = currentUser?.id === user.id || currentUser?.username === user.username;
            const isDeleting = deletingId === user.id;
            const [avatarColor, avatarBg] = getAvatarColor(user.fullName);
            return (
              <div
                key={user.id}
                className={`um-card ${selectedIds.has(user.id) ? 'selected' : ''} ${isDeleting ? 'um-row-exit' : ''}`}
              >
                <div className="um-card-top">
                  <label className="um-check">
                    <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} />
                  </label>
                  <div className="um-user-cell">
                    <div
                      className="um-avatar um-avatar-initials"
                      style={{ background: avatarBg, color: avatarColor, border: `1.5px solid ${avatarColor}44` }}
                    >
                      {getInitials(user.fullName)}
                    </div>
                    <div className="um-card-names">
                      <div className="um-user-name">
                        {user.fullName}
                        {isSelf && <span className="um-you-badge">YOU</span>}
                      </div>
                      <button type="button" className="um-copy-pill" onClick={() => copyText(user.username, 'Username')} title="Copy username">
                        {user.username}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`um-badge um-badge-toggle ${user.role === 'admin' ? 'admin' : 'operator'} ${togglingRoleId === user.id ? 'toggling' : ''}`}
                    onClick={() => handleRoleToggle(user)}
                    title="Click to toggle role"
                    disabled={!!togglingRoleId}
                  >
                    <span className="um-badge-dot"></span>
                    {togglingRoleId === user.id ? '…' : (user.role === 'admin' ? 'Admin' : 'Operator')}
                  </button>
                </div>

                <div className="um-card-mid">
                  <button type="button" className="um-copy-row" onClick={() => copyText(user.email, 'Email')} title="Copy email">
                    <FiMail size={14} /> <span>{user.email || '—'}</span>
                  </button>
                </div>

                <div className="um-card-actions">
                  <button className="um-action-btn edit" onClick={() => openModal(user)} title="Edit User"><FiEdit2 /></button>
                  <button
                    className="um-action-btn delete"
                    onClick={() => handleDelete(user.id)}
                    title={isSelf ? 'Cannot revoke own access' : 'Revoke Access'}
                    disabled={isSelf}
                    style={isSelf ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                  ><FiTrash2 /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table */}
      <div className="um-table-wrapper">
        <div className="um-table-glow-top"></div>
        <table className="um-table-3d">
          <thead>
            <tr>
              <th className="um-check-th">
                <input
                  type="checkbox"
                  className="um-check-input"
                  checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id))}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th>OPERATOR</th>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>CLEARANCE</th>

              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="um-empty-state">
                    <FiUsers size={48} />
                    <p>NO USERS FOUND</p>
                    <span>Adjust search or filter criteria</span>
                    {(searchTerm || roleFilter) && (
                      <button type="button" className="um-empty-cta" onClick={clearFilters}>Clear filters</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => {
                const isSelf = currentUser?.id === user.id || currentUser?.username === user.username;
                const isDeleting = deletingId === user.id;
                const [avatarColor, avatarBg] = getAvatarColor(user.fullName);
                return (
                  <tr
                    key={user.id}
                    className={`um-table-row ${selectedIds.has(user.id) ? 'selected' : ''} ${isDeleting ? 'um-row-exit' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <td className="um-check-td">
                      <input
                        type="checkbox"
                        className="um-check-input"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.fullName}`}
                      />
                    </td>
                    <td>
                      <div className="um-user-cell">
                        <div
                          className="um-avatar um-avatar-initials"
                          style={{ background: avatarBg, color: avatarColor, border: `1.5px solid ${avatarColor}44` }}
                        >
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <div className="um-user-name">
                            {user.fullName}
                            {isSelf && <span className="um-you-badge">YOU</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="um-username-tag um-copy"
                        onClick={() => copyText(user.username, 'Username')}
                        title="Copy username"
                      >
                        {user.username}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="um-email-cell um-copy"
                        onClick={() => copyText(user.email, 'Email')}
                        title={user.email ? 'Copy email' : ''}
                        disabled={!user.email}
                      >
                        <FiMail size={14} /> {user.email || '—'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`um-badge um-badge-toggle ${user.role === 'admin' ? 'admin' : 'operator'} ${togglingRoleId === user.id ? 'toggling' : ''}`}
                        onClick={() => handleRoleToggle(user)}
                        title="Click to toggle role"
                        disabled={!!togglingRoleId}
                      >
                        <span className="um-badge-dot"></span>
                        {togglingRoleId === user.id ? '…' : (user.role === 'admin' ? 'Admin' : 'Operator')}
                      </button>
                    </td>
                    <td>
                      <div className="um-actions">
                        <button
                          className="um-action-btn edit"
                          onClick={() => openModal(user)}
                          title="Edit User"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="um-action-btn delete"
                          onClick={() => handleDelete(user.id)}
                          title={isSelf ? 'Cannot revoke own access' : 'Revoke Access'}
                          disabled={isSelf}
                          style={isSelf ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <div className="um-modal-title-group">
                <div className="um-modal-icon">
                  {editingUser ? <FiEdit2 /> : <FiPlus />}
                </div>
                <div>
                  <h3>{editingUser ? 'EDIT USER' : 'GRANT USER ACCESS'}</h3>
                  <span className="um-modal-sub">
                    {editingUser ? 'Update user details and permissions' : 'Register new system operator'}
                  </span>
                </div>
              </div>
              <button className="um-modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="um-modal-form">
              <div className="um-form-grid">
                <div className="um-field">
                  <label>FULL NAME *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div className="um-field">
                  <label>USERNAME *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="e.g., john@siqol.com"
                    disabled={!!editingUser}
                  />
                </div>
                <div className="um-field">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., john@siqol.com"
                  />
                </div>
                {!editingUser && (
                  <div className="um-field">
                    <label>PASSWORD *</label>
                    <div className="um-password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        className="um-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="um-strength-meter">
                        <div className="um-strength-bars">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className="um-strength-bar"
                              style={{
                                background: level <= passwordStrength ? getStrengthLabel().color : 'var(--bg-2)',
                                transition: 'background 0.3s ease'
                              }}
                            />
                          ))}
                        </div>
                        <span className="um-strength-text" style={{ color: getStrengthLabel().color }}>
                          {getStrengthLabel().text}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {editingUser && (
                  <div className="um-field">
                    <label>NEW PASSWORD</label>
                    <div className="um-password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        className="um-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="um-strength-meter">
                        <div className="um-strength-bars">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className="um-strength-bar"
                              style={{
                                background: level <= passwordStrength ? getStrengthLabel().color : 'var(--bg-2)',
                              }}
                            />
                          ))}
                        </div>
                        <span className="um-strength-text" style={{ color: getStrengthLabel().color }}>
                          {getStrengthLabel().text}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="um-field">
                  <label>CLEARANCE LEVEL</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="um-role-select"
                  >
                    <option value="user">Operator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="um-modal-actions">
                <button type="button" className="um-cancel-btn" onClick={() => setShowModal(false)}>
                  CANCEL
                </button>
                <button type="submit" className="um-save-btn">
                  <FiSave /> {editingUser ? 'UPDATE' : 'AUTHORIZE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
