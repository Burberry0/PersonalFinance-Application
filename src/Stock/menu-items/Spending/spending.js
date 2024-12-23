import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ExpensesIncomeChart } from './SpendingChart';
import CategoryExpensesChart from './CategoryExpenses';
import './spending.css';
import SavingsPlanResult from '../Savings/savingsplan';
import ExpenseHistogram from '../Savings/MonthlyExpenses';
import { useAuth } from '../../../Login/AuthProvider';
import { useMonthContext } from '../../globalcontext/MonthContext';
// Removed: import { useTotals } from '../../globalcontext/TotalContext';

const summarizeTransactionsByCategory = (data) => {
  const categorySummary = {};
  data.forEach((transaction) => {
    const { category, amount, type } = transaction;
    if (type === 'EXPENSE') {
      categorySummary[category] = (categorySummary[category] || 0) + amount;
    }
  });
  return categorySummary;
};

export default function Spending() {
  const currentUserId = sessionStorage.getItem('user_id');
  const [categorizedData, setCategoryData] = useState({});
  const [transactionData, setTransactionData] = useState({
    income: [],
    investment: [],
    expense: [],
    cashBuffer: [],
    totals: { income: 0, investment: 0, expense: 0, cashBuffer: 0 },
  });
  const { formattedMonth, setFormattedMonth } = useMonthContext();
  const token = useAuth();
  const [isYearly, setIsYearly] = useState(true);

  // Removed useTotals usage since we're relying on transactionData

  const organizeAndSummarizeTransactions = useCallback((data) => {
    const organized = {
      income: [],
      investment: [],
      expense: [],
      cashBuffer: [],
      totals: {
        income: 0,
        investment: 0,
        expense: 0,
        cashBuffer: 0,
      },
    };

    data.forEach((transaction) => {
      const amount = transaction.amount;
      switch (transaction.type) {
        case 'INCOME':
          organized.income.push(transaction);
          organized.totals.income += amount;
          break;
        case 'INVESTMENT':
          organized.investment.push(transaction);
          organized.totals.investment += amount;
          break;
        case 'EXPENSE':
          organized.expense.push(transaction);
          organized.totals.expense += amount;
          break;
        case 'CASHBUFFER':
          organized.cashBuffer.push(transaction);
          organized.totals.cashBuffer += amount;
          break;
        default:
          break;
      }
    });

    return organized;
  }, []);

  const fetchAndOrganizeTransactions = useCallback(
    async (month) => {
      if (!month) return;
      const [year, monthPart] = month.split('-');
      const lastDayOfMonth = new Date(year, monthPart, 0).getDate();
      const startDate = `${month}-01`;
      const endDate = `${month}-${lastDayOfMonth}`;

      try {
        const response = await axios.get(
          `http://localhost:8000/Spending/${currentUserId}/transactions/monthly?start_date=${startDate}&end_date=${endDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data;

        const summarizedData = summarizeTransactionsByCategory(data);
        setCategoryData(summarizedData);

        setIsYearly(false); // Switch to monthly view

        const organizedData = organizeAndSummarizeTransactions(data);
        setTransactionData(organizedData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    },
    [currentUserId, token, organizeAndSummarizeTransactions]
  );

  const fetchYearlyData = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/Spending/4/transactions/yearly?year=2024`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const summarizedData = summarizeTransactionsByCategory(data);
      const organize = organizeAndSummarizeTransactions(data);

      setCategoryData(summarizedData);
      setTransactionData(organize);
      setIsYearly(true);
    } catch (error) {
      console.error("Error fetching yearly data:", error);
    }
  }, [token, organizeAndSummarizeTransactions]);

  const handleMonthClick = useCallback(
    (newFormattedMonth) => {
      setIsYearly(false);
      setFormattedMonth(newFormattedMonth);
      fetchAndOrganizeTransactions(newFormattedMonth);
    },
    [setFormattedMonth, fetchAndOrganizeTransactions]
  );

  useEffect(() => {
    if (isYearly) {
      fetchYearlyData();
    } else if (formattedMonth) {
      fetchAndOrganizeTransactions(formattedMonth);
    }
  }, [isYearly, formattedMonth, fetchYearlyData, fetchAndOrganizeTransactions]);

  return (
    <div className="Spending-Container">
      <div className='Savings'>
        <SavingsPlanResult />
      </div>

      <div className="ChartsGrid">
        {/* Pass transactionData.totals directly */}
        <ExpensesIncomeChart
          formattedMonth={formattedMonth}
          isYearly={isYearly}
          totals={transactionData.totals}
        />
        <CategoryExpensesChart categorizedData={categorizedData} isYearly={isYearly} />
      </div>

      <ExpenseHistogram
        handleMonthClick={handleMonthClick}
        isYearly={isYearly}
      />
    </div>
  );
}
