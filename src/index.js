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

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory/>}/>
        <Route path="/sales" element={<Sales/>}/>
        <Route path="/purchases" element={<Purchases/>}/>
        <Route path="/stakeholders" element={<Stakeholders/>}/>
        <Route path="/appointments" element={<Appointments/>}/>
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
