// frontend/src/utils/auth.ts

export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Un JWT est composé de 3 parties séparées par des points. 
    // La partie 1 (index 1) contient les données (payload).
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload).role; // On récupère le champ "role" que nous avons mis côté Python
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};