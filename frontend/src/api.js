import axios from "axios";
import { io } from "socket.io-client";

const API = axios.create({ baseURL: "http://127.0.0.1:5000/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

export const socket = io("http://127.0.0.1:5000", { autoConnect: false });
