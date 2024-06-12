import React, { useState } from 'react';
import './styles/sidebar.css'
import { Link } from 'react-router-dom';
import { FaHome} from 'react-icons/fa';
import { MdOutlineInventory2 } from "react-icons/md";
import { AiOutlineStock } from "react-icons/ai";
import { BsCashCoin } from "react-icons/bs";
import { GrStakeholder, GrSchedules, GrLogout } from "react-icons/gr";

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        <li><Link to="/dashboard" className="nav-link"><FaHome className="sidebar-icon"/>Dashboard</Link></li>
        <li><Link to="/inventory" className="nav-link"><MdOutlineInventory2 className="sidebar-icon"/>Inventory</Link></li>
        <li><Link to="/sales" className="nav-link"><AiOutlineStock className="sidebar-icon"/>Sales</Link></li>
        <li><Link to="/purchases" className="nav-link"><BsCashCoin className="sidebar-icon"/>Purchases</Link></li>
        <li><Link to="/stakeholders" className="nav-link"><GrStakeholder className="sidebar-icon"/>Stakeholders</Link></li>
        <li><Link to="/appointments" className="nav-link-appointments"><GrSchedules className="sidebar-icon"/>Appointments</Link></li>
      </ul>
      <button className='logout'>
        <div className='sign'>
        <GrLogout className='logout-icon'/>
        </div>
        <div className="logout-text">Logout</div>
      </button>
    </nav>
  );
}

export default Sidebar;