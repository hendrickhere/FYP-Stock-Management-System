import React, { useState } from 'react';
import './header.css';
import { FaRegCircleUser } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <FaRegCircleUser className='user-icon'/>
        <span>John Doe</span>
      </div>
      <div className='middle'></div>
      <div className='header-right'>
      <button className='notification'><IoIosNotificationsOutline className='notification-icon'/></button>
      <button className='chat'><IoChatbubbleEllipsesOutline className='chat-icon'/></button>
      <span className="system-name">StockSavvy</span>
      </div>
    </header>
  );
}

export default Header;