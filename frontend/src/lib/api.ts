import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // Required for cookies (JWT/CSRF)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'An unexpected error occurred';
        // You can add global error handling here (e.g., toast)
        return Promise.reject(new Error(message));
    }
);

export default api;
