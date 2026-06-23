import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://dashboard-visualisation.onrender.com";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dashboard_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("dashboard_token");
      localStorage.removeItem("dashboard_user");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export const fmtNumber = (n) =>
  n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US");

export const fmtPct = (n) =>
  n == null || isNaN(n) ? "—" : `${Number(n).toFixed(1)}%`;

export const SEVERITY = {
  critical:  { color: "#F87171", base: "#C00000", bg: "rgba(192,0,0,0.15)",   border: "rgba(192,0,0,0.35)" },
  moderate:  { color: "#FCD34D", base: "#F4B942", bg: "rgba(244,185,66,0.15)", border: "rgba(244,185,66,0.35)" },
  compliant: { color: "#82C358", base: "#70AD47", bg: "rgba(112,173,71,0.15)", border: "rgba(112,173,71,0.35)" },
  info:      { color: "#60A5FA", base: "#1F4E79", bg: "rgba(31,78,121,0.18)",  border: "rgba(96,165,250,0.35)" },
};

export const severityRing = (s) => `glow-${s || "info"}`;
