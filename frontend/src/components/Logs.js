import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiFileText, FiClock, FiUser, FiActivity } from 'react-icons/fi';
import './Logs.css';

const API_URL = 'http://localhost:5000/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-3d">LOADING LOGS...</div>;
  }

  return (
    <div className="logs-container-3d">
      <div className="logs-header-3d">
        <FiFileText className="logs-icon" />
        <div>
          <h2>System Logs</h2>
          <p>Audit trail of all administrative and user actions</p>
        </div>
      </div>

      <div className="logs-list">
        {logs.length === 0 ? (
          <div className="empty-state-3d">
            <FiFileText size={36} />
            <p>NO LOGS FOUND</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-action-icon">
                <FiActivity />
              </div>
              <div className="log-content">
                <div className="log-title">
                  <span className="log-action">{log.action}</span>
                  <span className="log-time"><FiClock /> {new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="log-desc">{log.details}</div>
                <div className="log-user">
                  <FiUser /> {log.user}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Logs;
