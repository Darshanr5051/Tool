import React from 'react';
import './Skeleton.css';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-row">
      <div className="skeleton-text skeleton-text-sm"></div>
      <div className="skeleton-icon"></div>
    </div>
    <div className="skeleton-text skeleton-text-lg"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 8 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="skeleton-th"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="skeleton-td"></div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonPanel = ({ title = true, rows = 4 }) => (
  <div className="skeleton-panel">
    {title && <div className="skeleton-panel-header"><div className="skeleton-text skeleton-text-md"></div></div>}
    <div className="skeleton-panel-body">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-bar-item">
          <div className="skeleton-row">
            <div className="skeleton-text"></div>
            <div className="skeleton-text skeleton-text-sm"></div>
          </div>
          <div className="skeleton-bar-track"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonUserTable = ({ rows = 5 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      <div className="skeleton-th"></div>
      <div className="skeleton-th"></div>
      <div className="skeleton-th"></div>
      <div className="skeleton-th"></div>
      <div className="skeleton-th"></div>
      <div className="skeleton-th"></div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        <div className="skeleton-td skeleton-td-lg"></div>
        <div className="skeleton-td"></div>
        <div className="skeleton-td"></div>
        <div className="skeleton-td"></div>
        <div className="skeleton-td"></div>
        <div className="skeleton-td"></div>
      </div>
    ))}
  </div>
);
