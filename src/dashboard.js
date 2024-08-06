import React, { useState } from 'react';
import './dashboard.css'; 
import Sidebar from './sidebar';
import Header from './header';


function Dashboard() {
  return (
    <div className="dashboard-container">
      <Header/> 
      <Sidebar />
      <MainContent />
    </div>
  );
}

function MainContent() {
  return (
    <div className='main-content-dashboard'>
    <div className="main-content-left">
      <Overview />
      <StockGraph/>
      <SalesOrders />
    </div>
    <div className='main-content-right'>
      <KPIs />
    </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="overview">
      <h2>Overview</h2>
    </div>
  );
}

function StockGraph() {
  return (
    <div className="stock-graph">Stock Graph</div>
  )
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
      <RegisteredCustomers />
      <TodaySales />
      <TotalProductsRegistered />
      <DailyAppointments />
      <FastMovingItems />
    </div>
  );
}

function RegisteredCustomers() {
    return (
      <div>Registered Customers: 2,000</div>
    );
}

function TodaySales() {
  return(
      <div>Today's Sale: RM10,000</div>
  );
}

function TotalProductsRegistered() {
  return(
      <div>Products: 498</div>
  );
}

function DailyAppointments() {
  return(
    <div>Daily Appointments: 15</div>
  );
}

function FastMovingItems() {
  return(
    <div>Fast Moving Items: Battery 1, Battery 2</div>
  );
}

export default Dashboard;
