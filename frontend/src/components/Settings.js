import React, { useEffect, useMemo, useState } from 'react';
import { FiMoon, FiSun, FiSidebar, FiLogOut, FiUser, FiInfo, FiSettings } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import './Settings.css';

const Settings = ({ sidebarCollapsed, onSetSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const savedPrefs = useMemo(() => {
    const defaultTab = localStorage.getItem('siqol_default_tab') || 'overview';
    const reducedMotion = localStorage.getItem('siqol_rm') === 'true';
    const invStatus = localStorage.getItem('siqol_inv_status') || '';
    const invCategory = localStorage.getItem('siqol_inv_category') || '';
    const density = localStorage.getItem('siqol_density') || 'comfortable';
    const rowsPerPageRaw = Number(localStorage.getItem('siqol_rows_per_page'));
    const rowsPerPage = Number.isFinite(rowsPerPageRaw) && rowsPerPageRaw > 0 ? rowsPerPageRaw : 10;
    return {
      theme,
      sidebarCollapsed,
      reducedMotion,
      defaultTab,
      invStatus,
      invCategory,
      density,
      rowsPerPage,
    };
  }, [sidebarCollapsed, theme]);

  const [draft, setDraft] = useState(savedPrefs);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setDraft(savedPrefs);
  }, [savedPrefs]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedPrefs);
  }, [draft, savedPrefs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduced-motion', draft.reducedMotion ? 'true' : 'false');
  }, [draft.reducedMotion]);

  const openConfirm = (cfg) => setConfirm(cfg);
  const closeConfirm = () => setConfirm(null);

  const applySave = () => {
    setTheme(draft.theme);
    onSetSidebarCollapsed(draft.sidebarCollapsed);
    localStorage.setItem('siqol_rm', String(draft.reducedMotion));
    localStorage.setItem('siqol_default_tab', draft.defaultTab);
    localStorage.setItem('siqol_inv_status', draft.invStatus);
    localStorage.setItem('siqol_inv_category', draft.invCategory);
    localStorage.setItem('siqol_density', draft.density);
    localStorage.setItem('siqol_rows_per_page', String(draft.rowsPerPage));
    toast.success('Changes saved');
  };

  const discardChanges = () => {
    setDraft(savedPrefs);
  };

  return (
    <div className="settings">
      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.confirmText}
        cancelText={confirm?.cancelText}
        tone={confirm?.tone}
        onCancel={() => {
          closeConfirm();
          confirm?.onCancel?.();
        }}
        onConfirm={() => {
          closeConfirm();
          confirm?.onConfirm?.();
        }}
      />

      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-desc">Personalize your dashboard experience</p>
        </div>
      </div>

      {hasChanges ? (
        <div className="savebar" role="status" aria-label="Unsaved changes">
          <div className="savebar-left">
            <span className="savebar-dot" />
            <span className="savebar-text">You have unsaved changes</span>
          </div>
          <div className="savebar-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => openConfirm({
                title: 'Discard changes?',
                message: 'This will revert settings to the last saved values.',
                confirmText: 'Discard',
                cancelText: 'Cancel',
                tone: 'default',
                onConfirm: discardChanges,
              })}
            >
              Discard
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => openConfirm({
                title: 'Save changes?',
                message: 'Apply and save the updated settings.',
                confirmText: 'Save',
                cancelText: 'Cancel',
                tone: 'default',
                onConfirm: applySave,
              })}
            >
              Save
            </button>
          </div>
        </div>
      ) : null}

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-head">
            <h3 className="settings-card-title">Appearance</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-left">
                <div className="setting-icon">{isDark ? <FiMoon /> : <FiSun />}</div>
                <div>
                  <div className="setting-title">Theme</div>
                  <div className="setting-desc">Choose light or dark mode</div>
                </div>
              </div>
              <div className="setting-right">
                <div className="segmented" role="group" aria-label="Theme">
                  <button
                    className={`seg-btn ${draft.theme === 'light' ? 'active' : ''}`}
                    onClick={() => setDraft((d) => ({ ...d, theme: 'light' }))}
                    type="button"
                  >
                    Light
                  </button>
                  <button
                    className={`seg-btn ${draft.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setDraft((d) => ({ ...d, theme: 'dark' }))}
                    type="button"
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>



            <div className="setting-row">
              <div className="setting-left">
                <div className="setting-icon">A</div>
                <div>
                  <div className="setting-title">Reduced Motion</div>
                  <div className="setting-desc">Minimize animations for accessibility</div>
                </div>
              </div>
              <div className="setting-right">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={draft.reducedMotion}
                    onChange={(e) => setDraft((d) => ({ ...d, reducedMotion: e.target.checked }))}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-left">
                <div className="setting-icon"><FiSettings /></div>
                <div>
                  <div className="setting-title">Default Landing Tab</div>
                  <div className="setting-desc">Where you land after login</div>
                </div>
              </div>
              <div className="setting-right">
                <select
                  className="select"
                  value={draft.defaultTab}
                  onChange={(e) => setDraft((d) => ({ ...d, defaultTab: e.target.value }))}
                >
                  <option value="overview">Overview</option>
                  <option value="inventory">Inventory</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <h3 className="settings-card-title">Inventory Defaults</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-left">
                <div>
                  <div className="setting-title">Default Status Filter</div>
                  <div className="setting-desc">Applied when you open Inventory</div>
                </div>
              </div>
              <div className="setting-right">
                <select
                  className="select"
                  value={draft.invStatus}
                  onChange={(e) => setDraft((d) => ({ ...d, invStatus: e.target.value }))}
                >
                  <option value="">None</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                  <option value="In Storage">In Storage</option>
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-left">
                <div>
                  <div className="setting-title">Default Category Filter</div>
                  <div className="setting-desc">Leave empty to show all categories</div>
                </div>
              </div>
              <div className="setting-right">
                <input
                  className="input"
                  value={draft.invCategory}
                  onChange={(e) => setDraft((d) => ({ ...d, invCategory: e.target.value }))}
                  placeholder="e.g. Laptop"
                />
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-left">
                <div>
                  <div className="setting-title">Table Density</div>
                  <div className="setting-desc">Adjust table spacing</div>
                </div>
              </div>
              <div className="setting-right">
                <div className="segmented" role="group" aria-label="Density">
                  <button
                    className={`seg-btn ${draft.density === 'comfortable' ? 'active' : ''}`}
                    onClick={() => setDraft((d) => ({ ...d, density: 'comfortable' }))}
                    type="button"
                  >
                    Comfortable
                  </button>
                  <button
                    className={`seg-btn ${draft.density === 'compact' ? 'active' : ''}`}
                    onClick={() => setDraft((d) => ({ ...d, density: 'compact' }))}
                    type="button"
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-left">
                <div>
                  <div className="setting-title">Rows Per Page</div>
                  <div className="setting-desc">Pagination size in Inventory table</div>
                </div>
              </div>
              <div className="setting-right">
                <select
                  className="select"
                  value={draft.rowsPerPage}
                  onChange={(e) => setDraft((d) => ({ ...d, rowsPerPage: Number(e.target.value) }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <h3 className="settings-card-title">Account</h3>
          </div>
          <div className="settings-card-body">
            <div className="profile">
              <div className="profile-left">
                <div className="profile-avatar"><FiUser /></div>
                <div className="profile-meta">
                  <div className="profile-name">{user?.username || 'User'}</div>
                  <div className="profile-sub">{user?.role || ''}</div>
                </div>
              </div>
              <div className="profile-actions">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => openConfirm({
                    title: 'Logout?',
                    message: 'You will need to login again to access the dashboard.',
                    confirmText: 'Logout',
                    cancelText: 'Cancel',
                    tone: 'danger',
                    onConfirm: () => {
                      logout();
                      toast.success('Logged out');
                    },
                  })}
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <h3 className="settings-card-title">Tips & About</h3>
          </div>
          <div className="settings-card-body">
            <div className="tips">
              <div className="tip">
                <div className="tip-icon"><FiInfo /></div>
                <div>
                  <div className="tip-title">Shortcuts</div>
                  <div className="tip-desc">Use `g` + `o/i/s` to navigate. Press `/` to focus search. Admin: `n` to add asset.</div>
                </div>
              </div>
              <div className="tip">
                <div className="tip-icon"><FiInfo /></div>
                <div>
                  <div className="tip-title">Data Source</div>
                  <div className="tip-desc">API URL can be overridden in local storage key `API_URL`.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card danger">
          <div className="settings-card-head">
            <h3 className="settings-card-title">Danger Zone</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row danger">
              <div className="setting-left">
                <div>
                  <div className="setting-title">Reset Preferences</div>
                  <div className="setting-desc">Restore theme and UI preferences to default</div>
                </div>
              </div>
              <div className="setting-right">
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => openConfirm({
                    title: 'Reset preferences?',
                    message: 'This will clear saved preferences and revert to defaults.',
                    confirmText: 'Reset',
                    cancelText: 'Cancel',
                    tone: 'danger',
                    onConfirm: () => {
                      localStorage.removeItem('siqol_theme');
                      localStorage.removeItem('siqol_sb');
                      localStorage.removeItem('siqol_rm');
                      localStorage.removeItem('siqol_default_tab');
                      localStorage.removeItem('siqol_inv_status');
                      localStorage.removeItem('siqol_inv_category');
                      localStorage.removeItem('siqol_density');
                      localStorage.removeItem('siqol_rows_per_page');
                      setTheme('light');
                      onSetSidebarCollapsed(false);
                      document.documentElement.setAttribute('data-reduced-motion', 'false');
                      setDraft((d) => ({
                        ...d,
                        theme: 'light',
                        sidebarCollapsed: false,
                        reducedMotion: false,
                        defaultTab: 'overview',
                        invStatus: '',
                        invCategory: '',
                        density: 'comfortable',
                        rowsPerPage: 10,
                      }));
                      toast.success('Preferences reset');
                    },
                  })}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
