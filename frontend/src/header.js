import React, { useEffect, useState } from 'react';
import { FaRegCircleUser } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';

function Header() {
  const [username, setUsername] = useState('user');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.log("No token found, redirecting to login");
          setIsLoading(false);
          // Redirect to login page if needed
          navigate('/login');
          return;
        }

        // Fetch user data
        const response = await axios.get('/user/current');
        if (response.status === 200) {
          const data = response.data;
          console.log("User data fetched:", data);
          setUsername(data.username);
        } else {
          console.error('Failed to fetch user data, response status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          // Token might be invalid or expired
          localStorage.removeItem('accessToken');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentUser();
  }, [navigate]);

      // Event handler to navigate to the Chatbot
    const handleChatClick = () => {
      navigate('/chatbot'); // Navigate to "/chatbot"
    };

    if (isLoading) {
    return <div className="flex justify-center items-center p-3 bg-white max-h-20">
      Loading...
    </div>;
    }
    
  return (
    <header className="flex justify-between items-center p-3 bg-white max-h-20">
      <div className="flex items-center space-x-4">
        <FaRegCircleUser className="user-icon w-8 h-8"/>
        <span className="font-semibold text-xl">{username}</span>
      </div>
      <div className="flex items-center">
        <button className="notification">
          <IoIosNotificationsOutline className="w-7 h-7 mt-1" />
        </button>
        <button className="chat" onClick={handleChatClick}>
          <IoChatbubbleEllipsesOutline className="w-6 h-6 ml-5" />
        </button>
        <img src={require('./logo.png')} alt="Logo" className="w-10 h-10 ml-5"/>
        <span className="text-xl font-bold ml-1">StockSavvy</span>
      </div>
    </header>
  );
}

export default Header;
