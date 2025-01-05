import React from 'react';
import { GlobalContext } from '../../context/GlobalContext';

export const mockGlobalContextValue = {
  username: '',
  setUsername: jest.fn(),
  setOrganizationId: jest.fn(),
  isAuthenticated: false,
  user: null,
  setUser: jest.fn(),
  logout: jest.fn(),
  login: jest.fn()
};

export const MockGlobalProvider = ({ children, value = mockGlobalContextValue }) => {
  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};
