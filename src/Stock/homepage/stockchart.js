import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "./stock.css";

const StockChart = ({ selectedTicker }) => {
    const [selectedData, setSelectedData] = useState([]);
    const [error, setError] = useState(null);

    const apiKey = "kC74_4DfXFLGKckadfssEHwBQ5_YQ_QV"; // Replace with your actual API key if needed

    const fetchChartData = async (startDate, endDate, period) => {
        try {
            setError(null);
            const ticker = selectedTicker?.symbol;
            if (!ticker) {
                setError("No Ticker");
                return;
            }

            const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/${period}/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=${apiKey}`;
            const response = await fetch(url);
            const result = await response.json();

            if (response.ok && result.results?.length > 0) {
                setSelectedData(result.results);
            } else {
                setSelectedData([]);
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
            setSelectedData([]);
            setError("Error fetching data.");
        }
    };

    const calculateDateRange = (period) => {
        const today = new Date();
        let startDate;
        let periodUnit;

        switch (period) {
            case "1D":
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                periodUnit = "minute";
                break;
            case "5D":
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 5);
                periodUnit = "day";
                break;
            case "1M":
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 1);
                periodUnit = "day";
                break;
            case "3M":
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
                periodUnit = "day";
                break;
            case "6M":
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 6);
                periodUnit = "month";
                break;
            case "1Y":
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                periodUnit = "month";
                break;
            default:
                startDate = new Date(today);
                periodUnit = "day";
        }

        const endDate = today.toISOString().split("T")[0];
        const startISODate = startDate.toISOString().split("T")[0];
        return { startDate: startISODate, endDate, periodUnit };
    };

    useEffect(() => {
        if (selectedTicker) {
            const { startDate, endDate, periodUnit } = calculateDateRange("1Y");
            fetchChartData(startDate, endDate, periodUnit);
        }
    }, [selectedTicker]);

    const handleTimeChange = (period) => {
        const { startDate, endDate, periodUnit } = calculateDateRange(period);
        fetchChartData(startDate, endDate, periodUnit);
    };

    const chartData = {
        labels: selectedData.map(item => new Date(item.t).toLocaleDateString()),
        datasets: [
            {
                label: "Stock Price",
                data: selectedData.map(item => item.c),
                fill: false,
                backgroundColor: "rgba(75, 192, 192, 1)",
                borderColor: "rgba(75, 192, 192, 1)",
            },
        ],
    };

    return (

        <div className="grouped-container">
            <div className="buttons">
                <div className="time-buttons">
                    <button className="time-button" onClick={() => handleTimeChange("1D")}>1D</button>
                    <button className="time-button" onClick={() => handleTimeChange("3D")}>5D</button>
                    <button className="time-button" onClick={() => handleTimeChange("1M")}>1M</button>
                    <button className="time-button" onClick={() => handleTimeChange("3M")}>3M</button>
                    <button className="time-button" onClick={() => handleTimeChange("6M")}>6M</button>
                    <button className="time-button" onClick={() => handleTimeChange("1Y")}>1Y</button>
                </div>
            </div>
            
            
            
            
            <div className="graph-container">
                <div className="chart">
                    {error && <p>{error}</p>}
                    {selectedData.length > 0 ? (
                    <Line data={chartData} />
                        ) : (
                        !error && <p>No data available for the selected time period.</p>
                     )}
                </div>
            </div>



        </div>

        

        
        
    );
};

export default StockChart;
