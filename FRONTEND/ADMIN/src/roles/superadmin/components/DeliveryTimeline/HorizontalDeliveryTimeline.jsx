import React from 'react';
import classNames from 'classnames';
import { formatTimestamp } from '../../../../utils/formatTimestamp';
import './HorizontalDeliveryTimeline.css';

const DELIVERY_STATUS_LABELS = {
  accepted: 'Accepted',
  packed: 'Packed',
  intransit: 'In Transit',
  outfordelivery: 'Out for Delivery',
  completed: 'Completed',
};

const DELIVERY_STATUS_ORDER = ['accepted', 'packed', 'intransit', 'outfordelivery', 'completed'];

const HorizontalDeliveryTimeline = ({ 
  timeline = [], 
  currentDeliveryStatus = '', 
  isLoading = false, 
  error = null 
}) => {
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  const hasTimelineData = timeline.some((item) => item.updates?.length > 0 || item.isReached);

  return (
    <div className="horizontal-timeline-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Delivery Progress</h5>
        {isLoading && <span className="badge badge-info">Loading...</span>}
      </div>

      {hasTimelineData && (
        <div className="horizontal-timeline">
          <div className="timeline-track">
            <div className="timeline-line" />
            
            <div className="timeline-items">
              {timeline.map((item, index) => {
                const isCompleted = DELIVERY_STATUS_ORDER.indexOf(item.status) < DELIVERY_STATUS_ORDER.indexOf(currentDeliveryStatus);
                const isCurrentStep = item.status === currentDeliveryStatus;
                
                return (
                  <div
                    key={item.status}
                    className={classNames('timeline-step', {
                      'timeline-step--completed': isCompleted,
                      'timeline-step--active': isCurrentStep,
                      'timeline-step--pending': !isCompleted && !isCurrentStep,
                    })}
                  >
                    <div className="step-marker">
                      <div className="marker-circle">
                        {isCompleted && <span className="icon-check"></span>}
                        {isCurrentStep && <span className="icon-clock"></span>}
                      </div>
                    </div>

                    <div className="step-content">
                      <h6 className="step-label">{item.label}</h6>
                      
                      <p className="step-status text-muted">
                        {item.timestamp
                          ? formatTimestamp(item.timestamp)
                          : isCompleted
                            ? 'Completed'
                            : 'Pending'
                        }
                      </p>

                      {item.latestUpdate?.note && (
                        <p className="step-note">{item.latestUpdate.note}</p>
                      )}

                      {item.updates?.length > 1 && (
                        <small className="text-muted">
                          {item.updates.length} update{item.updates.length > 1 ? 's' : ''}
                        </small>
                      )}
                    </div>

                    {index < timeline.length - 1 && (
                      <div className={classNames('step-connector', {
                        'step-connector--completed': isCompleted || isCurrentStep,
                      })} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalDeliveryTimeline;