import React from "react";
import './stakeholders.css';
import Header from './header';
import Sidebar from './sidebar';

function Stakeholders() {
  return (
    <div className="stakeholders-container">
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

export default Stakeholders