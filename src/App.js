import ProtectedRoute from './Login/Protected';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useLocation, Outlet } from 'react-router-dom';
import { TickerProvider } from './Stock/globalcontext/TickerContext';
import { PortfolioProvider } from './Stock/menu-items/Portfolio/context/PortfolioContext';
import Signup from './Login/Signup'; 
import Stock from './Stock/homepage/stock';
import SideMenu from './Stock/buttons/SideNavigation';
import Portfolio from './Stock/menu-items/Portfolio/Portfolio'; 
import Statements from './Stock/menu-items/FinancialStatements/Statements';
import Login from './Login/Login';
import UserTransactions from './Stock/menu-items/Transaction';
import StockSearch from './Stock/searchstock';
import Greeting from './Stock/greet';
import Spending from './Stock/menu-items/Spending/spending';
import Saving from './Stock/menu-items/Savings/Savings';
import SavingsPlanQuestionnaire from './Stock/menu-items/Savings/Savings';
import SavingsPlanDashboard from './Stock/menu-items/Savings/SavingsDash';
import FinancialDashboard from './Stock/menu-items/Savings/FinancialDashboard';
import { MonthProvider } from './Stock/globalcontext/MonthContext';
import { TotalsProvider } from './Stock/globalcontext/TotalContext';


function App() {
  return (
    <TickerProvider>
      <MonthProvider>
        <TotalsProvider>
          <PortfolioProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/Login" element={<Login />} />
                  <Route path="/Signup" element={<Signup />} />
                  <Route path="/Savings-plan" element={<ProtectedRoute><SavingsPlanQuestionnaire /> </ProtectedRoute>}/>
                  <Route element={<MainLayout />}> 
                    <Route path="/" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
                    <Route path="/PortDisplay" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                    <Route path="/financial-statements" element={<ProtectedRoute><Statements /></ProtectedRoute>} />
                    <Route path="/Transactions" element={<ProtectedRoute><UserTransactions /></ProtectedRoute>} />
                    <Route path="/Spending" element={<ProtectedRoute><Spending /></ProtectedRoute>} />
                    <Route path='/Savings' element={<ProtectedRoute><SavingsPlanDashboard /></ProtectedRoute>} />
                    <Route path='/Dashboard' element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
                  </Route>
                </Routes>
              </div>
            </Router>
          </PortfolioProvider>
        </TotalsProvider>
      </MonthProvider>
    </TickerProvider>
  );
}

function MainLayout() {
  const location = useLocation();
  const showSearchContainer = !['/Login', '/Signup'].includes(location.pathname);

  return (
    <>
      {showSearchContainer && (
        <div>
          <StockSearch /> {/* Passing the setSelectedTicker */}
        </div>
      )}
      <div className='main-content'>
        <Outlet />
      </div>
    </>
  );

}

export default App;
