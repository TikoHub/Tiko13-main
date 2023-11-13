import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');

    // Dummy credentials, replace with actual user input
    const credentials = {
        username: 'Andrew',
        password: '12345'
    };

    // Function to log in and retrieve token
    const login = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/users/api/login/', credentials);
            const token = response.data.token;
            localStorage.setItem('token', token); // Store token in local storage
            setToken(token);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    // Function to fetch user details
    const fetchUserDetails = async () => {
        try {
            const config = {
                headers: { Authorization: `Token ${token}` }
            };
            const response = await axios.get('http://your-django-server.com/api/user-details/', config);
            setUsername(response.data.username); // Assuming the response has a username field
        } catch (error) {
            console.error('Fetching user details failed:', error);
        }
    };

    // Effect to log in and fetch user details on component mount
    useEffect(() => {
        login().then(() => {
            if (token) {
                fetchUserDetails();
            }
        });
    }, [token]);

    return (
        <div>
            <h1>Welcome {username}</h1>
        </div>
    );
};

export default App;
