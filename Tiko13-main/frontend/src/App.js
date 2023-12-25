import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [amount, setAmount] = useState('');

  const handleDeposit = async () => {
    try {
      // Replace this URL with the endpoint for creating a Stripe session in your backend
      const response = await axios.post('http://127.0.0.1:8000/users/wallet/deposit/', { amount }, {
        headers: {
          // Add authorization token here
          'Authorization': `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1OCwidXNlcm5hbWUiOiJraWxsdWExODc0IiwiZXhwIjoxNzA0MDY1ODU4LCJlbWFpbCI6Im9uZW1haWxuZXZlcmVub3VnaEBnbWFpbC5jb20iLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwianRpIjoiY2RlYjhjYzktMDdjNy00NTkyLWE4NWMtOGIzY2ZmYzg1MmIyIiwiaWF0IjoxNzAzNDYxMDU4fQ.SOazvfJ75pBo-irwU8_LOBW8bIIqADBLDG8N_24WPEo`
        }
      });

      if (response.data.url) {
        // Redirect to Stripe checkout page
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error during deposit:', error);
    }
  };

  return (
    <div className="App">
      <h1>Wallet Deposit</h1>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount to deposit"
      />
      <button onClick={handleDeposit}>Deposit</button>
    </div>
  );
}

export default App;
