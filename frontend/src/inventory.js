import React from "react";
import './inventory.css';
import Header from './header';
import Sidebar from './sidebar';

function Inventory() {
  return (
    <div className="inventory-container">
      <Header/>
      <Sidebar/>
      <MainContent/>
    </div>
  )
}

function MainContent () {
  return (
    <div></div>
  )
}

export default Inventory