import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginWrapper from './loginWrapper'; 
import Dashboard from './dashboard';
import Inventory from './inventory';
import Sales from './sales';
import Purchases from './purchases';
import Customers from '../src/customer_module/customers'; 
import Vendors from '../src/vendor_module/vendors';    
import Staff from '../src/staff_module/staff';
import Appointments from './appointments_module/appointments';
import AddSales from './add_sales';
import AddInventory from './add_inventory';
import AddPurchases from './add_purchases';
import AddVendor from './vendor_module/add_vendor';
import AddCustomer from './customer_module/add_customer';
import AddStaff from './staff_module/add_staff';
import AddAppointment from './appointments_module/add_appointment';
import Profile from './profile';
import { GlobalProvider } from './globalContext';
import Chatbot from './chatbotUI/chatbot';
import './styles/tailwind.css';
import './styles/login.css';

ReactDOM.render(
  <React.StrictMode>
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginWrapper />} />
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/sales/add_sales" element={<AddSales />} />
          <Route path="/inventory/add_inventory" element={<AddInventory/>} />
          <Route path="/chatbot" element={<Chatbot/>} />
          <Route path="/purchases/add_purchases" element={<AddPurchases/>} />
          <Route path="/vendors/add_vendor" element={<AddVendor/>} />
          <Route path="/staff/add_staff" element={<AddStaff/>} />
          <Route path="/customers/add_customer" element={<AddCustomer/>} />
          <Route path="/appointments/add_appointment" element={<AddAppointment/>} />
          <Route path="/profile" element={<Profile/>} />
        </Routes>
      </Router>
    </GlobalProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
