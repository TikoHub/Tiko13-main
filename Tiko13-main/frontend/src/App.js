import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  // Set the initial token state to your JWT token
  const [token, setToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo1OCwidXNlcm5hbWUiOiJraWxsdWExODc0IiwiZXhwIjoxNzA0MjMwOTY0LCJlbWFpbCI6Im9uZW1haWxuZXZlcmVub3VnaEBnbWFpbC5jb20iLCJ0b2tlbl90eXBlIjoiYWNjZXNzIiwianRpIjoiMTI2YzBmMmMtOTY1ZC00MDM5LTljYzEtODJkMjIzOGIzYzQ0IiwiaWF0IjoxNzAzNjI2MTY0fQ.JFI6XjIneU8snJeQUEFlH2qkEdofyKXbHmfjOA-1w-4');

  const handleFileChange = event => {
    setSelectedFile(event.target.files[0]);
  };

  const handleTokenChange = event => {
    setToken(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:8000/book/45/chapter/10/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log(response.data);
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error during file upload:', error);
      alert('Error during file upload');
    }
  };

  return (
    <div className="App">
      <h1>FB2 File Upload</h1>
      <div>
        <label>
          Token:
          <input type="text" value={token} onChange={handleTokenChange} />
        </label>
      </div>
      <div>
        <input type="file" onChange={handleFileChange} accept=".fb2" />
        <button onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
}

export default App;
