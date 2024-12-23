import React, { createContext, useContext, useState } from 'react';

const TickerContext = createContext();

export const TickerProvider = ({ children }) => {
    const [selectedTicker, setSelectedTicker] = useState(null);

    return (
        <TickerContext.Provider value={{ selectedTicker, setSelectedTicker }}>
            {children}
        </TickerContext.Provider>
    );
};

export const useTicker = () => useContext(TickerContext);
