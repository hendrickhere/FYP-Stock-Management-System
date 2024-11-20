import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from './login';
import Dashboard from './dashboard';
import { Alert, AlertDescription } from "./ui/alert";

function LoginWrapper() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessionMessage, setSessionMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 > Date.now()) {
                    setIsAuthenticated(true);
                    navigate('/dashboard');
                } else {
                    localStorage.clear();
                }
            } catch (error) {
                localStorage.clear();
            }
        }

        if (location.state?.message) {
            setSessionMessage(location.state.message);
            window.history.replaceState({}, document.title);
        }
    }, [location, navigate]);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    return (
        <>
            {sessionMessage && (
                <Alert className="fixed top-4 right-4 max-w-md bg-yellow-50 border-yellow-200 z-50">
                    <AlertDescription className="text-yellow-800">
                        {sessionMessage}
                    </AlertDescription>
                </Alert>
            )}
            {isAuthenticated ? <Dashboard /> : <Login onLoginSuccess={handleLoginSuccess} />}
        </>
    );
}

export default LoginWrapper;