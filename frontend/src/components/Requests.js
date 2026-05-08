import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiX, FiClipboard, FiClock, FiUser, FiTag, FiFolder, FiMessageSquare } from 'react-icons/fi';
import './Requests.css';

const API_URL = 'https://siqol-backend.onrender.com/api';

const Requests = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/requests`);
      setRequests(res.data.reverse()); // Newest first
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    try {
      await axios.put(`${API_URL}/requests/${id}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error('Failed to process request');
    }
  };

  if (loading) {
    return <div className="loading-3d">LOADING REQUESTS...</div>;
  }

  return (
    <div className="requests-container-3d">
      <div className="req-header-3d">
        <FiClipboard className="req-icon" />
        <div>
          <h2>{isAdmin() ? 'Asset Requests' : 'My Asset Requests'}</h2>
          <p>{isAdmin() ? 'Manage asset addition requests from non-admin users' : 'Track the status of your asset requests'}</p>
        </div>
      </div>

      <div className="req-list">
        {requests.length === 0 ? (
          <div className="empty-state-3d">
            <FiClipboard size={36} />
            <p>NO PENDING REQUESTS</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className={`req-card ${req.status.toLowerCase()}`}>
              <div className="req-info">
                <div className="req-card-header">
                  <div className="req-title-wrapper">
                    <div className="req-avatar">
                      {req.user ? req.user.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="req-device-name">{req.itemData.deviceName || 'Unknown Device'}</h4>
                      <div className="req-requester">{req.user}</div>
                    </div>
                  </div>
                  <div className={`req-status-pill ${req.status.toLowerCase()}`}>
                    <span className="status-dot"></span>
                    {req.status}
                  </div>
                </div>

                <div className="req-meta-top">
                  <span className="req-time"><FiClock /> {new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>

                <div className="req-details-grid">
                  <div className="detail-item">
                    <div className="detail-label"><FiFolder /> Category</div>
                    <div className="detail-value">{req.itemData.category || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label"><FiTag /> Asset Tag</div>
                    <div className="detail-value">{req.itemData.assetTag || 'N/A'}</div>
                  </div>
                  <div className="detail-item notes-item">
                    <div className="detail-label"><FiMessageSquare /> Notes</div>
                    <div className="detail-value">{req.itemData.notes || 'N/A'}</div>
                  </div>
                </div>
              </div>
              {req.status === 'Pending' && isAdmin() && (
                <div className="req-actions">
                  <button className="btn-approve" onClick={() => handleAction(req.id, 'Approved')}>
                    <FiCheck /> Approve
                  </button>
                  <button className="btn-reject" onClick={() => handleAction(req.id, 'Rejected')}>
                    <FiX /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Requests;
