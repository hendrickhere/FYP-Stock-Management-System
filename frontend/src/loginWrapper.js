import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './login'
import Dashboard from './dashboard'

function LoginWrapper() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    return isAuthenticated ? <Dashboard /> : <Login onLoginSuccess={handleLoginSuccess} />;
}

export default LoginWrapper;