import React, { useState } from 'react';
import './dashboard.css'; 

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <MainContent />
    </div>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        <li>Dashboard</li>
        <li>Inventory</li>
        <li>Sales</li>
        <li>Purchases</li>
        <li>Stakeholders</li>
        <li>Appointments</li>
        <li>Logout</li>
      </ul>
    </nav>
  );
}

function MainContent() {
  return (
    <div className="main-content">
      <Header />
      <Overview />
      <SalesOrders />
      <KPIs />
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1>Manager Dashboard - John Doc</h1>
    </header>
  );
}

function Overview() {
  return (
    <div className="overview">
      <h2>Stock Report</h2>
      {/* Placeholder for graph */}
      <div className="stock-graph">Graph here</div>
    </div>
  );
}

function SalesOrders() {
  return (
    <div className="sales-orders">
      <h2>Sales Order Summary</h2>
      {/* Placeholder for sales orders data */}
      <table>
        {/* Table rows and cells */}
      </table>
    </div>
  );
}

function KPIs() {
  return (
    <div className="kpis">
      <div>Today's Sale: RM10,000</div>
      <div>Registered Customers: 2,000</div>
      <div>Products: 498</div>
      <div>Daily Appointments: 15</div>
      <div>Fast Moving Items: Battery 1, Battery 2</div>
    </div>
  );
}

export default Dashboard;
