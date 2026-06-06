import axios from "axios";

const RAW_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");
const BASE_URL = /\/api$/.test(RAW_BASE) ? RAW_BASE : `${RAW_BASE}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
});

export const TOKEN_KEY = "tf_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(err);
  },
);
