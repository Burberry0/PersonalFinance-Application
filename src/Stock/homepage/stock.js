import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTicker } from "../globalcontext/TickerContext";
import StockChart from "./stockchart";
import Financials from "./Financial";
import StockDeal from "./Stockdeal";
import "./stock.css"; // Import the new CSS file

export default function Stock() {
    const currentUserId = sessionStorage.getItem("user_id");
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [wallet, setWallet] = useState({
        purchasing_power: 0,
        holding_value: 0,
        total_value: 0,
    });
    const { selectedTicker } = useTicker();


    const updateWallet = (newPurchasingPower) => {
        setWallet((prevWallet) => ({
            ...prevWallet,
            purchasing_power: newPurchasingPower,
        }));
    };


    
    

    if (loading) return <div className="loading-indicator">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="stock-page-container">
            <div className="stock-content">
                <div className="left-column">
                    <div className="graph">
                    
                        {selectedTicker && (
                            <StockDeal selectedTicker={selectedTicker} wallet={wallet} updateWallet={updateWallet} />
                        )}

                    </div>

                    <div className="button-group-bottom">
                        <button onClick={() => navigate("/Financial-Statements")}>View Finances</button>
                        <button onClick={() => navigate("/PortDisplay")}>View Portfolio</button>
                    </div>

                    
                </div>

                <div className="right-column">
                    <StockChart selectedTicker={selectedTicker} />
                </div>


                {selectedTicker && <Financials selectedTicker={selectedTicker} />}

            </div>

            
        </div>
    );
}
