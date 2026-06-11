// frontend/src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});

// --- L'INTERCEPTEUR ---
api.interceptors.request.use((config) => {
  // 1. On va chercher le badge dans le coffre-fort du navigateur
  const token = localStorage.getItem('token');
  
  // 2. Si on a un badge, on l'attache à la requête HTTP (en-tête Authorization)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});