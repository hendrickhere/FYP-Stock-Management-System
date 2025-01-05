import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../../../components/auth/Signup';
import { MockGlobalProvider, mockGlobalContextValue } from '../../setup/mockGlobalContext';

// Mock CSS modules
jest.mock('../../../styles/signup.module.css', () => ({
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

describe('Signup Component', () => {
  const renderSignup = (contextValue = mockGlobalContextValue) => {
    return render(
      <BrowserRouter>
        <MockGlobalProvider value={contextValue}>
          <Signup />
        </MockGlobalProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form', () => {
    renderSignup();
    
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('handles input changes', () => {
    renderSignup();
    
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
