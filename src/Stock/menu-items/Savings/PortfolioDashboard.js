import React, { useState, useEffect } from 'react';

function PortfolioMenu({ onHighWeight }) {
  const [PortList, setPortList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const GetPortfolioValues = async () => {
      try {
        setLoading(true);

        const cachedPortfolio = localStorage.getItem("portfolioData");
        if (cachedPortfolio) {
          const data = JSON.parse(cachedPortfolio);
          setPortList(data);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/4/portfolio`);
        if (!response.ok) throw new Error("Failed to fetch portfolio");
        const data = await response.json();

        localStorage.setItem("portfolioData", JSON.stringify(data.stocks || []));
        setPortList(Array.isArray(data.stocks) ? data.stocks : []);
      } catch (err) {
        setError("Error fetching portfolio data");
        console.error("Error fetching portfolio data:", err);
      } finally {
        setLoading(false);
      }
    };

    GetPortfolioValues();
  }, []);

  useEffect(() => {
    if (PortList.length > 0) {
      const totalValue = PortList.reduce((sum, stock) => sum + stock.quantity * stock.average_price, 0);
      const calculatedWeights = PortList.map(stock => {
        const stockValue = stock.quantity * stock.average_price;
        const weight = ((stockValue / totalValue) * 100).toFixed(2);
        return { ...stock, weight: parseFloat(weight) };
      });

      const highWeightStocks = calculatedWeights.filter(stock => stock.weight > 20);
      if (highWeightStocks.length > 0 && onHighWeight) {
        onHighWeight(highWeightStocks);
      }
    }
  }, [PortList, onHighWeight]);

  useEffect(() => {
    if (PortList.length > 0) {
      // Performance data calculation, if needed later
      // This could be memoized if it becomes expensive
      const performanceData = PortList.map(stock => {
        const currentPrice = stock.currentPrice;
        const purchasePrice = stock.average_price;
        const performance = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        return { ...stock, performance: performance.toFixed(2) };
      });

      const highest = performanceData.reduce((prev, curr) =>
        (parseFloat(prev.performance) > parseFloat(curr.performance) ? prev : curr), performanceData[0]);

      const lowest = performanceData.reduce((prev, curr) =>
        (parseFloat(prev.performance) < parseFloat(curr.performance) ? prev : curr), performanceData[0]);

      // If needed, you can pass these up or store them locally
      // Currently, not being returned or displayed
    }
  }, [PortList]);

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return null; // This component doesn't display anything by itself, just runs logic
}

export default React.memo(PortfolioMenu);
