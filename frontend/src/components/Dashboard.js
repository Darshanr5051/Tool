import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import InventoryTable from './InventoryTable';
import UploadExcel from './UploadExcel';
import UserManagement from './UserManagement';
import Settings from './Settings';
import Requests from './Requests';
import Logs from './Logs';
import { SkeletonCard, SkeletonPanel } from './Skeleton';
import { FiAlertTriangle, FiCheckCircle, FiDownload, FiMonitor, FiPlus, FiXCircle, FiActivity, FiClock, FiSearch, FiCommand } from 'react-icons/fi';
import './Dashboard.css';

const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

const AnimatedNumber = ({ value }) => {
  const count = useCountUp(value);
  return <>{count}</>;
};

const API_URL = 'https://siqol-backend.onrender.com/api';

const AnimatedPie = ({ title, stats }) => {
  const entries = Object.entries(stats?.categories || {});
  const total = stats?.totalAssets || 0;
  const size = 120;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#a855f7'];

  let offset = 0;
  const slices = entries.map(([k, v], idx) => {
    const pct = total ? v / total : 0;
    const dash = pct * circumference;
    const stroke = palette[idx % palette.length];
    const slice = (
      <circle
        key={k}
        className="pie-slice"
        cx={cx}
        cy={cy}
        r={r}
        fill="transparent"
        stroke={stroke}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="round"
      />
    );
    offset += dash;
    return slice;
  });

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3 className="chart-title">{title}</h3>
      </div>
      <div className="chart-body">
        {entries.length === 0 ? (
          <div className="empty-text">No data</div>
        ) : (
          <div className="pie-layout">
            <div className="pie-wrap">
              <svg className="pie-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="var(--bg-2)" strokeWidth="10" />
                {slices}
              </svg>
            </div>
            <div className="pie-legend">
              {entries.slice(0, 6).map(([k, v], idx) => (
                <div key={k} className="legend-item" style={{ opacity: 1, transform: 'none' }}>
                  <span className="legend-swatch" style={{ background: palette[idx % palette.length] }} />
                  <span className="legend-label">{k}</span>
                  <span className="legend-value">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('siqol_default_tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('siqol_sb') === 'true');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  const exportFilteredRef = useRef(null);
  const [invPreset, setInvPreset] = useState({ search: '', status: '', category: '', addId: 0 });

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/inventory/stats`),
        axios.get(`${API_URL}/logs`)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.slice(0, 5)); // Keep only 5 recent logs for the dashboard
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openInventory = useCallback(({ search = '', status = '', category = '', addId = 0 } = {}) => {
    setInvPreset({ search, status, category, addId });
    setActiveTab('inventory');
  }, []);

  const handleGlobalSearch = useCallback((q) => {
    openInventory({ search: q });
  }, [openInventory]);

  const handleQuickAdd = useCallback(() => {
    openInventory({ addId: Date.now() });
  }, [openInventory]);

  const handleExport = useCallback(async () => {
    if (activeTab === 'inventory' && exportFilteredRef.current) {
      exportFilteredRef.current();
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/inventory/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SIQOL_Hardware_Inventory.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Export failed');
    }
  }, [activeTab]);

  const setSidebarCollapsedPref = useCallback((v) => {
    setSidebarCollapsed(v);
    localStorage.setItem('siqol_sb', v ? 'true' : 'false');
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsedPref(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsedPref]);

  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const t = e.target;
      const active = document.activeElement;
      const isInput = (el) => {
        if (!el) return false;
        const tag = String(el.tagName).toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable || (typeof el.closest === 'function' && el.closest('input, textarea, select, [contenteditable="true"]'));
      };
      const isTypingTarget = isInput(t) || isInput(active);
      if (isTypingTarget) return;

      if (e.key === 'Escape') {
        if (commandOpen) setCommandOpen(false);
        else if (sidebarOpen) setSidebarOpen(false);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }

      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        toast.info('Shortcuts: Ctrl+K palette, / search, n new asset, g+o/i/u navigate', { autoClose: 6000 });
      }

      if (e.key === 'n') {
        e.preventDefault();
        handleQuickAdd();
      }

      if (e.key === 'g') {
        let navKey = null;
        const navHandler = (ev) => {
          if (navKey) return;
          navKey = ev.key;
          if (navKey === 'o') { setActiveTab('overview'); toast.info('Navigated to Overview'); }
          else if (navKey === 'i') { openInventory({}); toast.info('Navigated to Inventory'); }
          else if (navKey === 'u' && isAdmin()) { setActiveTab('users'); toast.info('Navigated to Users'); }
          else if (navKey === 's') { setActiveTab('settings'); toast.info('Navigated to Settings'); }
          else if (navKey === 'h') {
            toast.info('Shortcuts: / search, n new asset, g+o/i/u navigate, h help', { autoClose: 5000 });
          }
          window.removeEventListener('keydown', navHandler);
        };
        window.addEventListener('keydown', navHandler, { once: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleQuickAdd, isAdmin, openInventory, sidebarOpen]);

  const statCards = useMemo(() => {
    const total = stats?.totalAssets ?? 0;
    const active = stats?.activeAssets ?? 0;
    const maint = stats?.maintenanceAssets ?? 0;
    const retired = stats?.retiredAssets ?? 0;
    return [
      { label: 'Total Assets', value: total, icon: FiMonitor, color: 'accent', onClick: () => openInventory({}) },
      { label: 'Active', value: active, icon: FiCheckCircle, color: 'success', onClick: () => openInventory({ status: 'Active' }) },
      { label: 'Maintenance', value: maint, icon: FiAlertTriangle, color: 'warning', onClick: () => openInventory({ status: 'Maintenance' }) },
      { label: 'Retired', value: retired, icon: FiXCircle, color: 'danger', onClick: () => openInventory({ status: 'Retired' }) },
    ];
  }, [openInventory, stats]);

  const overviewAnimate = true;

  const renderOverview = () => (
    <div className="overview">
      <div className="page-header">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="page-desc">Hardware asset summary</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleQuickAdd}>
            <FiPlus /> {isAdmin() ? 'Add Asset' : 'Request Asset'}
          </button>
          <button className="btn btn-outline" onClick={() => openInventory({})}>
            <FiMonitor /> Inventory
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {loadingStats ? (
        <>
          <div className="stat-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="charts-grid">
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        </>
      ) : (
        <>
          <div className="stat-grid">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="stat-card clickable"
                  role="button"
                  tabIndex={0}
                  onClick={s.onClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') s.onClick();
                  }}
                >
                  <div className="stat-top">
                    <span className="stat-label">{s.label}</span>
                    <div className={`stat-icon-box ${s.color}`}><Icon /></div>
                  </div>
                  <div className="stat-value"><AnimatedNumber value={s.value} /></div>
                </div>
              );
            })}
          </div>

          <div className="charts-grid">
            <AnimatedPie title="Asset Distribution by Category" stats={stats} />

            <div className={`panel ${overviewAnimate ? 'is-animate' : ''}`}>
              <div className="panel-head">
                <h3 className="panel-title">Departments</h3>
              </div>
              <div className="panel-body">
                {stats?.departments && Object.entries(stats.departments).length > 0 ? (
                  Object.entries(stats.departments)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([dep, count]) => {
                      const pct = stats.totalAssets ? Math.round((count / stats.totalAssets) * 100) : 0;
                      return (
                        <div key={dep} className="bar-item">
                          <div className="bar-item-top">
                            <span className="bar-item-label">{dep}</span>
                            <span className="bar-item-value">{count}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill info" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="empty-text">No data</p>
                )}
              </div>
            </div>

            <div className={`panel timeline-panel ${overviewAnimate ? 'is-animate' : ''}`}>
              <div className="panel-head">
                <h3 className="panel-title">Recent Activity</h3>
              </div>
              <div className="panel-body">
                {logs.length > 0 ? (
                  <div className="activity-timeline">
                    {logs.map((log) => (
                      <div key={log.id} className="timeline-item">
                        <div className="timeline-icon"><FiActivity /></div>
                        <div className="timeline-content">
                          <div className="timeline-title">{log.action}</div>
                          <div className="timeline-desc">{log.details}</div>
                          <div className="timeline-meta">
                            <FiClock /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {log.user}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No recent activity</p>
                )}
                <button className="btn btn-outline full-width" onClick={() => setActiveTab('logs')} style={{ marginTop: '14px' }}>
                  View All Logs
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'inventory':
        return (
          <InventoryTable
            onUpdate={fetchStats}
            presetSearchTerm={invPreset.search}
            presetStatusFilter={invPreset.status}
            presetCategoryFilter={invPreset.category}
            openAddId={invPreset.addId}
            onExportFiltered={(exportFn) => { exportFilteredRef.current = exportFn; }}
          />
        );
      case 'upload':
        return isAdmin() ? <UploadExcel onUploadSuccess={fetchStats} /> : null;
      case 'users':
        return isAdmin() ? <UserManagement /> : null;
      case 'requests':
        return isAdmin() ? <Requests /> : null;
      case 'logs':
        return isAdmin() ? <Logs /> : null;
      case 'settings':
        return (
          <Settings
            sidebarCollapsed={sidebarCollapsed}
            onSetSidebarCollapsed={setSidebarCollapsedPref}
          />
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className={`main ${sidebarCollapsed ? 'sb-collapsed' : ''}`}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onGlobalSearch={handleGlobalSearch} />
        <div className="content">{renderContent()}</div>
      </div>

      {/* Command Palette Overlay */}
      {commandOpen && (
        <div className="command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <div className="command-header">
              <FiSearch className="command-icon" />
              <input 
                autoFocus 
                placeholder="Search actions, assets, or navigation..." 
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
              />
              <div className="command-badge">ESC</div>
            </div>
            <div className="command-body">
              <div className="command-section">Quick Navigation</div>
              <div className="command-item" onClick={() => { setActiveTab('overview'); setCommandOpen(false); }}>
                <FiMonitor /> Go to Dashboard
              </div>
              <div className="command-item" onClick={() => { openInventory({}); setCommandOpen(false); }}>
                <FiCommand /> View Inventory
              </div>
              {isAdmin() && (
                <div className="command-item" onClick={() => { setActiveTab('users'); setCommandOpen(false); }}>
                  <FiCommand /> Manage Users
                </div>
              )}
              <div className="command-section">Actions</div>
              <div className="command-item" onClick={() => { handleQuickAdd(); setCommandOpen(false); }}>
                <FiPlus /> Add New Asset
              </div>
              <div className="command-item" onClick={() => { handleExport(); setCommandOpen(false); }}>
                <FiDownload /> Export Data
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;