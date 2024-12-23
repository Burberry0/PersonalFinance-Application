import React, { useState, useEffect, useContext } from "react";
import { PortfolioContext } from "../menu-items/Portfolio/context/PortfolioContext";
import "./stock.css"; // Import the new CSS file

export default function StockDeal({ selectedTicker, wallet }) {
    const [quantity, setQuantity] = useState(1);
    const [purchasingPower, setPurchasingPower] = useState(wallet.purchasing_power);
    const [statusMessage, setStatusMessage] = useState("");

    const currentUserId = sessionStorage.getItem("user_id");
    const { portfolio, setPort, fetchPortfolio } = useContext(PortfolioContext);

    const { symbol, price } = selectedTicker || {};

    useEffect(() => {
        setPurchasingPower(wallet.purchasing_power);
    }, [wallet, portfolio]);

    const handleBuyStock = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/buy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ticker: symbol,
                    quantity: parseInt(quantity),
                    price: parseFloat(price),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Buy successful:", data);
                setQuantity(1); // Reset quantity after buying
                updateLocalPortfolio(symbol, quantity, price);
                await fetchUpdatedWallet();
                await fetchPortfolio();
                setStatusMessage("Buy successful!");
            } else {
                console.error("Failed to buy stock:", response);
                setStatusMessage("Buy failed. Please try again.");
            }
        } catch (error) {
            console.error("Error buying stock:", error);
            setStatusMessage("An error occurred while buying the stock.");
        }
    };

    const handleSellStock = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/sell`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ticker: symbol,
                    quantity: parseInt(quantity),
                    price: parseFloat(price),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Sell successful:", data);
                setQuantity(1); // Reset quantity after selling
                updateLocalPortfolio(symbol, -quantity, price);
                await fetchPortfolio();
                await fetchUpdatedWallet();
                setStatusMessage("Sell successful");
            } else {
                console.error("Failed to sell stock:", response);
                setStatusMessage("Sell failed. Please try again.");
            }
        } catch (error) {
            console.error("Error selling stock:", error);
            setStatusMessage("An error occurred while selling the stock.");
        }
    };

    const fetchUpdatedWallet = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/wallet`, {
                method: "GET",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch updated wallet");
            }
            const data = await response.json();
            setPurchasingPower(data.purchasing_power);
        } catch (error) {
            console.error("Error fetching updated wallet:", error);
        }
    };

    const updateLocalPortfolio = (symbol, qtyChange, price) => {
        setPort(prevPortfolio => {
            const existingItem = prevPortfolio.find(item => item.symbol === symbol);
            if (existingItem) {
                return prevPortfolio.map(item =>
                    item.symbol === symbol
                        ? { ...item, quantity: item.quantity + qtyChange, price }
                        : item
                );
            } else {
                return [...prevPortfolio, { symbol, quantity: qtyChange, price }];
            }
        });
    };

    if (!selectedTicker) {
        return <div>Please select a stock to trade.</div>;
    }

    return (
        <div className="card-container">
            <div className="stock-card">
                <h1>{symbol}</h1>
                <p>Price: ${price}</p>

                <div className="quantity-section">
                    <label htmlFor="quantity">Quantity: </label>
                    <input
                        type="number"
                        id="quantity"
                        min="1"
                        value={quantity}
                        onChange={e => setQuantity(parseInt(e.target.value))}
                    />
                </div>

                <div className="button-group">
                    <button className="buy-button" onClick={handleBuyStock}>Buy</button>
                    <button className="sell-button" onClick={handleSellStock}>Sell</button>
                </div>
                <p>Purchasing Power: ${purchasingPower.toFixed(2)}</p>

                {statusMessage && (
                    <div className="status-message">
                        {statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
