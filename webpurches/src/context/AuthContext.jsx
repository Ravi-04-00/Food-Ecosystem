import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [role, setRole] = useState(user?.role || 'CUSTOMER');

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  const login = async (email, password) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
    setRole(loggedUser.role);
    return loggedUser;
  };

  const register = async (data) => {
    const newUser = await authService.register(data);
    setUser(newUser);
    setRole(newUser.role);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole('CUSTOMER');
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('wp_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
