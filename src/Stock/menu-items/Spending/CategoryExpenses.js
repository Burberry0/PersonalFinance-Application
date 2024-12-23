import React, { useRef, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { useMonthContext } from '../../globalcontext/MonthContext';

export default function CategoryExpensesChart({ categorizedData, isYearly }) {
  const chartRef = useRef();
  const { formattedMonth } = useMonthContext();

  const categoryLabels = useMemo(() => Object.keys(categorizedData), [categorizedData]);
  const categoryValues = useMemo(() => Object.values(categorizedData), [categorizedData]);

  const data = useMemo(() => ({
    labels: categoryLabels,
    datasets: [{
      label: 'Amount',
      data: categoryValues,
      backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#cc99ff', '#ff66cc'],
      hoverOffset: 4,
    }],
  }), [categoryLabels, categoryValues]);

  const options = useMemo(() => ({
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${categoryLabels[tooltipItem.dataIndex]}: $${tooltipItem.raw}`,
        },
      },
    },
    onClick: (event) => {
      if (!chartRef.current) return;
      const chart = chartRef.current;
      const elements = chart.getElementsAtEventForMode(event.native, 'nearest', { intersect: true }, false);
      if (elements.length > 0) {
        const clickedElementIndex = elements[0].index;
        const clickedCategory = categoryLabels[clickedElementIndex];
        console.log("Clicked category:", clickedCategory);
      }
    },
  }), [categoryLabels]);

  return (
    <div className="ChartItem graph-2">
      <h2>{isYearly ? 'Yearly Category Breakdown' : 'Monthly Category Breakdown'}</h2>
      <Pie ref={chartRef} data={data} options={options} />
    </div>
  );
}
