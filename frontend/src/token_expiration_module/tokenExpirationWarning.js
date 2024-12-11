import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "../ui/alert";
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react'; 

const TOKEN_EXPIRY_WARNING = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export const TokenExpirationWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const timeUntilExpiry = expiryTime - Date.now();

        if (timeUntilExpiry <= 0) {
          localStorage.clear();
          navigate('/login', { 
            state: { message: 'Your session has expired. Please log in again.' }
          });
        } else if (timeUntilExpiry <= TOKEN_EXPIRY_WARNING && !isDismissed) {
          setShowWarning(true);
          setTimeLeft(Math.ceil(timeUntilExpiry / 60000));
        } else {
          setShowWarning(false);
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        localStorage.clear();
        navigate('/login');
      }
    };

    const interval = setInterval(checkTokenExpiration, TOKEN_CHECK_INTERVAL);
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [navigate, isDismissed]); 

  // Handler for dismissing the warning
  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <Alert className="fixed bottom-4 right-4 max-w-md bg-yellow-50 border-yellow-200 z-50 m-2">
      <div className="flex justify-between items-center">
        <AlertDescription className="text-yellow-800">
          Your session will expire in {timeLeft} {timeLeft === 1 ? 'minute' : 'minutes'}. Please save your work.
        </AlertDescription>
        <button
          onClick={handleDismiss}
          className="ml-4 p-1 hover:bg-yellow-100 rounded-full transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4 text-yellow-800" />
        </button>
      </div>
    </Alert>
  );
};