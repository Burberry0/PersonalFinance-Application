import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../Login/AuthProvider'; // Adjust the import path as needed

const TotalsContext = createContext();

export const useTotals = () => useContext(TotalsContext);

export const TotalsProvider = ({ children }) => {
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [investmentTotal, setInvestmentTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [error, setError] = useState(null);

  const token = useAuth(); 
  const currentUserId = localStorage.getItem('user_id'); // Adjust if you get this differently

  useEffect(() => {
    console.log("TotalsProvider: useEffect triggered.");
    console.log("Current User ID:", currentUserId);
    console.log("Token:", token);

    const fetchTotals = async () => {
      if (!currentUserId || !token) {
        console.log("No currentUserId or token available. Skipping fetch.");
        return;
      }

      console.log("Fetching totals for user:", currentUserId);

      try {
        const urls = [
          `http://localhost:8000/Spending/${currentUserId}/total?type=EXPENSE`,
          `http://localhost:8000/Spending/${currentUserId}/total?type=INCOME`,
          `http://localhost:8000/Spending/${currentUserId}/total?type=INVESTMENT`
        ];

        const responses = await Promise.all(
          urls.map(url => {
            console.log("Fetching URL:", url);
            return fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })
          })
        );

        responses.forEach((response, index) => {
          console.log(`Response for ${urls[index]}:`, response);
          if (!response.ok) {
            throw new Error(`Error fetching totals from ${urls[index]}`);
          }
        });

        const data = await Promise.all(responses.map(response => response.json()));
        console.log("Fetched Data:", data);

        // Assuming the API returns something like { total: number } for each:
        const fetchedExpense = data[0]?.total ?? 0;
        const fetchedIncome = data[1]?.total ?? 0;
        const fetchedInvestment = data[2]?.total ?? 0;

        console.log("Setting totals:", { fetchedExpense, fetchedIncome, fetchedInvestment });
        setExpenseTotal(fetchedExpense);
        setIncomeTotal(fetchedIncome);
        setInvestmentTotal(fetchedInvestment);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching spending totals:', err);
      }
    };

    fetchTotals();
  }, [currentUserId, token]);

  console.log("TotalsProvider Render:", { incomeTotal, investmentTotal, expenseTotal, error });

  return (
    <TotalsContext.Provider value={{ incomeTotal, investmentTotal, expenseTotal, error }}>
      {children}
    </TotalsContext.Provider>
  );
};
