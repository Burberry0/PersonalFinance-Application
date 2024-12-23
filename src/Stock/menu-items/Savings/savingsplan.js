import React, { useEffect, useState } from 'react';
import SavingsPlanQuestionnaire from './Savings';
import { useNavigate } from 'react-router-dom';


const SavingsPlanResult = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingsplan, setSavingsPlan] = useState(null);
  const navigate = useNavigate();



  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/generate_savings_plan', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate savings plan.');
      }

      const resultData = await response.json();
      setSavingsPlan(resultData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>      
      {loading && <p>Loading your savings plan...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {result && (
        <div className="result-container">
          <h3>Your Retirement Savings Plan</h3>
          <p><strong>Total Savings at Retirement:</strong> ${result.total_retirement_savings.toFixed(2)}</p>
          <p><strong>Years to Retirement:</strong> {result.years_to_retirement} years</p>
          <p><strong>Estimated Monthly Savings Needed:</strong> ${result.monthly_savings_needed.toFixed(2)}</p>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default SavingsPlanResult;
