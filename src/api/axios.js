import axios from "axios";

const baseURL =
  typeof window === "undefined"
    ? process.env.API_URL
      ? `${process.env.API_URL.replace(/\/$/, "")}/api`
      : "http://localhost:5000/api"
    : import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((c) => {
  if (typeof window !== "undefined") {
    c.headers["Accept-Language"] = localStorage.getItem("lang") || "tm";
  }
  return c;
});

export default api;
