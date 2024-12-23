import React, { useState, useEffect } from 'react';
import Spending from '../Spending/spending'; // Relative path from the current directory
import SavingsPlanDashboard from './SavingsDash.js'; // Relative path from the current directory
import { Line } from 'react-chartjs-2';
import './FinancialDashboard.css';
import { useAuth } from '../../../Login/AuthProvider';
import ExpenseHistogram from './MonthlyExpenses';
import { useTotals } from '/Users/brandonkohler/react-ec/app/src/Stock/globalcontext/TotalContext'; // Use the totals context

const FinancialDashboard = () => {
    const [currentSavings, setCurrentSavings] = useState(10000); // Assume an initial value for current savings
    const [yearsToRetirement, setYearsToRetirement] = useState(30); // Assume a default retirement plan of 30 years

    const token = useAuth();

    // Get totals from the TotalsProvider context
    const { incomeTotal, investmentTotal, expenseTotal } = useTotals();

    let tax_rate = 0.75;
    const est_monthly_expense = (expenseTotal / 12);
    const expense = expenseTotal;
    const income = incomeTotal;
    const investment = investmentTotal;
    const monthlyIncome = (income / 12) * tax_rate;
    const monthlyContribution = ((income / 12) * tax_rate) * 0.25;

    console.log("expenses", est_monthly_expense, expense);
    console.log("Variables totals", investment, income, expense);
    console.log("monthy contribution", monthlyContribution);
    console.log("monthly income", monthlyIncome);

    const cashFlow = monthlyIncome;

    console.log("cashflow calc", cashFlow, monthlyIncome, est_monthly_expense);

    const cashFlowMessage = cashFlow >= 0
        ? `Monthly Cash Flow: +$${cashFlow.toLocaleString()} (Consider allocating this to savings)`
        : `Monthly Cash Flow: -$${Math.abs(cashFlow).toLocaleString()} (Consider reducing expenses)`;

    // Since we removed local fetching, we can no longer rely on totalExpenses or totalIncome from state.
    // We'll use incomeTotal and expenseTotal directly for calculations.
    const handleUpdateFinances = (newIncome, newExpense) => {
        // If you need to update something locally, you can, 
        // but since we now rely on context totals, this might be unnecessary.
    };

    // Calculate financial health score
    const calculateFinancialHealthScore = (income, expense, currentSavings, yearsToRetirement) => {
        console.log("calc-score", income, expense, currentSavings, yearsToRetirement);

        const savingsRate = (currentSavings / income) * 100;
        console.log("savingsrate", savingsRate);
        const debtToIncomeRatio = (expense / income) * 100;
        console.log("debt-to-income", debtToIncomeRatio);

        const score = Math.max(0, Math.min(100, (savingsRate - debtToIncomeRatio) + yearsToRetirement / 2));
        console.log("score", score);

        let advice = "";
        if (score < 50) {
            advice = "Consider increasing your monthly savings or reducing expenses to improve financial health.";
        } else if (score < 75) {
            advice = "You're on the right track. Keep saving and manage spending to maintain your financial health.";
        } else {
            advice = "Excellent! You are financially healthy and well-prepared for the future.";
        }

        return { score, advice };
    };

    const financialHealth = calculateFinancialHealthScore(income, expense, currentSavings, yearsToRetirement);

    // Generate data for Savings vs Income line chart
    const SavingsVsIncomeChart = ({ totalIncome, currentSavings, yearsToRetirement, monthlyContribution }) => {
        totalIncome = income; // use totals from context
        const annualReturnRate = 0.07; // Assume a 7% annual return rate
        const monthlyReturnRate = annualReturnRate / 12;
        const incomeProjection = Array.from({ length: yearsToRetirement }, (_, i) => totalIncome * (i + 1));
        
        const savingsProjection = Array.from({ length: yearsToRetirement }, (_, i) => {
            const months = (i + 1) * 12;
            const futureSavings = currentSavings * (1 + monthlyReturnRate) ** months;
            const futureContributions = monthlyContribution * (((1 + monthlyReturnRate) ** months - 1) / monthlyReturnRate);
            
            return futureSavings + futureContributions;
        });

        const chartData = {
            labels: Array.from({ length: yearsToRetirement }, (_, i) => `Year ${i + 1}`),
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

    return (
        <div className="financial-dashboard">
            <h2>Financial Dashboard</h2>

            {/* Monthly Cash Flow Summary */}
            <div className="cash-flow-summary">
                <h3>{cashFlowMessage}</h3>
            </div>

            {/* If you want to show Financial Health Score, uncomment:
            <div className="financial-health-score">
                <h3>Financial Health Score: {financialHealth.score}</h3>
                <p>{financialHealth.advice}</p>
            </div>
            */}

            <div className="dashboard-section">
                <SavingsPlanDashboard
                    totalExpenses={expense}
                    totalIncome={income}
                    currentSavings={currentSavings}
                    yearsToRetirement={yearsToRetirement}
                />
            </div>
        </div>
    );
};

export default FinancialDashboard;
