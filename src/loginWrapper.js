// loginWrapper.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './login'

function LoginWrapper() {
  const navigate = useNavigate();
  return <Login navigate={navigate} />;
}

export default LoginWrapper;
