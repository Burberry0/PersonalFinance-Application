import React, { useEffect, useState } from "react";

export default function Financials({ selectedTicker }) {
    const [error, setError] = useState(null);
    const [financials, setFinancials] = useState([]);

    useEffect(() => {
        if (selectedTicker) {
            // Assuming selectedTicker contains financial information in `description`
            // In a real scenario, you'd fetch data here. For now, just use the existing data.
            setFinancials([selectedTicker]);
            setError(null);
        } else {
            setFinancials([]);
            setError("No ticker selected.");
        }
    }, [selectedTicker]);

    return (
        <div className="financials-container">
            {error && <p>{error}</p>}
            {financials.length > 0 ? (
                financials.map((item, index) => (
                    <div key={index} className="financial-item">
                        <p><strong>Description:</strong> {item.description || 'N/A'}</p>
                    </div>
                ))
            ) : (
                !error && <p>No financial data available.</p>
            )}
        </div>
    );
}
