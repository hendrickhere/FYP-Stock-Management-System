import React, { useState } from 'react';
import Sidebar from './sidebar';
import Header from './header';


function Dashboard() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header/> 
      <div className="flex flex-row flex-grow">
      <Sidebar />
      <MainContent />
      </div>
    </div>
  );
}

function MainContent() {
  return (
    <div className="flex 
                    flex-grow 
                    flex-row 
                    bg-gray-100 
                    ml-52
                    p-4
                    ">
    <div className="flex 
                    flex-col 
                    flex-grow 
                    pr-6">
      <Overview />
      <StockGraph/>
      <SalesOrders />
    </div>
    <div className="flex flex-col grow-0">
      <KPIs />
    </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="">
      <h2 className="font-bold text-2xl">Overview</h2>
    </div>
  );
}

function StockGraph() {
  return (
    <div className="bg-white p-6 mt-6 rounded-lg shadow-md flex-grow">Stock Graph</div>
  )
}

function SalesOrders() {
  return (
    <div className="bg-white p-6 mt-6 rounded-lg shadow-md flex-grow">
      <h2 className="font-bold text-lg">Sales Order Summary</h2>
      {/* Placeholder for sales orders data */}
      <table>
        {/* Table rows and cells */}
      </table>
    </div>
  );
}

function KPIs({label, value}) {
  return (
    <div className="text-blue-600 mb-4 p-4 bg-white rounded-lg shadow-md font-medium flex-grow">
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
