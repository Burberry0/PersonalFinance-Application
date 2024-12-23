import React, {useState, useEffect} from "react";
import "/Users/brandonkohler/react-ec/app/src/App.css";

export default function UserTransactions() {
    const [userTransactions, setUserTransactions] = useState([]);
    const currentUserId = sessionStorage.getItem('user_id');  // Get the current user_id
    const [userData, setUserData] = useState();
    const [transactionType, setTransactionType] = useState('portfolio'); // State to track the selected transaction type
    
    
    function handleClick(type) {
        setTransactionType(type);
    }



    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/transactions`, {
                method: "GET",
                mode: 'cors',
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();
            setUserTransactions(result);


            console.log("Transaction result:", result);

        } catch(error) {
            console.error("Error getting transactins", error);
        }
    };


    const fetchTransfers = async() => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/${currentUserId}/WalletTrans`, {
                method: "GET",
                mode: 'cors',
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();
            setUserTransactions(result);


            console.log("Transaction result:", result);

        } catch(error) {
            console.error("Error getting transactins", error);
        }
    };
    
    
    useEffect(() => {
        if (transactionType === 'portfolio') {
            fetchTransactions();
        } else if (transactionType === 'transfers') {
            fetchTransfers();
        }
    }, [transactionType, currentUserId]);
    
    
    return (
        <div className="Transaction-container">
            <div className="trans-button-group">
                <button onClick={() => handleClick('portfolio')}>Portfolio Transactions</button>
                <button onClick={() => handleClick('transfers')}>Transfers</button>
            </div>

            <div className="table-container">
                {userTransactions.length > 0 ? (
                    transactionType === 'portfolio' ? (
                        // Portfolio Transactions Table
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Transaction Type</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{transaction.ticker}</td>
                                        <td>{transaction.quantity}</td>
                                        <td>{transaction.price}</td> {/* Formatting price to 2 decimals */}
                                        <td>{transaction.transaction_type}</td>
                                        <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        // Transfers Table
                        <table>
                            <thead>
                                <tr>
                                    <th>From User ID</th>
                                    <th>To User ID</th>
                                    <th>Amount</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userTransactions.map((transfer) => (
                                    <tr key={transfer.id}>
                                        <td>{transfer.from_user_id}</td>
                                        <td>{transfer.to_user_id}</td>
                                        <td>{transfer.amount}</td> {/* Formatting amount to 2 decimals */}
                                        <td>{new Date(transfer.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    <p>No transactions found.</p>
                )}
            </div>
        </div>
    );
}