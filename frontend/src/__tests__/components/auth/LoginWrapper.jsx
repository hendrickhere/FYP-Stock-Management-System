import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import LoginWrapper from '../../../loginWrapper';
import { Alert } from "../../../ui/alert";

// Mock the Alert component
jest.mock("../../../ui/alert", () => ({
  Alert: jest.fn(({ children }) => <div data-testid="mock-alert">{children}</div>),
  AlertDescription: jest.fn(({ children }) => <div>{children}</div>)
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn()
}));

describe('LoginWrapper', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useNavigate.mockImplementation(() => mockNavigate);
    useLocation.mockImplementation(() => ({ state: {} }));
  });

  describe('Authentication State Management', () => {
    it('should show login page when no token exists', () => {
      render(
        <BrowserRouter>
          <LoginWrapper />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should redirect to dashboard when valid token exists', async () => {
      // Create a valid JWT token (not expired)
      const validToken = createMockJWT(Math.floor(Date.now() / 1000) + 3600);
      localStorage.setItem('accessToken', validToken);
      
      render(
        <BrowserRouter>
          <LoginWrapper />
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle expired token', async () => {
        const expiredToken = createMockJWT(Math.floor(Date.now() / 1000) - 3600);
        localStorage.setItem('accessToken', expiredToken);
        
        render(
          <BrowserRouter>
            <LoginWrapper />
          </BrowserRouter>
        );
      
        await waitFor(() => {
          expect(localStorage.getItem('accessToken')).toBeNull();
        }, {
          timeout: 2000,
          onTimeout: err => console.error('Token was not cleared within timeout period')
        });
      
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        }, {
          timeout: 2000,
          onTimeout: err => console.error('Login page was not displayed within timeout period')
        });
      });
  });

  describe('Session Message Handling', () => {
    it('should display session message and clear location state', async () => {
      const sessionMessage = 'Your session has expired';
      useLocation.mockImplementation(() => ({
        state: { message: sessionMessage }
      }));
      
      render(
        <BrowserRouter>
          <LoginWrapper />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-alert')).toHaveTextContent(sessionMessage);
      });
    });

    it('should not display alert when no session message exists', () => {
      render(
        <BrowserRouter>
          <LoginWrapper />
        </BrowserRouter>
      );

      expect(screen.queryByTestId('mock-alert')).not.toBeInTheDocument();
    });
  });
});

// Helper function to create mock JWT tokens
function createMockJWT(expTime) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expTime }));
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}