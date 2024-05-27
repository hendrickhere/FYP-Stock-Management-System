import React, { useState } from 'react';
import './login.css'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  // State variables to handle user inputs and form status
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();

  // Update state based on form input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'name') setName(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'password') setPassword(value);
    else if (name === 'role') setRole(value);
  };

  // Toggle the visibility of Sign Up and Sign In forms
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    const container = document.getElementById('container');
    if (isSignUp) container.classList.add("active");
    else container.classList.remove("active");
  }

  // Handle form submission for both sign up and sign in
  const handleSubmit = async (event) => {
    event.preventDefault();
    const userData = {
      username: name, 
      email,
      password,
      role
    };

    try {
      const endpoint = isSignUp ? 'signup' : 'login';
      const response = await axios.post(`http://localhost:3001/api/${endpoint}`, userData);
      if (response.data.message === 'User created') {
        alert('Signup successful, please log in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setName('');
      } else if (response.data.message === 'Login successful') {
        alert('Login successful!');
        navigate('/dashboard');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error logging in:", error.response ? error.response.data : error.message);
      alert(`Error: ${error.response ? error.response.data.message : 'Network Error'}`);
    }
  }

    return (
      <div className="container" id="container">
        <div className={`form-container sign-up ${isSignUp ? '' : 'hidden'}`}>
          <form onSubmit={handleSubmit}>
            <h1>Create Account</h1>
              <fieldset id="switch" className="radio">
                <input name="switch" id="on" type="radio" onChange={() => setRole('Manager')} checked={role === 'Manager'}/>
                <label htmlFor="on">Manager</label>
                <input name="switch" id="off" type="radio" onChange={() => setRole('Staff')} checked={role === 'Staff'}/>
                <label htmlFor="off">Staff</label>
              </fieldset>
            <input type="text" name="name" placeholder="Name" value={name} onChange={handleInputChange} />
            <input type="email" name="email" placeholder="Email" value={email} onChange={handleInputChange} />
            <input type="password" name="password" placeholder="Password" value={password} onChange={handleInputChange} />
            <button id='post-register'>Sign Up</button>
          </form>
        </div>
        <div className={`form-container sign-in ${isSignUp ? 'hidden' : ''}`}>
          <form onSubmit={handleSubmit}>
            <h1>Sign In</h1>
            <input type="email" name="email" placeholder="Email" value={email} onChange={handleInputChange} />
            <input type="password" name="password" placeholder="Password" value={password} onChange={handleInputChange} />
            <a href="#">Forgot Your Password?</a>
            <button>Sign In</button>
          </form>
        </div>
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h2>Welcome Back!</h2>
              <p>Enter your personal details to use all of stock management features</p>
              <button className="hidden" id="login" onClick={() => toggleSignUp(false)}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h2>Hello!</h2>
              <p>Register with your personal details to use all of stock management features</p>
              <button className="hidden" id="register" onClick={() => toggleSignUp(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    );
}

export default Login;

