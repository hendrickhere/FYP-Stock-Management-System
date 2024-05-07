import React, { Component } from 'react';
import './login.css'; 
import axios from 'axios';

class Login extends Component {
  // State variables to handle user inputs and form status
  state = {
    name: '',
    email: '',
    password: '',
    role: 'Staff', // Default role for the signup form
    isSignUp: false // Toggle between Sign Up and Sign In forms
  };

  // Update state based on form input changes
  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  // Toggle the visibility of Sign Up and Sign In forms
  toggleSignUp = (isSignUp) => {
    this.setState({ isSignUp });
    const container = document.getElementById('container');
    if (isSignUp) {
      container.classList.add("active");
    } else {
      container.classList.remove("active");
    }
  }

  // Handle form submission for both sign up and sign in
  handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, password, role, isSignUp } = this.state;
    // Prepare user data for submission based on form status
    const userData = isSignUp ? {
        username: name, 
        email,
        password,
        role
    } : {
        email,
        password
    };

    try {
      // Post data to the backend API and handle the response
      const response = await axios.post(`http://localhost:3001/api/${isSignUp ? 'signup' : 'login'}`, userData);
      const container = document.getElementById('container');
      if (response.data.message === 'User created') {
        // After successful signup, log the success and switch to login view
          this.setState({
            email: '',
            password: '',
            username: '',
            isSignUp: false
          });
          container.classList.remove("active");
        alert('Signup successful, please log in.');
      } else if (response.data.message === 'Login successful') {
        alert('Login successful!');
        this.props.navigate('/dashboard'); // Navigate to dashboard
      } else {
        // Alert on other responses (e.g., validation error)
        alert(response.data.message);
      }
    } catch (error) {
      // Handle errors in case of network issues or server errors
      alert(`Error: ${error.response ? error.response.data.message : 'Network Error'}`);
    }
};

  render() {
    return (
      <div className="container" id="container">
        <div className={`form-container sign-up ${this.state.isSignUp ? '' : 'hidden'}`}>
          <form onSubmit={this.handleSubmit}>
            <h1>Create Account</h1>
              <fieldset id="switch" class="radio">
                <input name="switch" id="on" type="radio" onChange={() => this.setState({ role: 'Manager' })} checked={this.state.role === 'Manager'}/>
                <label htmlFor="on">Manager</label>
                <input name="switch" id="off" type="radio" onChange={() => this.setState({ role: 'Staff' })} checked={this.state.role === 'Staff'}/>
                <label htmlFor="off">Staff</label>
              </fieldset>
            <input type="text" name="name" placeholder="Name" value={this.state.name} onChange={this.handleInputChange} />
            <input type="email" name="email" placeholder="Email" value={this.state.email} onChange={this.handleInputChange} />
            <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={this.handleInputChange} />
            <button id='post-register'>Sign Up</button>
          </form>
        </div>
        <div className={`form-container sign-in ${this.state.isSignUp ? 'hidden' : ''}`}>
          <form onSubmit={this.handleSubmit}>
            <h1>Sign In</h1>
            <input type="email" name="email" placeholder="Email" value={this.state.email} onChange={this.handleInputChange} />
            <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={this.handleInputChange} />
            <a href="#">Forgot Your Password?</a>
            <button>Sign In</button>
          </form>
        </div>
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h2>Welcome Back!</h2>
              <p>Enter your personal details to use all of stock management features</p>
              <button className="hidden" id="login" onClick={() => this.toggleSignUp(false)}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h2>Hello!</h2>
              <p>Register with your personal details to use all of stock management features</p>
              <button className="hidden" id="register" onClick={() => this.toggleSignUp(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;

