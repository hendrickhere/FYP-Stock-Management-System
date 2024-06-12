import React from "react";
import './styles/purchases.css';
import Header from './header';
import Sidebar from './sidebar';

function Purchases() {
  return (
    <div className="purchases-container">
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

export default Purchases