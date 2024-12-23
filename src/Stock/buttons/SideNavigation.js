import React, {useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import './sidebar.css';
import { slide as Menu } from 'react-burger-menu';
import { useTicker } from '../globalcontext/TickerContext.js';
import { useAuth } from "../../Login/AuthProvider";


export default function SideMenu() {
  const { selectedTicker } = useTicker();
  const { logout } = useAuth();
  const navigate = useNavigate();
  console.log("Selected Ticker in SideMenu:", selectedTicker);



  const [isOpen, setIsOpen] = useState(false);

  const handleStateChange = (state) => {
    setIsOpen(state.isOpen);
  };

  const handleLogout = () => {
    logout();  // Call the logout function to clear the user session
    navigate('/login');  // Redirect to the home page
  };



  console.log("Menu state", setIsOpen);
  console.log("Selected Ticker in SideMenu:", selectedTicker);


  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <Menu className="side-menu" isOpen={isOpen} onStateChange={handleStateChange} right={false}>
      <Link className="menu-item" to="/" onClick={closeMenu}>Home</Link>

      <Link className="menu-item" to={{
          pathname: "/Financial-Statements",
          state: { selectedTicker } // Passing selectedTicker as state
      }} onClick={closeMenu}>Financial</Link>


      

      <Link className="menu-item" to={{
          pathname: "/PortDisplay",
          state: { selectedTicker }
      }} onClick={closeMenu}>Portfolio</Link>


      <Link className="menu-item" to={{
          pathname: "/Transactions",
          state: { selectedTicker }
      }} onClick={closeMenu}>Transactions</Link>


      <Link className="menu-item" to={{
        pathname: "/Savings",
      }} onClick={closeMenu}>Dashboard</Link>


      <Link className="menu-item" to={{
          pathname: "/login",
        
      }} onClick={() => {handleLogout(); closeMenu(); }}>Log out</Link>

      
    </Menu>
  );
}