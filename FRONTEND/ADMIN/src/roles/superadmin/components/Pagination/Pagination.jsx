import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  pageSize, 
  onPageChange, 
  onPageSizeChange,
  totalRecords 
}) => {
  const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination-container">
      <div className="pagination-left">
        <span className="records-info">
          Showing {startRecord} to {endRecord} of {totalRecords} records
        </span>
      </div>

      <div className="pagination-middle">
        <button 
          className="btn-pagination"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous"
        >
          &lt;
        </button>

        <div className="page-numbers">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage > totalPages - 3) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button 
          className="btn-pagination"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next"
        >
          &gt;
        </button>
      </div>

      <div className="pagination-right">
        <label htmlFor="page-size-select">Items per page:</label>
        <select 
          id="page-size-select"
          className="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
