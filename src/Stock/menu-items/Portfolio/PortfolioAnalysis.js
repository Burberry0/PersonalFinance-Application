import React from 'react';

const PortfolioAnalysis = ({ portfolio }) => {
  const calculatePortfolioMetrics = () => {
    let totalValue = 0;
    let initialValue = 0;
    let weights = [];
    let rois = [];

    portfolio.forEach((stock) => {
      const { quantity, average_price, current_price } = stock;
      const stockValue = quantity * current_price;
      const stockInitialValue = quantity * average_price;

      totalValue += stockValue;
      initialValue += stockInitialValue;

      // ROI for each stock
      const roi = ((current_price - average_price) / average_price) * 100;
      rois.push({ ticker: stock.ticker, roi });

      // Weight for each stock
      weights.push({ ticker: stock.ticker, weight: stockValue });
    });

    // Normalize weights
    weights = weights.map((w) => ({ ...w, weight: w.weight / totalValue }));

    const growthPercentage = ((totalValue - initialValue) / initialValue) * 100;

    return { totalValue, growthPercentage, weights, rois };
  };

  const metrics = portfolio.length > 0 ? calculatePortfolioMetrics() : {};

  return (
    <div className="portfolio-analysis">
      {portfolio.length === 0 ? (
        <p>No stocks in portfolio to analyze.</p>
      ) : (
        <>
          <p>Total Portfolio Value: ${metrics.totalValue?.toFixed(2)}</p>
          <p>Portfolio Growth: {metrics.growthPercentage?.toFixed(2)}%</p>
          {metrics.rois && metrics.rois.length > 0 && (
            <>
              <p>
                Best Performer: {metrics.rois.sort((a, b) => b.roi - a.roi)[0]?.ticker}{' '}
                ({metrics.rois.sort((a, b) => b.roi - a.roi)[0]?.roi.toFixed(2)}%)
              </p>
              <p>
                Worst Performer: {metrics.rois.sort((a, b) => a.roi - b.roi)[0]?.ticker}{' '}
                ({metrics.rois.sort((a, b) => a.roi - b.roi)[0]?.roi.toFixed(2)}%)
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PortfolioAnalysis;
