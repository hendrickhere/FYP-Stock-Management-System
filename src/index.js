import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginWrapper from './loginWrapper'; 
import Dashboard from './dashboard';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<LoginWrapper />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
