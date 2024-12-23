import React, { useState, useEffect } from 'react';
import { useTicker } from './globalcontext/TickerContext';
import SideMenu from './buttons/SideNavigation';
import Greeting from './greet';

const dummySearchData = { symbol: "AAPL", price: 300 }; // Example dummy stock data

export default function StockSearch() {
    const [ticker, setTicker] = useState("AAPL");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { setSelectedTicker } = useTicker();

    const key = "76aca232cf48b7732e7d62cf2fd91072"; // API key (for real requests)

    const fetchData = async (ticker) => {
        if (!ticker) {
            setError("Please enter a stock ticker."); // Handle empty input
            return;
        }
    
        const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${key}`;
        try {
            setLoading(true); // Start loading
            const response = await fetch(url);
            if (!response.ok) { // Check for response status
                throw new Error('Network response was not ok');
            }
            const result = await response.json(); // Await the JSON parsing
            console.log("API Response:", result); // Log the result to see the structure
            
            if (result && result.length > 0) {
                setSelectedTicker(result[0]); // Only set if there's data
                setError(null); // Reset error state
                setTicker('');
                console.log("Selected Ticker:", result[0]); // Log the selected ticker
            } else {
                setError("No data found for this ticker."); // Handle empty result
            }
        } catch (e) {
            setError(`Error Fetching: ${e.message}`);
            console.error("Fetch Error:", e); // Log the error for debugging
        } finally {
            setLoading(false); // Stop loading
        }
    };
    

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Searching for:", ticker);
        fetchData(ticker);
    };


    useEffect(() => {
        fetchData(ticker);
        console.log("USE EFFECT WORKS");
    }, []);
    
    return (
        <div className='search-container'>
            <SideMenu />
            <div className='Search-box'>
                <form className='search-form' onSubmit={handleSearch}>
                    <div className='search-input'>
                    
                        <input className='search-field'
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)} // Update search input
                            placeholder="Enter a Stock Ticker"
                        />
                        <button className='search-button' type="submit">Search</button>
                    </div>
                </form>
            </div>
            <Greeting />
        </div>
    );
}
