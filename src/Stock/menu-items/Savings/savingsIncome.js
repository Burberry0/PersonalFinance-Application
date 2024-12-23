import { Line } from 'react-chartjs-2';

const SavingsVsIncomeChart = ({ totalIncome, current_savings, years_to_retirement }) => {
    const annualReturnRate = 0.07;
    const monthlyReturnRate = annualReturnRate / 12;

    const incomeProjection = Array.from({ length: years_to_retirement }, (_, i) => totalIncome * (i + 1));
    const savingsProjection = Array.from({ length: years_to_retirement }, (_, i) => {
        const months = (i + 1) * 12;
        const futureSavings = current_savings * (1 + monthlyReturnRate) ** months;
        return futureSavings;
    });

    const chartData = {
        labels: Array.from({ length: years_to_retirement }, (_, i) => `Year ${i + 1}`),
        datasets: [
            {
                label: 'Projected Income',
                data: incomeProjection,
                borderColor: '#4CAF50',
                fill: false,
            },
            {
                label: 'Projected Savings',
                data: savingsProjection,
                borderColor: '#FF9800',
                fill: false,
            },
        ],
    };

    return (
        <div className="chart-container">
            <h3>Savings Over Time vs. Income</h3>
            <Line data={chartData} />
        </div>
    );
};

// FinancialDashboard.js
return (
    <div className="financial-dashboard">
        <h2>Financial Dashboard</h2>
        <div className="cash-flow-summary">
            <h3>{cashFlowMessage}</h3>
        </div>

        {/* Financial Health Score Display */}
        <div className="financial-health-score">
            <h3>Financial Health Score: {financialHealth.score}</h3>
            <p>{financialHealth.advice}</p>
        </div>

        <div className="dashboard-section">
            <Spending onUpdateFinances={handleUpdateFinances} />
        </div>
        <div className="dashboard-section">
            <SavingsPlanDashboard totalExpenses={totalExpenses} totalIncome={totalIncome} />
        </div>

        {/* Savings vs. Income Chart */}
        <SavingsVsIncomeChart totalIncome={totalIncome} current_savings={current_savings} years_to_retirement={years_to_retirement} />
    </div>
);
