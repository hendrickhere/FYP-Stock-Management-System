import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../components/auth/Login';
import { MockGlobalProvider } from '../../setup/mockGlobalContext';

// Mock CSS modules
jest.mock('../../../styles/login.module.css', () => ({
  container: 'container',
  form: 'form',
  input: 'input',
  button: 'button'
}));

// Mock image imports
jest.mock('../../../assets/logo.png', () => 'logo-mock');

// Mock axios
jest.mock('../../../axiosConfig', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

describe('Login Component', () => {
  const mockContextValue = {
    username: '',
    setUsername: jest.fn(),
    setOrganizationId: jest.fn(),
    isAuthenticated: false,
    user: null
  };

  const renderLogin = (contextValue = mockContextValue) => {
    return render(
      <BrowserRouter>
        <MockGlobalProvider value={contextValue}>
          <Login onLoginSuccess={() => {}} />
        </MockGlobalProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    renderLogin();
    
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('handles input changes', () => {
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });
});