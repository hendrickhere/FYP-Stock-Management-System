import React, { createContext, useState, useEffect } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [username, setUsername] = useState(() => {
    const savedUsername = localStorage.getItem("username");
    return savedUsername;
  });
  const [organizationId, setOrganizationId] = useState(() => {
    const savedOrganizationId = localStorage.getItem("organization_id");
    return savedOrganizationId;
  });

  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem("organization_id", organizationId);
  }, [organizationId]);

  return (
    <GlobalContext.Provider value={{ username, setUsername, organizationId, setOrganizationId }}>
      {children}
    </GlobalContext.Provider>
  );
};
