import React, { useState, useEffect, useContext, useCallback } from 'react';
import { PortfolioContext } from './context/PortfolioContext';
import './Metrics.css';

export default function PortfolioMetrics() {
  const { portfolio } = useContext(PortfolioContext);
  const currentUserId = sessionStorage.getItem('user_id');
  const [metrics, setMetrics] = useState([]);

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/${currentUserId}/portfolio/analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error fetching metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchMetrics();
    }
  }, [fetchMetrics, currentUserId]);

  return (
    <div className="table-container">
      <div className="column">
        <h3 className="table-title">Best Performing Stock</h3>
        <table className="port-table">
          <thead>
            <tr>
              <th>Best Performing Stock</th>
              <th>Performance over the past year</th>
              <th>Current Price</th>
              <th>Average Price</th>
              <th>Quantity</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{metrics.best_performing?.ticker || 'N/A'}</td>
              <td className="highlight">
                {metrics.best_performing ? `${metrics.best_performing.performance}%` : 'N/A'}
              </td>
              <td>{metrics.best_performing?.current_price || 'N/A'}</td>
              <td>{metrics.best_performing?.average_price?.toFixed(2) || 'N/A'}</td>
              <td>{metrics.best_performing?.quantity || 'N/A'}</td>
              <td>{metrics.best_performing?.value?.toFixed(2) || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="column">
        <h3 className="table-title">Least Performing Stock</h3>
        <table className="port-table">
          <thead>
            <tr>
              <th>Least Performing Stock</th>
              <th>Performance over the past year</th>
              <th>Current Price</th>
              <th>Average Price</th>
              <th>Quantity</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{metrics.least_performing?.ticker || 'N/A'}</td>
              <td className="lowHighlight">
                {metrics.least_performing ? `${metrics.least_performing.performance}%` : 'N/A'}
              </td>
              <td>{metrics.least_performing?.current_price || 'N/A'}</td>
              <td>{metrics.least_performing?.average_price?.toFixed(2) || 'N/A'}</td>
              <td>{metrics.least_performing?.quantity || 'N/A'}</td>
              <td>{metrics.least_performing?.value?.toFixed(2) || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
