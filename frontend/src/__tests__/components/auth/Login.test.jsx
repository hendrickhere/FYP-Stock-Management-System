import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalContext } from '../../../globalContext';
import Login from '../../../login';
import '@testing-library/jest-dom';

// Mock the navigation function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockContextValue = {
  username: '',
  setUsername: jest.fn(),
  setOrganizationId: jest.fn(),
};

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <GlobalContext.Provider value={mockContextValue}>
        <Login onLoginSuccess={jest.fn()} />
      </GlobalContext.Provider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test('renders login form by default', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('toggles between sign in and sign up forms', () => {
    renderLogin();
    const toggleButton = screen.getByText('Sign Up');
    fireEvent.click(toggleButton);
    
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Email')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('Password')).toHaveLength(2);
  });

  test('validates email format', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('Email');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  test('validates password length', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);
    
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockResponse = {
      data: {
        message: 'Login successful',
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          username: 'testuser',
          role: 'Staff',
          organization_id: 1
        }
      }
    };

    // Mock axios post request
    jest.spyOn(require('../../../axiosConfig'), 'post')
      .mockResolvedValueOnce(mockResponse);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('mock-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login error', async () => {
    const mockError = {
      response: {
        status: 401,
        data: {
          message: 'Invalid email or password'
        }
      }
    };

    jest.spyOn(require('../../../axiosConfig'), 'post')
      .mockRejectedValueOnce(mockError);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign In');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  test('handles successful signup', async () => {
    const mockResponse = {
      data: {
        message: 'User created'
      }
    };

    jest.spyOn(require('../../../axiosConfig'), 'post')
      .mockResolvedValueOnce(mockResponse);

    renderLogin();
    
    // Switch to signup form
    fireEvent.click(screen.getByText('Sign Up'));

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getAllByPlaceholderText('Email')[1];
    const passwordInput = screen.getAllByPlaceholderText('Password')[1];
    const submitButton = screen.getByText('Sign Up');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sign up successful! Please log in with your new account.')).toBeInTheDocument();
    });
  });
});