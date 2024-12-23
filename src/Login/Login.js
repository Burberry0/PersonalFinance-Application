import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from './AuthProvider';  // Import the useAuth hook

async function loginUser(credentials) {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
        const response = await fetch("http://localhost:8000/token", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Login failed with status: ${response.status}");
        }

        const data = await response.json();

        // Ensure data has the expected structure
        if (!data.access_token) {
            throw new Error("Response is missing access_token");
        }

        console.log("Backend response:", data);
        return {
            access_token: data.access_token,
            username: data.username,
            user_id: data.user_id
        };
    } catch (error) {
        console.error("Error in loginUser:", error);
        throw error;
    }
}



async function getStatus(token, user_id) {
    return fetch(`http://localhost:8000/${user_id}/status`, {
        method: "GET",
        headers: {
            'Authorization': `Bearer: ${token}`
        }
    }).then(response => {
        if(!response.ok) throw new Error("failed to fetch");
        return response.json();
    });
}

    

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();  // Get the login function from AuthContext
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const { token } = useAuth();



    const handleSignup = () => {
        navigate('/signup');  // Navigate to signup page
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(false);
        try {
            const tokenData = await loginUser({ username, password });
            console.log("Token received:", token);  // Debug the token received
            login(tokenData);  // Call the login function with the token and username
            setIsLoggedIn(true);  // Mark as logged in to trigger useEffect

        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed");
        }
    };



    useEffect(() => {
        async function checkformStatus() {
            try {
                const user_id = sessionStorage.getItem('user_id');
                if (!user_id || !token) {
                    console.error("Missing token or user_id");
                    return;
                }
    
                const response = await getStatus(token, user_id);
                console.log("Status response:", response);  // Debug the response structure
    
                const data = response;
                console.log("Data structure:", data);

    
                if (data[0] === true) {
                    navigate("/");
                    console.log("condition-worked")

                } else {
                    navigate("/Savings-plan");
                    console.log("condition-failed")

                }
            } catch (error) {
                console.error("Failed to fetch status", error);
            }
        }
    
        if (isLoggedIn && token) {
            checkformStatus();
        }
    }, [isLoggedIn, token, navigate]);
    
    


    return (
        <div className="Login-Container">
            <div className="Login-wrapper">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Username</p>
                        <input type="text" onChange={e => setUsername(e.target.value)} />
                    </label>
                    <label>
                        <p>Password</p>
                        <input type="password" onChange={e => setPassword(e.target.value)} />
                    </label>
                
                    <div className="login-button-group">
                        <button type="submit"> Login </button>
                        <button type="button" onClick={handleSignup}>Signup</button>

                    </div>
                </form>       
            </div>
        </div>
    );
}