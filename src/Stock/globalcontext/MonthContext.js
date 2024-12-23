// MonthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const MonthContext = createContext();

// Provider component
export const MonthProvider = ({ children }) => {
    const [formattedMonth, setFormattedMonth] = useState(null);


    useEffect(() => {
        console.log("Formatted month in context updated:", formattedMonth); // Log whenever formattedMonth changes
    }, [formattedMonth]);

    return (
        <MonthContext.Provider value={{ formattedMonth, setFormattedMonth }}>
            {children}
        </MonthContext.Provider>
    );
};

export const useMonthContext = () => useContext(MonthContext);

