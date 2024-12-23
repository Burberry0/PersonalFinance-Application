import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, useAuth } from './AuthProvider';

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const [isTokenVerified, setIsTokenVerified] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        console.log("Token being sent to /verify-token:", typeof token, token);  // Check token type and content

        if (token) {
            fetch("http://localhost:8000/verify-token", {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Invalid token");
                }
                return response.json();
            })
            .then(data => {
                console.log("Token is valid:", data);
                setIsTokenVerified(true);
            })
            .catch(error => {
                console.error("Error verifying token:", error);
                navigate('/login');
            });
        } else {
            console.error("No token found");
            navigate('/login');
        }
    }, [navigate]);

    if (!isAuthenticated || !isTokenVerified) {
        return <div>Loading...</div>;
    }

    return children;
};

export default ProtectedRoute;
