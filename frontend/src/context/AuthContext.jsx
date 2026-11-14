import { createContext, useContext, useState, useEffect } from 'react';
import { axiosClient } from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('taskflow_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('taskflow_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosClient.get('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('taskflow_user', JSON.stringify(res.data));
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('taskflow_token', token);
      localStorage.setItem('taskflow_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const can = (permission) => {
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    return (user.permissions || []).includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
