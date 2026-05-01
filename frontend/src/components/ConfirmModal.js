import React, { useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import './ConfirmModal.css';

const ConfirmModal = ({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Save',
  cancelText = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="cm-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onCancel}>
      <div className={`cm-modal ${tone}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="cm-head">
          <div className="cm-title">
            <span className={`cm-icon ${tone}`}><FiAlertTriangle /></span>
            <div>
              <div className="cm-title-text">{title}</div>
              {message ? <div className="cm-sub">{message}</div> : null}
            </div>
          </div>
          <button className="cm-close" type="button" onClick={onCancel} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="cm-actions">
          <button className="btn btn-outline" type="button" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} type="button" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
