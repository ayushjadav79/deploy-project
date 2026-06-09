import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmClass = 'btn-confirm-danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    // Backdrop: role="presentation" + keyboard listener to close on Escape/Enter
    <div
      className="modal-backdrop"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onCancel(); }}
      role="presentation"
    >
      {/* Dialog box: stops click/keyboard propagation so clicks inside don't close the modal */}
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-icon">
          <AlertTriangle size={28} />
        </div>
        <h2 id="modal-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-modal btn-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className={`btn-modal ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  confirmClass: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmModal;
