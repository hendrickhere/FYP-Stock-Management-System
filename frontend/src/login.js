import React, { useState, useContext } from 'react';
import './styles/index.css'; 
import instance from './axiosConfig';
import { useNavigate } from 'react-router-dom';
import styles from './styles/login.module.css';
import { GlobalContext } from './globalContext';
import logoImage from './logo.png';

  const ConfirmationModal = ({ isOpen, message, onClose, title }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#3B1E54] mb-4">
            {title || "Success"}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#38304C] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all duration-300"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

function Login({ onLoginSuccess }) {
  const {username, setUsername} = useContext(GlobalContext);
  
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const [role, setRole] = useState('Staff');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const navigate = useNavigate();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (isSignUp) {
      setSignUpData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear the specific error when user starts typing
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      
      // Real-time validation
      if (name === 'email' && value && !validateEmail(value)) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      }
      if (name === 'password' && value && !validatePassword(value)) {
        setFormErrors(prev => ({
          ...prev,
          password: 'Password must be at least 6 characters'
        }));
      }
    } else {
      setSignInData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear the specific error when user starts typing
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      
      // Real-time validation for login
      if (name === 'email' && value && !validateEmail(value)) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      }
    }
    if (name === 'role') setRole(value);
  };

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: ''
  });

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setFormErrors({}); // Clear form errors when switching modes
    const container = document.getElementById('container');
    if (isSignUp) {
      container.classList.remove("active");
    } else {
      container.classList.add("active");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setFormErrors({}); 
    
    const formData = isSignUp ? signUpData : signInData;
    if (!validateForm(isSignUp, formData)) {
      setIsLoading(false);
      return;
    }
    
    const userData = {
      username: isSignUp ? signUpData.name : signInData.email,
      created_at: new Date().toISOString(),
      email: isSignUp ? signUpData.email : signInData.email,
      password: isSignUp ? signUpData.password : signInData.password,
      role,
    };

    try {
      const endpoint = isSignUp ? 'signup' : 'login';
      const response = await instance.post(`/user/${endpoint}`, userData);
      
      if (response.data.message === 'User created') {
        setModalTitle('Account Created');
        setModalMessage('Sign up successful! Please log in with your new account.');
        setModalOpen(true);
        setIsSignUp(false);
        setSignUpData({ name: '', email: '', password: '' });
        setSignInData({ email: '', password: '' });
      } else if (response.data.message === 'Login successful') {
        // Store user data
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('organization_id', response.data.user.organization_id);

        const userData = {
          username: response.data.user.username,
          role: response.data.user.role  
        };
        sessionStorage.setItem('userData', JSON.stringify(userData));
        
        setUsername(response.data.user.username);
        
        setModalTitle('Welcome Back');
        setModalMessage('Login successful! Redirecting to dashboard...');
        setModalOpen(true);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred. Please try again.';
      
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'Invalid email or password.';
          } else if (error.response.data && error.response.data.message) {
            // Use the specific error messages from the backend
            errorMessage = error.response.data.message;
          }
        }
      
      setModalTitle('Error');
      setModalMessage(errorMessage);
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const Logo = () => (
    <img 
      src={logoImage}
      alt="StockSavvy Logo"
      className={styles.logoSvg}
    />
  );

  const validateForm = (isSignUp, data) => {
    const errors = {};
    
    // Email validation
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Name validation for signup
    if (isSignUp && !data.name) {
      errors.name = 'Name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const MobileHeader = () => (
    <div className={styles.mobileHeader}>
      <Logo />
      <h1 className="text-lg font-semibold text-[#3B1E54] text-center">
        Welcome to StockSavvy
      </h1>
    </div>
  );

  const MobileNav = ({ isSignUp, onToggle }) => (
    <div className={styles.mobileNav}>
      <button
        onClick={() => onToggle(false)}
        className={`${styles.mobileNavButton} ${!isSignUp ? styles.active : ''}`}
      >
        Sign In
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`${styles.mobileNavButton} ${isSignUp ? styles.active : ''}`}
      >
        Sign Up
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className={styles.mobileBg} />
      <div 
        className={`flex bg-white rounded-[30px] relative overflow-hidden w-[768px] max-w-full min-h-[480px] ${styles.container} ${isSignUp ? styles.active : ''}`} 
        id="container"
      >
        <div className="md:hidden">
          <MobileHeader />
          <MobileNav isSignUp={isSignUp} onToggle={toggleSignUp} />
        </div>
      
        <div className={`absolute top-0 h-full w-1/2 ${styles.signUpContainer} ${styles.formContainer}`}>
          <form onSubmit={handleSubmit} className="bg-white flex flex-col items-center justify-center h-full px-6 md:px-10">
            <h1 className="text-2xl font-bold mb-8 text-[#3B1E54]">Create Account</h1>
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setRole('Manager')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  role === 'Manager'
                    ? 'bg-[#3B1E54] text-white'
                    : 'bg-white text-[#3B1E54] border-2 border-[#3B1E54]'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setRole('Staff')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  role === 'Staff'
                    ? 'bg-[#3B1E54] text-white'
                    : 'bg-white text-[#3B1E54] border-2 border-[#3B1E54]'
                }`}
              >
                Staff
              </button>
            </div>

            <div className="w-full space-y-4">
              <div>
                <input 
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={signUpData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-[#F8F7FF] border ${formErrors.name ? 'border-red-500' : 'border-0'} p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#3B1E54] outline-none transition-all duration-300`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <input 
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={signUpData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-[#F8F7FF] border ${formErrors.email ? 'border-red-500' : 'border-0'} p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#3B1E54] outline-none transition-all duration-300`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <input 
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signUpData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-[#F8F7FF] border ${formErrors.password ? 'border-red-500' : 'border-0'} p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#3B1E54] outline-none transition-all duration-300`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
            <button 
              disabled={isLoading}
              className="mt-6 w-full max-w-[200px] bg-[#38304C] text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <div className={`absolute top-0 h-full w-1/2 ${styles.signInContainer} ${styles.formContainer}`}>
          <form onSubmit={handleSubmit} className="bg-white flex flex-col items-center justify-center h-full px-6 md:px-10">
            <h1 className="text-2xl font-bold mb-8 text-[#3B1E54]">Sign In</h1>

            <div className="w-full space-y-4">
              <div>
                <input 
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={signInData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-[#F8F7FF] border ${formErrors.email ? 'border-red-500' : 'border-0'} p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#3B1E54] outline-none transition-all duration-300`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <input 
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signInData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-[#F8F7FF] border ${formErrors.password ? 'border-red-500' : 'border-0'} p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#3B1E54] outline-none transition-all duration-300`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
            <a href="#" className="text-[#3B1E54] text-sm mt-4 hover:underline">
              Forgot Your Password?
            </a>
            <button 
              disabled={isLoading}
              className="mt-6 w-full max-w-[200px] bg-[#38304C] text-white py-3 px-6 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden ${styles.toggleContainer} z-[5]`}>
          <div className="relative -left-full h-full w-[200%] transition-transform duration-600 ease-in-out bg-gradient-to-r from-[#38304C] to-[#B9B4C7]">
            <div className={`absolute w-1/2 h-full flex items-center justify-center flex-col px-6 md:px-8 text-center ${styles.togglePanel}`}>
              <h2 className="text-2xl font-bold mb-4 text-white">
                {isSignUp ? "Hello!" : "Welcome Back!"}
              </h2>
              <p className="text-sm text-white/90 leading-relaxed mb-8">
                {isSignUp 
                  ? "Register with your personal details to use all of stock management features"
                  : "Enter your personal details to use all of stock management features"}
              </p>
              <button 
                onClick={() => toggleSignUp(false)}
                className="border-2 border-white text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-all duration-300"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
            <div className={`absolute right-0 w-1/2 h-full flex items-center justify-center flex-col px-6 md:px-8 text-center ${styles.togglePanel}`}>
              <h2 className="text-2xl font-bold mb-4 text-white">
                {isSignUp ? "Welcome Back!" : "Hello!"}
              </h2>
              <p className="text-sm text-white/90 leading-relaxed mb-8">
                {isSignUp 
                  ? "Already have an account? Sign in to access your stock management features"
                  : "New here? Sign up to start using our stock management features"}
              </p>
              <button 
                onClick={() => toggleSignUp(true)}
                className="border-2 border-white text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-all duration-300"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>
        </div>

        <ConfirmationModal 
          isOpen={modalOpen}
          message={modalMessage}
          title={modalTitle}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default Login;