import axios from "axios";
import Cookies from "js-cookie";

const API = "https://dating-backend.onrender.com";

export const register = async (name, email, password) => {
  return axios.post(`${API}/register`, { name, email, password }, { withCredentials: true });
};

export const login = async (email, password) => {
  return axios.post(`${API}/login`, { email, password }, { withCredentials: true });
};

export const logout = async () => {
  return axios.post(`${API}/logout`, {}, { withCredentials: true });
};

export const getProfile = async () => {
  return axios.get(`${API}/profile`, { withCredentials: true });
};
