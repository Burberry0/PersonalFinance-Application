import React, { createContext, useState, useEffect } from 'react';

// Create the context


export const PortfolioContext = createContext();

// Create the provider component
export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPort] = useState([]);

  // Fetch portfolio from the backend on load
  const fetchPortfolio = async () => {
    const token = localStorage.getItem('token');
    const currentUserId = sessionStorage.getItem('user_id');
    try {
      const response = await fetch(`http://localhost:8000/${currentUserId}/portfolio`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPort(data.stocks || []); // Ensure data.stocks is an array
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Fetch the portfolio on initial render
  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Sync portfolio changes to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  return (
    <PortfolioContext.Provider value={{ portfolio, setPort, fetchPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
};
