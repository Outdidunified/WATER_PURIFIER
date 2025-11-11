import React, { useState, useEffect } from 'react';
import './UpdateDeliveryStatusModal.css';

const DELIVERY_STATUSES = ['pending', 'accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

const DELIVERY_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  packed: 'Packed',
  intransit: 'In Transit',
  outfordelivery: 'Out for Delivery',
  completed: 'Completed',
};

const UpdateDeliveryStatusModal = ({ isOpen, orderId, currentStatus, onClose, onUpdate, onRefresh }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate next valid status
  const getNextStatus = () => {
    const currentIndex = DELIVERY_STATUSES.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= DELIVERY_STATUSES.length - 1) {
      return null; // No next status available
    }
    return DELIVERY_STATUSES[currentIndex + 1];
  };

  const nextStatus = getNextStatus();

  const handleOpen = () => {
    // Auto-set to next status
    setSelectedStatus(nextStatus || '');
    setNotes('');
    setError('');
  };

  // Call handleOpen when modal opens or currentStatus changes
  useEffect(() => {
    if (isOpen) {
      handleOpen();
    }
  }, [isOpen, currentStatus, nextStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStatus) {
      setError('Please select a delivery status');
      return;
    }

    if (selectedStatus === currentStatus) {
      setError('Please select a different status than current');
      return;
    }

    if (!orderId) {
      setError('Order ID is missing. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Get token from sessionStorage (where it's stored during login)
      const token = sessionStorage.getItem('superAdminToken');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('Updating delivery status for order:', orderId);
      
      const response = await fetch(
        `/api/api/website/orders/${orderId}/update-delivery-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            newStatus: selectedStatus,
            notes: notes || `Updated from ${currentStatus} to ${selectedStatus}`
          })
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to update delivery status';
        try {
          const data = await response.json();
          errorMessage = data.message || data.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Update successful:', data);
      console.log('Updated Order ID:', data.order?._id);
      
      // Manually add the new status entry to the delivery history
      const updatedOrder = { ...data.order };
      if (!updatedOrder.deliveryHistory) {
        updatedOrder.deliveryHistory = [];
      }

      // Add new status entry to history
      const newEntry = {
        status: selectedStatus,
        timestamp: new Date().toISOString(),
        note: notes || `Updated from ${currentStatus} to ${selectedStatus}`,
        updatedBy: 'System'
      };

      updatedOrder.deliveryHistory = [...updatedOrder.deliveryHistory, newEntry];
      console.log('Added new status to delivery history:', newEntry);

      // Update timestamps for key statuses
      if (selectedStatus === 'accepted') {
        updatedOrder.deliveryAcceptanceTimestamp = newEntry.timestamp;
      } else if (selectedStatus === 'completed') {
        updatedOrder.deliveryCompletionTimestamp = newEntry.timestamp;
      }
      
      // Show success message
      setSuccess('✅ Delivery status updated successfully!');
      setError('');
      
      // Call the update callback and wait for it to complete (includes refresh)
      if (onUpdate) {
        try {
          console.log('Calling onUpdate with updated order:', updatedOrder);
          await onUpdate(updatedOrder);
          console.log('onUpdate completed, delivery details should be refreshed');
        } catch (updateError) {
          console.warn('Update callback completed with error:', updateError);
        }
      } else if (onRefresh) {
        // Fallback: if only onRefresh is provided, call it
        try {
          await onRefresh();
        } catch (refreshError) {
          console.warn('Failed to refresh delivery details:', refreshError);
        }
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError(err.message || 'An error occurred. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setNotes('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Delivery Status</h5>
            <button type="button" className="close" onClick={handleClose}>
              <span>&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="currentStatus" className="font-weight-bold">
                  Current Status
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="currentStatus"
                  value={DELIVERY_STATUS_LABELS[currentStatus] || currentStatus || '-'}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="newStatus" className="font-weight-bold">
                  New Status <span className="text-danger">*</span>
                </label>
                {nextStatus ? (
                  <>
                    <select
                      className="form-control"
                      id="newStatus"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={isLoading || success}
                    >
                      <option value="">-- Select Status --</option>
                      <option value={nextStatus}>
                        {DELIVERY_STATUS_LABELS[nextStatus]}
                      </option>
                    </select>
                    <small className="form-text text-muted mt-2">
                      📋 Next step: {DELIVERY_STATUS_LABELS[nextStatus]}
                    </small>
                  </>
                ) : (
                  <div className="alert alert-info" role="alert">
                    ✅ Delivery is complete! No further status updates available.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="font-weight-bold">
                  Notes (Optional)
                </label>
                <textarea
                  className="form-control"
                  id="notes"
                  rows="3"
                  placeholder="Add any notes about this status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading || success}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={isLoading || success}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm mr-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Updating...
                    </>
                  ) : success ? (
                    '✅ Updated!'
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateDeliveryStatusModal;