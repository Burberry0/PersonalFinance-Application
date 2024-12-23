import React, { useState, useEffect } from "react";
import './Wallet.css';

export default function Wallet() {


    const currentUserId = sessionStorage.getItem('user_id');  // Get the current user_id
    console.log("current userID", currentUserId);
    const [amountToAdd, setAmountToAdd] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);  // To display success message
    const [wallet, setWallet] = useState({
        purchasing_power: 0,
        holding_value: 0,
        total_value: 0,
    });
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");

    console.log("Wallet in Wallet component:", wallet);  // Log wallet data to verify
    console.log("current user in wallet", currentUserId);

    useEffect(() => {
    
        const fetchWallet = async() => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:8000/${currentUserId}/wallet`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const result = await response.json();
                setWallet(result);
            } catch (error) {
                console.error("Error fetching wallet", error);
            }
        };
        

        const fetchUsers = async () => {
            try {
                const response = await fetch(`http://localhost:8000/users`);
                const usersList = await response.json();
                setUsers(usersList);  // Set the fetched users
            } catch (error) {
                console.error("Error fetching users", error);
            }
        };



        fetchWallet();
        fetchUsers();
    
    }, [currentUserId]);


    const handleTransfer = async() => {
        setError(null);
        setSuccess(null);

        if (amountToAdd <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (!selectedUser) {
            setError("Please select a user to send money to.");
            return;
        }

        console.log("Selected user for transfer:", selectedUser);
        console.log({
            from_user_id: currentUserId,
            to_username: selectedUser,
            amount: amountToAdd,
        });


        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/wallet/transfer`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,

                },
                body: JSON.stringify({
                    from_user_id: Number(currentUserId),  // Assuming the sender's user_id is 1 (Replace with actual logic)
                    to_username: selectedUser,  // Selected user from the dropdown
                    amount: amountToAdd,
                }),
            });


            if (!response.ok) {
                const errorData = await response.json();
                console.error("Transfer error:", errorData);  // Log the error message from the backend
                setError("Failed to transfer money. Please check the inputs.");
                return;
            }

            const updatedWallet = await response.json();
            console.log("Response from transfer:", updatedWallet);  // Log the response to see the structure
            setSuccess("Money successfully sent!");
            setAmountToAdd(0);  

        } catch(error) {
            console.error("error sending money to", error);
            setError("error transferring money")
        }


    }

    const handleClick = async () => {
        setError(null);  // Reset error state
        setSuccess(null);  // Reset success state

        if (amountToAdd <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/wallet`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,

                },
                body: JSON.stringify({
                    amount: amountToAdd,
                }),
            });

            if (!response.ok) {
                throw new Error("Error adding money");
            }

            const updatedWallet = await response.json();
            console.log("Updated Wallet:", updatedWallet);  // Log the updated wallet info
            setSuccess("Money successfully added!");
            setAmountToAdd(0);  // Reset input after success

            // Handle success (e.g., update the wallet state in the parent component)

        } catch (error) {
            console.error("Error:", error);
            setError("Error adding money to wallet.");
        }
    };

    return (
        <div className="wallet-container">
            <h2 class="wallet-title">Wallet</h2>
                <p className="wallet-info">Purchasing Power: ${wallet.purchasing_power.toFixed(2)}</p>
                <p className="wallet-info">Holding Value: ${wallet.holding_value.toFixed(2)}</p>
                <p className="wallet-info">Total Value: ${wallet.total_value.toFixed(2)}</p>
            
            <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(Number(e.target.value))}
                placeholder="Enter amount"
            />


            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="">Select a user</option>
                {users.map(user => (
                    <option key={user.id} value={user.username}>
                        {user.username}  {/* Assuming your user model has a username field */}
                    </option>
                ))}
            </select>
            


            <div className="wallet-buttons">

                <button onClick={handleClick} className="button"> Add </button>
                <button onClick={handleTransfer} className="button"> Send </button>

            </div>
            

            {success && <p className="success">{success}</p>}
        </div>
    );
}
