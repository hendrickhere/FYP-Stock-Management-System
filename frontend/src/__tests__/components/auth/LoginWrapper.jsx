import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginWrapper from '../../../components/auth/LoginWrapper';
import { MockGlobalProvider } from '../../setup/mockGlobalContext';

const mockAxios = require('../../setup/axiosMock');
jest.mock('../../../axiosConfig', () => mockAxios);

describe('LoginWrapper Component', () => {
  const mockContextValue = {
    isAuthenticated: false,
    setIsAuthenticated: jest.fn(),
    sessionMessage: '',
    setSessionMessage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form when not authenticated', () => {
    render(
      <BrowserRouter>
        <MockGlobalProvider value={mockContextValue}>
          <LoginWrapper />
        </MockGlobalProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('displays session message when present', () => {
    const contextWithMessage = {
      ...mockContextValue,
      sessionMessage: 'Session expired'
    };

    render(
      <BrowserRouter>
        <MockGlobalProvider value={contextWithMessage}>
          <LoginWrapper />
        </MockGlobalProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Session expired')).toBeInTheDocument();
  });
});