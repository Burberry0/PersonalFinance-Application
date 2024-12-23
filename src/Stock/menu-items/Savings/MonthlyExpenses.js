import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import "../Spending/spending.css"
import { useAuth } from '../../../Login/AuthProvider';
import { useTotals } from '/Users/brandonkohler/react-ec/app/src/Stock/globalcontext/TotalContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const year = 2024; // If fixed, keep it as a constant outside the component

const ExpenseHistogram = ({ isYearly, handleMonthClick }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState(Array(12).fill(0));
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [error, setError] = useState(null);
  const [mostExpensiveTransaction, setMostExpensiveTransaction] = useState(null);
  const [highestSpendingCategory, setHighestSpendingCategory] = useState('');
  const [averageTransaction, setAverageTransaction] = useState(0);
  const [numberOfTransactions, setNumberOfTransactions] = useState(0);

  const [monthlyTotals, setMonthlyTotals] = useState({
    income: 0, investment: 0, expense: 0
  });

  const token = useAuth();
  const currentUserId = sessionStorage.getItem('user_id');
  const { incomeTotal, investmentTotal, expenseTotal } = useTotals(); // from totals context

  const labels = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  // Fetch Yearly Data
  useEffect(() => {
    const fetchYearlyExpensesWithDetails = async () => {
      if (!isYearly) return; // Only fetch if yearly data is needed
      try {
        const response = await fetch(`http://localhost:8000/Spending/${currentUserId}/expense/monthly?start_date=${year}-01-01&end_date=${year}-12-31`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch yearly expenses and details');
        }

        const data = await response.json();
        // Process yearly data
        const expensesByMonth = Array(12).fill(0);
        const categoryTotals = {};
        let localMostExpensiveTransaction = null;
        let totalTransactions = 0;
        let totalExpenseSum = 0;

        Object.keys(data).forEach((month) => {
          const monthIndex = parseInt(month.split('-')[1], 10) - 1;
          const monthData = data[month];
          expensesByMonth[monthIndex] = monthData.total;
          totalExpenseSum += monthData.total;

          monthData.transactions.forEach((transaction) => {
            if (transaction.category !== 'Income') {
              if (!localMostExpensiveTransaction || transaction.amount > localMostExpensiveTransaction.amount) {
                localMostExpensiveTransaction = transaction;
              }
              categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
              totalTransactions++;
            }
          });          
        });

        const categoryKeys = Object.keys(categoryTotals);
        const localHighestSpendingCategory = categoryKeys.length
          ? categoryKeys.reduce((max, category) => categoryTotals[category] > categoryTotals[max] ? category : max, categoryKeys[0])
          : '';

        const localAverageTransaction = totalTransactions > 0 ? (totalExpenseSum / totalTransactions).toFixed(2) : 0;

        setMonthlyExpenses(expensesByMonth);
        setMostExpensiveTransaction(localMostExpensiveTransaction);
        setHighestSpendingCategory(localHighestSpendingCategory);
        setAverageTransaction(localAverageTransaction);
        setNumberOfTransactions(totalTransactions);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching yearly expenses and details:', err);
      }
    };

    fetchYearlyExpensesWithDetails();
  }, [isYearly, currentUserId, token]);

  // Click handler to fetch monthly data
  const fetchMonthlyTransactions = async (monthIndex) => {
    const formattedMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const startDate = `${formattedMonth}-01`;
    const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];

    try {
      const response = await fetch(`http://localhost:8000/Spending/${currentUserId}/transactions/monthly?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions for the selected month');
      }

      const data = await response.json();
      setMonthlyTransactions(data);

      // Filter out income category for expensive transaction/cat calc
    // Filter out income and investment categories for expensive transaction/cat calc
      const filteredData = data.filter(t => t.category !== 'Income' && t.category !== 'Investment');

      const totalExpenses = filteredData.reduce((sum, t) => sum + t.amount, 0);
      const localMostExpensive = filteredData.reduce((max, t) => (t.amount > max.amount ? t : max), filteredData[0] || {});
      const categoryTotals = filteredData.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      const categoryKeys = Object.keys(categoryTotals);
      const localHighestSpendingCategory = categoryKeys.length
      ? categoryKeys.reduce((max, c) => categoryTotals[c] > categoryTotals[max] ? c : max, categoryKeys[0])
      : '';

      const localAverageTransaction = data.length > 0 ? (totalExpenses / data.length).toFixed(2) : 0;

      setMostExpensiveTransaction(localMostExpensive);
      setHighestSpendingCategory(localHighestSpendingCategory);
      setAverageTransaction(localAverageTransaction);
      setNumberOfTransactions(data.length);
      // Calculate monthly totals
      const monthlyIncome = data.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const monthlyInvestment = data.filter(t => t.type === 'INVESTMENT').reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpense = data.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

      setMonthlyTotals({
        income: monthlyIncome,
        investment: monthlyInvestment,
        expense: monthlyExpense
      });

    } catch (error) {
      setError(error.message);
      console.error('Error fetching monthly transactions:', error);
    }
  };

  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Monthly Expenses',
      data: monthlyExpenses,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  }), [labels, monthlyExpenses]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const monthIndex = elements[0].index;
        const selectedMonthLabel = labels[monthIndex];
        fetchMonthlyTransactions(monthIndex);
        setSelectedMonth(selectedMonthLabel);
        handleMonthClick(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Expenses for the Year',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Expense Amount ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  }), [labels, handleMonthClick]);

  return (
    <div className='container-work'>
        <div className='wrapper'>
          <div className='monthly-expenses'>
            {error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <Bar data={chartData} options={options} />
            )}
          </div>

          <div className="monthly-details">
            <h4>Details for {isYearly ? "Year" : selectedMonth}</h4>
            {isYearly ? (
              <>
                <p><strong>Total Income:</strong> ${incomeTotal.toFixed(2)}</p>
                <p><strong>Total Invested:</strong> ${investmentTotal.toFixed(2)}</p>
                <p><strong>Total Expenses:</strong> ${expenseTotal.toFixed(2)}</p>
              </>
            ) : (
              <>
                <p><strong>Total Income:</strong> ${monthlyTotals.income.toFixed(2)}</p>
                <p><strong>Total Invested:</strong> ${monthlyTotals.investment.toFixed(2)}</p>
                <p><strong>Total Expenses:</strong> ${monthlyTotals.expense.toFixed(2)}</p>
              </>
            )}

            {mostExpensiveTransaction && mostExpensiveTransaction.amount && (
              <p>
                <strong>Most Expensive Transaction:</strong> ${mostExpensiveTransaction.amount.toFixed(2)} at {mostExpensiveTransaction.store_name} ({mostExpensiveTransaction.category})
              </p>
            )}
            <p><strong>Category with Highest Spending:</strong> {highestSpendingCategory || 'N/A'}</p>
            <p><strong>Number of transactions:</strong> {numberOfTransactions}</p>
            <p><strong>Average Transaction: $</strong> {averageTransaction}</p>
          </div>
      </div>

      {selectedMonth !== null && monthlyTransactions.length > 0 && (
        <div className='Transactions-table'>
          <h4>Transactions for {selectedMonth}</h4>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Store Name</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTransactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>${transaction.amount.toFixed(2)}</td>
                  <td>{transaction.store_name}</td>
                  <td>{transaction.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExpenseHistogram);
