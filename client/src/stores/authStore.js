import { create } from 'zustand';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    try {
      set({ error: null });
      const { user, token } = await authAPI.login(email, password);
      localStorage.setItem('token', token);
      connectSocket(token);
      set({ user, token, error: null });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  register: async (userData) => {
    try {
      set({ error: null });
      const { user, token } = await authAPI.register(userData);
      localStorage.setItem('token', token);
      connectSocket(token);
      set({ user, token, error: null });
      return user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { user } = await authAPI.getMe();
      connectSocket(token);
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

export default useAuthStore;
