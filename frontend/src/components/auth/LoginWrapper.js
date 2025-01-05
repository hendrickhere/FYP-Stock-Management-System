import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../../context/GlobalContext';
import { login } from '../../utils/auth';

const LoginWrapper = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { isAuthenticated, setIsAuthenticated, sessionMessage, setSessionMessage } = useContext(GlobalContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials);
      setIsAuthenticated(true);
      setSessionMessage('');
      navigate('/dashboard');
    } catch (error) {
      setSessionMessage(error.response?.data?.message || 'Login failed');
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      {sessionMessage && (
        <div className="session-message" role="alert">
          {sessionMessage}
        </div>
      )}
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Username"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Password"
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginWrapper;
