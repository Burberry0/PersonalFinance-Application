import React from 'react';
import { useAuth } from '../Login/AuthProvider';

const Greeting = () => {
    const { username } = useAuth();

    return (
        <div>
            <div className='user-name'><h1>{username}</h1></div>
        </div>
    );
}

export default Greeting;
