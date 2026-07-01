import { useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { AuthContext } from './authContextObject';

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';

function clearPersistentAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readStoredUser() {
  clearPersistentAuthStorage();

  const storedUser = sessionStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => {
    clearPersistentAuthStorage();
    return sessionStorage.getItem(TOKEN_KEY);
  });

  async function login(credentials) {
    const { data } = await axiosClient.post('/auth/login', credentials);

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    return data.user;
  }

  async function register(payload) {
    const { data } = await axiosClient.post('/auth/register', payload);

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    return data.user;
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    clearPersistentAuthStorage();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      login,
      logout,
      register,
      token,
      user,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
