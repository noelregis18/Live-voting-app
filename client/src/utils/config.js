// API configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Default request timeout
export const REQUEST_TIMEOUT = 10000; // 10 seconds

// Configure Axios defaults (can be imported where needed)
export const configureAxios = (axios) => {
  axios.defaults.baseURL = API_URL;
  axios.defaults.timeout = REQUEST_TIMEOUT;
  axios.defaults.headers.post['Content-Type'] = 'application/json';
}; 