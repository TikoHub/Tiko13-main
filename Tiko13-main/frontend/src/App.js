import axios from 'axios';
import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import './App.css';
import Logo from './a.svg'
import Home from './icon-home.svg'
import Library from './icon-library.svg'
import History from './icon-history.svg'
import Book from './icon-book.svg'
import Drop from './drop.svg'
import Setting from './icon-setting.svg'
import Help from './icon-help.svg'
import Avatar from './avatart.svg'
import Search from './seach.svg'
import Google from './google.svg'
import Face from './face.svg'



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/step1" element={<RegisterStep1 />} />
        <Route path="/step2" element={<RegisterStep2 />} />
      </Routes>
    </Router>
  );
}



function Login () {
    const token = localStorage.getItem('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const history = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);


    // Set the token in the request headers if it e xists
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }


    const handleLogin = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/users/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      history.push('/');
    } else {
      console.error('Failed to login');
    }
  } catch (error) {
    console.error('There was an error logging in:', error);
  }
};





  return (
      <div className='formContainer'>
          <div className='formWrapper'>
          <Link to='/'><span className='logo-register'><img src={Logo}></img></span></Link>
              <span className='google'><div className='google_button'><a className='google-button'><img className='google_icon' src={Google}></img>Sign in via Google</a></div></span>
              <span className='google'><div className='face_button'><a className='face-button'><img className='face_icon' src={Face}></img>Sign in via Facebook</a></div></span>
              <hr className='login_hr'></hr>
              <form className='log-form'>
                  <input type="email" placeholder='email' className='em-log' value={email} onChange={e => setEmail(e.target.value)}/>
                  <input type="password" placeholder='password' className='pas-log' value={password} onChange={e => setPassword(e.target.value)}/>
                  <span ><a className='forgot-log'>Forgot Password?</a></span>
                  <Link to="/step1" className="create-log">Create Account</Link>
                  {loggedIn ? (<p>Вы вошли в систему! Перенаправление...</p>
      ) : (<button type='button' className='button-log' onClick={handleLogin}>Sign in</button>)}
              </form>
          </div>
      </div>
  )
}

function RegisterStep1(props) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth_month: '',
    date_of_birth_year: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here, we make the POST request to the backend
    fetch('/users/register_step1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include any other headers like authentication tokens if necessary
      },
      body: JSON.stringify(formData),
      credentials: 'include' // Necessary for sessions to work properly
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // On success, move to step 2
      props.history.push('/register/step2');
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  };

  return (
    <div>
      <h2>Register - Step 1</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="First Name"
          required
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Last Name"
        />
        <input
          type="number"
          name="date_of_birth_month"
          value={formData.date_of_birth_month}
          onChange={handleChange}
          placeholder="Month of Birth"
        />
        <input
          type="number"
          name="date_of_birth_year"
          value={formData.date_of_birth_year}
          onChange={handleChange}
          placeholder="Year of Birth"
        />
        <button type="submit">Next Step</button>
      </form>
    </div>
  );
}




function RegisterStep2(props) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here, we make the POST request to the backend
    fetch('/users/register_step2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include any other headers like authentication tokens if necessary
      },
      body: JSON.stringify(formData),
      credentials: 'include' // Necessary for sessions to work properly
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // On success, redirect or perform another action
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  };

  return (
    <div>
      <h2>Register - Step 2</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        <input
          type="password"
          name="password2"
          value={formData.password2}
          onChange={handleChange}
          placeholder="Confirm Password"
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}









export default App;
