import React, { useEffect, useState } from 'react';
import { FaRegCircleUser } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";

function Header() {

  const [username, setUsername] = useState('token');
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage
        console.log("Token:", token); // Debugging line to check if the token is fetched properly
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch('/api/user/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log("User data fetched:", data); // Debugging line to see what data is returned
          setUsername(data.username); 
        } else {
          console.error('Failed to fetch user data, response status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchCurrentUser();
  }, []);

  return (
    <header className="flex justify-between items-center p-5 bg-white max-h-20">
      <div className="flex items-center space-x-4">
        <FaRegCircleUser className="user-icon w-8 h-8"/>
        <span className="font-semibold text-xl">{username}</span>
      </div>
      <div className="flex items-center">
        <button className="notification">
          <IoIosNotificationsOutline className="w-8 h-8 mt-1" />
        </button>
        <button className="chat">
          <IoChatbubbleEllipsesOutline className="w-7 h-7 ml-5" />
        </button>
        <img src={require('./logo.png')} alt="Logo" className="w-12 h-12 ml-5"/>
        <span className="text-2xl font-bold ml-1">StockSavvy</span>
      </div>
    </header>
  );
}

export default Header;
