import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginWrapper from './loginWrapper'; 
import Dashboard from './dashboard';
import Inventory from './inventory';
import Sales from './sales';
import Purchases from './purchases';
import Stakeholders from './stakeholders';
import Appointments from './appointments';
import AddSales from './add_sales';
import AddInventory from './add_inventory';
import AddPurchases from './add_purchases';
import AddVendor from './add_vendor';
import AddCustomer from './add_customer';
import AddStaff from './add_staff';
import AddAppointment from './add_appointment';
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
          <Route path="/stakeholders" element={<Stakeholders />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/sales/add_sales" element={<AddSales />}></Route>
          <Route path="/inventory/add_inventory" element={<AddInventory/>}></Route>
          <Route path="/chatbot" element={<Chatbot/>}></Route>
          <Route path="/purchases/add_purchases" element={<AddPurchases/>}></Route>
          <Route path="/stakeholders/add_vendor" element={<AddVendor/>}></Route>
          <Route path="/stakeholders/add_staff" element={<AddStaff/>}></Route>
          <Route path="/stakeholders/add_customer" element={<AddCustomer/>}></Route>
          <Route path="/appointments/add_appointment" element={<AddAppointment/>}></Route>
          <Route path="/profile" element={<Profile/>}></Route>
        </Routes>
      </Router>
    </GlobalProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
