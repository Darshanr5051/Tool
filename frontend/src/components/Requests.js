import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiClipboard, FiClock } from 'react-icons/fi';
import './Requests.css';

const API_URL = 'https://dash-tool-hw.netlify.app';

const Requests = () => {
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
          <h2>Asset Requests</h2>
          <p>Manage asset addition requests from non-admin users</p>
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
                <h4>{req.itemData.deviceName || 'Unknown Device'}</h4>
                <div className="req-meta">
                  <span><strong>Requested by:</strong> {req.user}</span>
                  <span><FiClock /> {new Date(req.createdAt).toLocaleString()}</span>
                  <span><strong>Status:</strong> <span className={`req-status-badge ${req.status.toLowerCase()}`}>{req.status}</span></span>
                </div>
                <div className="req-details">
                  <p><strong>Category:</strong> {req.itemData.category || 'N/A'}</p>
                  <p><strong>Asset Tag:</strong> {req.itemData.assetTag || 'N/A'}</p>
                  <p><strong>Notes:</strong> {req.itemData.notes || 'N/A'}</p>
                </div>
              </div>
              {req.status === 'Pending' && (
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
