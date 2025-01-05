import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../../context/GlobalContext';
import { login } from '../../utils/auth';

function Login({ onLoginSuccess }) {
  const { setUsername, setOrganizationId } = useContext(GlobalContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      setUsername(response.user.username);
      setOrganizationId(response.user.organizationId);
      onLoginSuccess && onLoginSuccess();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
