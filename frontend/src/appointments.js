import React from "react";
import './appointments.css';
import Header from './header';
import Sidebar from './sidebar';

function Appointments() {
  return (
    <div className="appointments-container">
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

export default Appointments