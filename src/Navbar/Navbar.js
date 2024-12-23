// App.js
import React from "react";
import { Link } from "react-router-dom";
import './Navbar.css'; // Ensure this path is correct

function Navbar() {
  return (
    <div className="topNav">
      <Link className="active" to="/home">Home</Link>
      <Link to="/stock">Stock</Link>
      <Link to="/weather">Weather</Link>
      <Link to="/news">News</Link>
      <Link to="/PortDisplay">Portfolio</Link>
    </div>
  );
}

export default Navbar;
