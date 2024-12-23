import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';

export function ExpensesIncomeChart({ isYearly, formattedMonth, totals }) {
  const { expense = 0, income = 0, investment = 0 } = totals; 

  const chartData = useMemo(() => ({
    labels: ['Expenses', 'Income', 'Investments'],
    datasets: [{
      label: 'Amount',
      data: [expense, income, investment],
      backgroundColor: ['#ffcc99', '#ff9999', '#66b3ff'],
      hoverOffset: 4,
    }]
  }), [expense, income, investment]);

  return (
    <div className="ChartItem graph-1">
      <h2>{isYearly ? "Yearly Income vs Expenses" : `Income vs Expenses for ${formattedMonth}`}</h2>
      <Pie data={chartData} />
    </div>
  );
}
