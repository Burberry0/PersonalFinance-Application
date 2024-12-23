import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './portfolio.css';
import { PortfolioContext } from './context/PortfolioContext';
import { useTicker } from '../../globalcontext/TickerContext';
import PortfolioMetrics from './PortfolioMetrics';

export default function Portfolio() {
  const { portfolio } = useContext(PortfolioContext);
  const currentUserId = sessionStorage.getItem('user_id');
  const [portfolioGrowth, setPortfolioGrowth] = useState(null);
  const [growthHistory, setGrowthHistory] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null); 
  const [isModalOpen, setModalOpen] = useState(false);
  const [setSelectedTicker, selectedTicker] = useState(null);



  const [wallet, setWallet] = useState({
    purchasing_power: 0,
    holding_value: 0,
    total_value: 0,
  });

  // Fetch Growth History
  const fetchGrowthHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/${currentUserId}/portfolio/growth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio growth history');
      }
      const data = await response.json();
      setGrowthHistory(data.growth_history || []);
    } catch (error) {
      console.error('Error fetching growth history:', error);
    }
  }, [currentUserId]);

  // Fetch Wallet
  const fetchWallet = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/${currentUserId}/wallet`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      const data = await response.json();
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  }, [currentUserId]);

  // Log Portfolio (POST)
  const logPortfolio = useCallback(async () => {
    if (!portfolioData) return; // Only log if we have data
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/${currentUserId}/portfolio/log`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentUserId, portfolio_data: portfolioData }),
      });
      if (!response.ok) {
        throw new Error('Failed to log portfolio');
      }
      console.log('Daily log created');
    } catch (error) {
      console.error('Error logging the portfolio value:', error);
    }
  }, [currentUserId, portfolioData]);

  // Update Portfolio Log (PUT)
  const updatePortfolioLog = useCallback(async () => {
    if (!portfolioData) return; // Only update if we have data
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/updatePortfolioLog`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentUserId, portfolio_data: portfolioData }),
      });
      if (!response.ok) {
        throw new Error('Failed to update portfolio log');
      }
      console.log('Portfolio log updated for today.');
    } catch (error) {
      console.error('Error updating portfolio log:', error);
    }
  }, [currentUserId, portfolioData]);

  useEffect(() => {
    fetchGrowthHistory();
  }, [fetchGrowthHistory]);


  useEffect(() => {
    // Attempt to log portfolio daily
    // Set interval for every 24 hours (86400000 ms)
    if (portfolioData) {
      logPortfolio();
      const dailyInterval = setInterval(() => {
        logPortfolio();
      }, 86400000);
      return () => clearInterval(dailyInterval);
    }
  }, [logPortfolio, portfolioData]);

  useEffect(() => {
    // Update portfolio log whenever portfolioData changes
    updatePortfolioLog();
  }, [updatePortfolioLog]);

  const handlePortfolioChange = (newData) => {
    setPortfolioData(newData);
  };

  const calculateGrowth = useCallback(() => {
    let totalInitialValue = 0;
    let totalCurrentValue = 0;

    portfolio.forEach((stock) => {
      const { quantity, average_price: purchasePrice, current_price: currentPrice } = stock;
      if (purchasePrice && currentPrice) {
        const initialValue = quantity * purchasePrice;
        const currentValue = quantity * currentPrice;
        totalInitialValue += initialValue;
        totalCurrentValue += currentValue;
      }
    });

    if (totalInitialValue > 0) {
      const growthPercentage = ((totalCurrentValue - totalInitialValue) / totalInitialValue) * 100;
      setPortfolioGrowth(growthPercentage.toFixed(2));
    } else {
      setPortfolioGrowth(null);
    }
  }, [portfolio]);

  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      calculateGrowth();
    }
  }, [portfolio, calculateGrowth]);

  const calculateTotalPrice = () => {
    return portfolio.reduce((total, item) => total + item.quantity * item.current_price, 0);
  };

  // Prepare chart data
  const chartLabels = growthHistory.map(entry => new Date(entry.date).toLocaleDateString());
  const chartData = growthHistory.map(entry => entry.value);
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Portfolio Value Over Time',
        data: chartData,
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Portfolio Value (USD)' }, beginAtZero: false },
    },
  };

  return (
    <div className="Portfolio-Container">
      {(!portfolio || portfolio.length === 0) ? (
        <p>No stocks in portfolio.</p>
      ) : (
        <>
          <div className="grid-container">
            <div className="portfolio-summary-container">
              <div className="portfolio-summary">
                <h3>Portfolio Overview</h3>
                <div className='summary-row'>
                <p>
                  <span className="summary-label">Total Portfolio Value: </span>
                  <span className="summary-value">${calculateTotalPrice().toFixed(2)}</span>
                </p>
                <p>
                  <span className="summary-label">Total Portfolio Growth: </span>
                  <span className="summary-value">{portfolioGrowth}%</span>
                </p>
                </div>
              </div>
            </div>

            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Quantity</th>
                    <th>Average Price</th>
                    <th>Current Price</th>
                    <th>Total</th>
                    <th>Growth (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item, index) => {
                    const growth = ((item.current_price - item.average_price) / item.average_price) * 100;
                    return (
                      <tr key={index}>
                        <td>{item.ticker}</td>
                        <td>{item.quantity}</td>
                        <td>${item.average_price.toFixed(2)}</td>
                        <td>${item.current_price.toFixed(2)}</td>
                        <td>${(item.quantity * item.current_price).toFixed(2)}</td>
                        <td>{growth.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table">
            <PortfolioMetrics />
          </div>
        </>
      )}

      <div style={{ width: '100%', height: 400 }}>
        {growthHistory && growthHistory.length > 0 ? (
          <Line data={data} options={chartOptions} />
        ) : (
          <p>No growth history available to display the chart.</p>
        )}
      </div>
    </div>
  );
}
