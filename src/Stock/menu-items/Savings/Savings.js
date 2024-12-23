import React, { useState } from 'react';
import "./savings.css";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Login/AuthProvider';

const SavingsPlanQuestionnaire = () => {
  const [savingsPlan, setSavingsPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    annualSalary: '',
    monthlyContribution: '',
    currentAge: '',
    retirementAge: '',
    currentSavings: '',
    monthlyExpenses: '',
    riskTolerance: 'Medium',
    otherGoals: ''
  });
  const { token } = useAuth();
  const navigate = useNavigate();
  const user_id = sessionStorage.getItem("user_id");


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  async function completedQuestionnaire() {
    const user_id = sessionStorage.getItem("user_id");
    try {
      await fetch(`http://localhost:8000/${user_id}/status`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      console.log("Questionnaire marked as completed.");
    } catch (error) {
      console.error("Failed to mark questionnaire as completed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSend = {
      annual_salary: parseFloat(formData.annualSalary),
      monthly_contribution: parseFloat(formData.monthlyContribution),
      current_age: parseInt(formData.currentAge),
      retirement_age: parseInt(formData.retirementAge),
      current_savings: formData.currentSavings ? parseFloat(formData.currentSavings) : 0,
      monthly_expenses: parseFloat(formData.monthlyExpenses),
      risk_tolerance: formData.riskTolerance,
      other_goals: formData.otherGoals || ""
    };

    try {
      const response = await fetch(`http://localhost:8000/generate_savings_plan/${user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Error generating savings plan');
      }

      const result = await response.json();
      setSavingsPlan(result);

      // Mark questionnaire as completed
      await completedQuestionnaire();

      // Redirect to Home page after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate savings plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="questionnaire-container">
      <h2>Retirement Savings Plan Questionnaire</h2>
      <form onSubmit={handleSubmit} className="questionnaire-form">
        <label>What is your annual salary?</label>
        <input type="number" name="annualSalary" value={formData.annualSalary} onChange={handleChange} required />

        <label>How much would you like to contribute monthly?</label>
        <input type="number" name="monthlyContribution" value={formData.monthlyContribution} onChange={handleChange} required />

        <label>What is your current age?</label>
        <input type="number" name="currentAge" value={formData.currentAge} onChange={handleChange} required />

        <label>At what age do you want to retire?</label>
        <input type="number" name="retirementAge" value={formData.retirementAge} onChange={handleChange} required />

        <label>How much have you saved so far?</label>
        <input type="number" name="currentSavings" value={formData.currentSavings} onChange={handleChange} />

        <label>What are your average monthly living expenses?</label>
        <input type="number" name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleChange} required />

        <label>How would you describe your risk tolerance?</label>
        <select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} required>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <label>Do you have any other financial goals? (optional)</label>
        <textarea name="otherGoals" value={formData.otherGoals} onChange={handleChange} placeholder="E.g., Buy a house, save for a child's education" />

        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Savings Plan'}
        </button>
      </form>
      
      {savingsPlan && (
        <div className="savings-plan-result">
          <h3>Your Savings Plan</h3>
          <p><strong>Total Retirement Savings:</strong> ${savingsPlan.total_retirement_savings.toFixed(2)}</p>
          <p><strong>Years to Retirement:</strong> {savingsPlan.years_to_retirement} years</p>
          <p><strong>Estimated Monthly Savings Needed:</strong> ${savingsPlan.monthly_savings_needed.toFixed(2)}</p>
          <p>{savingsPlan.message}</p>
          <p>You will be redirected to the Home page shortly...</p>
        </div>
      )}
    </div>
  );
};

export default SavingsPlanQuestionnaire;
