import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        const storedUsername = sessionStorage.getItem('username');
        
        if (storedToken && storedUsername) {
            setIsAuthenticated(true);
            setUsername(storedUsername);
            setToken(storedToken);  // Set token state if it exists in sessionStorage
        }
    }, []);

    const login = (tokenData) => {
        const { access_token, username, user_id } = tokenData;
        console.log("Storing token:", access_token);
        
        sessionStorage.setItem('token', access_token);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('user_id', user_id);  // Store user_id if needed

        setIsAuthenticated(true);
        setUsername(username);
        setToken(access_token);  // Update token state
        console.log("User logged in");
    };
    
    const logout = () => {
        sessionStorage.clear();  // Clear all stored session data
        setIsAuthenticated(false);
        setUsername(null);
        setToken(null);  // Clear token state
        console.log("User logged out");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, username, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
