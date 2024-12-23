import React, { useState } from "react";
import './Login.css';
import { useNavigate } from "react-router-dom";


export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await createUser(username, password);
            navigate("/login");
        } catch (error) {
            alert("Signup failed: " + error.message);
        }
    };

    return (
        <div className="Login-Container">
            <div className="Login-wrapper">
                <h1>Sign up</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Create Username</p>
                        <input
                            type='text'
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </label>
                    <label>
                        <p>Create Password</p>
                        <input
                            type='password'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </label>
                    <div className="signup-button">
                        <button type='submit'>Signup</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

async function createUser(username, password) {
    const payload = { username, password };
    console.log("Sending payload:", payload);

    try {
        const response = await fetch('http://localhost:8000/signup', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // Ensure the payload is correct
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const responseBody = await response.text(); // Read the response as text first
            try {
                const errorData = JSON.parse(responseBody);
                console.error('Error response data:', errorData);
                throw new Error(`Sign up failure: ${errorData.detail || 'Unknown error'}`);
            } catch (e) {
                throw new Error(`Sign up failure: ${responseBody}`);
            }
        }

        // Read the response body as JSON if the request was successful

        const responseData = await response.json();
        console.log("Response body:", responseData);


    } catch (error) {
        console.error("Error during signup:", error);
        throw error;
    }
}
