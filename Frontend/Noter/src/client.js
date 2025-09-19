import axios from "axios";

// Use .env if you like: VITE_API_BASE_URL=http://localhost:8080
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({ baseURL });

// --- Auth ---
export const register = (payload) => api.post("/api/auth/register", payload);
export const login = (payload) => api.post("/api/auth/login", payload);

// --- Notes ---
export const listNotes = () => api.get("/api/notes");
export const getNote = (id) => api.get(`/api/notes/${id}`);
export const createNote = (payload) => api.post("/api/notes", payload);
export const updateNote = (id, payload) => api.put(`/api/notes/${id}`, payload);
export const deleteNote = (id) => api.delete(`/api/notes/${id}`);
