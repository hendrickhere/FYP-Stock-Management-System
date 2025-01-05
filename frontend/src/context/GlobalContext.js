import React, { createContext } from 'react';

export const GlobalContext = createContext({
  username: '',
  setUsername: () => {},
  setOrganizationId: () => {},
  isAuthenticated: false,
  user: null,
  setUser: () => {},
  logout: () => {},
  login: () => {}
});
