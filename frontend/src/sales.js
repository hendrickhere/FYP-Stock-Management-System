import React from "react";
import './sales.css';
import Header from './header';
import Sidebar from './sidebar';

function Sales() {
  return (
    <div className="sales-container">
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

export default Sales