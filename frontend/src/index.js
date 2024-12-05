import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginWrapper from './loginWrapper'; 
import Dashboard from './dashboard';
import Inventory from './inventory_module/inventory';
import Sales from './sales_module/sales';
import Purchases from './purchases_module/purchases';
import Customers from '../src/customer_module/customers'; 
import Vendors from '../src/vendor_module/vendors';    
import Staff from '../src/staff_module/staff';
import Appointments from './appointments_module/appointments';
import AddSales from './sales_module/add_sales';
import AddInventory from './inventory_module/add_inventory';
import AddPurchases from './purchases_module/add_purchases';
import AddVendor from './vendor_module/add_vendor';
import AddCustomer from './customer_module/add_customer';
import AddAppointment from './appointments_module/add_appointment';
import Profile from './profile';
import Settings from './settings_module/settings';
import { GlobalProvider } from './globalContext';
import Chatbot from './chatbotUI/chatbot';
import { ProtectedRoute } from './token_expiration_module/protectedRoute';
import './styles/tailwind.css';
import './styles/index.css';

ReactDOM.render(
  <React.StrictMode>
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginWrapper />} />
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          } />
          <Route path="/purchases" element={
            <ProtectedRoute>
              <Purchases />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/vendors" element={
            <ProtectedRoute>
              <Vendors />
            </ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute>
              <Staff />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="/sales/add_sales" element={
            <ProtectedRoute>
              <AddSales />
            </ProtectedRoute>
          } />
          <Route path="/inventory/add_inventory" element={
            <ProtectedRoute>
             <AddInventory/>
            </ProtectedRoute>
          } />
          <Route path="/chatbot" element={
            <ProtectedRoute>
             <Chatbot/>
            </ProtectedRoute>
          } />
          <Route path="/purchases/add_purchases" element={
            <ProtectedRoute>
              <AddPurchases/>
            </ProtectedRoute>
          } />
          <Route path="/vendors/add_vendor" element={
            <ProtectedRoute>
             <AddVendor/>
            </ProtectedRoute>
          } />
          <Route path="/customers/add_customer" element={
            <ProtectedRoute>
             <AddCustomer/>
            </ProtectedRoute>
          } />
          <Route path="/appointments/add_appointment" element={
            <ProtectedRoute>
             <AddAppointment/>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile/>
            </ProtectedRoute>
          } />
          <Route path="/settings/*" element={
            <ProtectedRoute>
             <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </GlobalProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
