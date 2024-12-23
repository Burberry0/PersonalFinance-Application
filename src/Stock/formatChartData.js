// path/to/your/formatChartData.js
export const formatChartData = (data, timeKey) => {
    // Check if data is available
    if (!data || data.length === 0) {
        return { labels: [], datasets: [] };
    }

    // Prepare labels and data for the chart
    const labels = data.map(item => item[timeKey]); // Extract labels based on timeKey
    const prices = data.map(item => item.close); // Assuming 'close' is the price you want to plot

    // Prepare datasets for the chart
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Stock Price',
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)', // Change color as needed
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Change background color as needed
                borderWidth: 1,
                fill: true,
            },
        ],
    };

    return chartData;
};
