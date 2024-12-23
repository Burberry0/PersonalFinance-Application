import React, { useState, useEffect, useMemo } from "react";
import "./SavingsPlanSummary.css";
import { ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PortfolioMenu from "./PortfolioDashboard";
import { Line } from "react-chartjs-2";

const annualReturnRate = 0.07; // 7% annual return
const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;

// Helper Functions
const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

const getLastDayOfCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1; 
  const nextMonth = new Date(year, month, 1);
  nextMonth.setDate(nextMonth.getDate() - 1);
  return `${year}-${(nextMonth.getMonth() + 1).toString().padStart(2, "0")}-${nextMonth
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

function formatCurrency(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Subcomponents
const Details = React.memo(({ title, items }) => (
  <div className="details">
    <h2>{title}</h2>
    {items.map(({ label, value }, idx) => (
      <div key={idx} className="detail-item">
        <h4>{label}</h4>
        <p>{value}</p>
      </div>
    ))}
  </div>
));


const InvestDetails = React.memo(({ title, items }) => (
  <div className="invest-details">
    <h2>{title}</h2>
    {items.map(({ label, value }, idx) => (
      <div key={idx} className="detail-item">
        <h4>{label}</h4>
        <p>{value}</p>
      </div>
    ))}
  </div>
));

const InvestmentProjections = React.memo(({ monthlyContribution, investmentTotal }) => {
  const annualReturnRate = 0.07; // 7%
  const calculateFutureValue = (mc, years, rate) => {
    const n = years * 12;
    const r = rate / 12;
    const value = mc * ((Math.pow(1 + r, n) - 1) / r);
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const growth5Years = useMemo(() => calculateFutureValue(monthlyContribution, 5, annualReturnRate), [monthlyContribution]);
  const growth10Years = useMemo(() => calculateFutureValue(monthlyContribution, 10, annualReturnRate), [monthlyContribution]);
  const growth20Years = useMemo(() => calculateFutureValue(monthlyContribution, 20, annualReturnRate), [monthlyContribution]);

  const projectionItems = useMemo(() => [
    { label: "Current Monthly Contribution", value: `$${monthlyContribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "Total Investment So Far", value: `$${investmentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "5-Year Projection", value: `$${growth5Years}` },
    { label: "10-Year Projection", value: `$${growth10Years}` },
    { label: "20-Year Projection", value: `$${growth20Years}` },
  ], [monthlyContribution, investmentTotal, growth5Years, growth10Years, growth20Years]);

  return <InvestDetails title="Investment Projections" items={projectionItems} />;
});


const PortfolioAnalysis = React.memo(({ highWeightStocks, onHighWeight, navigate }) => (
  <div className="detail-item">
    <h4>Portfolio Analysis:</h4>
    <PortfolioMenu onHighWeight={onHighWeight} />
    {highWeightStocks.length > 0 && (
      <div>
        <p>High Weight Stocks Warning</p>
        {highWeightStocks.map((stock) => (
          <p key={stock.ticker}>
            {stock.ticker} has a weight of {stock.weight}%.
          </p>
        ))}
      </div>
    )}
    <button onClick={() => navigate("/PortDisplay")}>View Portfolio</button>
  </div>
));

const CashflowAnalysis = React.memo(({ incomeTotal, expenseTotal, investmentTotal }) => {
  const cashBuffer = incomeTotal - (expenseTotal + investmentTotal);
  const res = incomeTotal * 0.10;
  const analysis = cashBuffer < 0
    ? `Negative Cashflow: Deficit of $${Math.abs(cashBuffer).toFixed(2)}`
    : cashBuffer <= res
      ? `Reduce Spending by $${Math.abs(res - cashBuffer).toFixed(2)}`
      : `Healthy Cashflow: Surplus of $${cashBuffer.toFixed(2)}`;

  return (
    <div className="detail-item">
      <h4>Cashflow</h4>
      <p>{`${formatCurrency(analysis)}`}</p>
    </div>
  );
});

const InvestmentAnalysis = React.memo(({ investmentTotal, monthlyContribution }) => {
  const diff = (investmentTotal - monthlyContribution).toFixed(2);
  const analysis =
    investmentTotal < monthlyContribution
      ? `Under Investing by $${Math.abs(diff)}`
      : `Over Investing by $${diff}`;

  return (
    <div className="detail-item">
      <h4>Investment Analysis</h4>
      <p>{`${formatCurrency(analysis)}`}</p>
    </div>
  );
});

const ExpenseAnalysis = React.memo(({ expenseTotal, monthlyExpenses, navigate }) => {
  const overAmount = (expenseTotal - monthlyExpenses).toFixed(2);
  const analysis =
    expenseTotal > monthlyExpenses
      ? `Over Spending by $${overAmount}`
      : "Spending is within budget";

  return (
    <div className="detail-item">
      <h4>Expense Analysis</h4>
      <p>{`${formatCurrency(analysis)}`}</p>
      <button onClick={() => navigate("/Spending")}>View Spending</button>
    </div>
  );
});

const currentMonth = getCurrentMonth();
const endDate = getLastDayOfCurrentMonth();

const SavingsPlanDashboard = () => {
  const [data, setData] = useState(null);
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [highWeightStocks, setHighWeightStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const user_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expenseRes, incomeRes, contribRes] = await Promise.all([
          fetch(`http://localhost:8000/Spending/4/expense/monthly?start_date=${currentMonth}-01&end_date=${endDate}`),
          fetch(`http://localhost:8000/Spending/4/income/monthly?start_date=${currentMonth}-01&end_date=${endDate}`),
          fetch(`http://localhost:8000/Spending/4/investment/monthly?start_date=${currentMonth}-01&end_date=${endDate}`),
        ]);

        const [expenseData, incomeData, contributionData] = await Promise.all([
          expenseRes.json(), incomeRes.json(), contribRes.json(),
        ]);

        const newTotals = [
          { type: "expense", total: expenseData[currentMonth]?.total || 0 },
          { type: "income", total: incomeData[currentMonth]?.total || 0 },
          { type: "investment", total: contributionData[currentMonth]?.total || 0 },
        ];

        setMonthlyTotals(newTotals);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSavingsPlan = async () => {
      try {
        const response = await fetch(`http://localhost:8000/savings_plan/${user_id}`);
        if (!response.ok) throw new Error("Failed to fetch savings plan");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user_id) {
      fetchSavingsPlan();
    }
  }, [user_id]);

  const totalsObject = useMemo(() => {
    return monthlyTotals.reduce((acc, { type, total }) => {
      acc[type] = total;
      return acc;
    }, {});
  }, [monthlyTotals]);

  const {
    total_retirement_savings = 0,
    years_to_retirement = 0,
    monthly_savings_needed = 0,
    retirement_age = 0,
    current_age = 0,
    monthly_contribution = 0,
    current_savings = 0,
    monthly_expenses = 0,
  } = data || {};

  const expenseTotal = totalsObject.expense || 0;
  const incomeTotal = totalsObject.income || 0;
  const investmentTotal = totalsObject.investment || 0;
  const cashBuffer = incomeTotal - (expenseTotal + investmentTotal);

  const progress = useMemo(() => {
    return ((current_age / retirement_age) * 100).toFixed(2);
  }, [current_age, retirement_age]);

  const projectedGrowthData = useMemo(() => {
    const labels = Array.from({ length: years_to_retirement }, (_, i) => current_age + i);
    return {
      labels,
      datasets: [
        {
          label: "Benchmark",
          data: labels.map((_, i) => {
            const months = i * 12;
            const futureValueContributions =
              monthly_contribution * ((1 + monthlyReturnRate) ** months - 1) / monthlyReturnRate;
            const futureValueCurrentSavings = current_savings * (1 + monthlyReturnRate) ** months;
            return futureValueContributions + futureValueCurrentSavings;
          }),
          fill: false,
          borderColor: "#007bff",
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Current Monthly Contribution",
          data: labels.map((_, i) => {
            const months = i * 12;
            const futureValueContributions =
              investmentTotal * ((1 + monthlyReturnRate) ** months - 1) / monthlyReturnRate;
            const futureValueCurrentSavings = current_savings * (1 + monthlyReturnRate) ** months;
            return futureValueContributions + futureValueCurrentSavings;
          }),
          fill: false,
          borderColor: "#FF9800",
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    };
  }, [years_to_retirement, current_age, monthly_contribution, current_savings, investmentTotal]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Age" } },
      y: { title: { display: true, text: "Total Savings ($)" }, beginAtZero: true },
    },
  }), []);

  const monthDetailItems = useMemo(() => [
    { label: "Monthly Income", value: `$${formatCurrency(incomeTotal)}` },
    { label: "Current Savings", value: `$${formatCurrency(current_savings)}` },
    { label: "Monthly Contribution", value: `$${formatCurrency(investmentTotal)}` },
    { label: "Monthly Expenses", value: `$${formatCurrency(expenseTotal)}` },
    { label: "Cash Leftover", value: `$${formatCurrency(cashBuffer)}` },
  ], [incomeTotal, current_savings, investmentTotal, expenseTotal, cashBuffer]);

  const benchDetailItems = useMemo(() => [
    { label: "Minimum Monthly Income", value: `$${monthly_savings_needed.toLocaleString()}` },
    { label: "Monthly Contribution", value: `$${monthly_contribution.toFixed(2)}` },
    { label: "Monthly Expenses", value: `$${monthly_expenses.toFixed(2)}` },
    { label: "Total Savings Goal", value: `$${total_retirement_savings.toFixed(2)}` },
    { label: "Current Age", value: `${current_age}` },
    { label: "Years until retirement", value: `${years_to_retirement}` },
  ], [monthly_savings_needed, monthly_contribution, monthly_expenses, total_retirement_savings, current_age, years_to_retirement]);


  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="savings-plan-summary">

      <div className="savings-container">

        <h2>Savings Projections</h2>
      
        <div className="savings-chart" style={{ width: '100%', 
          margin: '0 auto', 
          textAlign: 'center',
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          height: '500px'}}>

          <Line data={projectedGrowthData} options={chartOptions} />
          
        </div>

      </div>
      
      
      
      
      
      
      
      
      <div className="right-section">
        <div className="summary-card highlight">
          <h3>Years to Retirement</h3>
          <ProgressBar now={progress} label={`${years_to_retirement} years`} />
          <p>
            {current_age} / {retirement_age} years
          </p>
        
        </div>


        <div className="projections-row">

            <InvestmentProjections monthlyContribution={monthly_contribution} investmentTotal={investmentTotal} />
        </div>


      </div>

    

      <Details title={`Monthly Data for ${currentMonth}`} items={monthDetailItems} />

      <div className="summary-container">
        <h3>Monthly Summary</h3>
        <PortfolioAnalysis highWeightStocks={highWeightStocks} onHighWeight={setHighWeightStocks} navigate={navigate} />
        <CashflowAnalysis incomeTotal={incomeTotal} expenseTotal={expenseTotal} investmentTotal={investmentTotal} />
        <InvestmentAnalysis investmentTotal={investmentTotal} monthlyContribution={monthly_contribution} />
        <ExpenseAnalysis monthlyExpenses={monthly_expenses} expenseTotal={expenseTotal} navigate={navigate} />
      </div>

    </div>
  );
};

export default SavingsPlanDashboard;
