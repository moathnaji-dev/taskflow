import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// If the token expired or is invalid, clear the session and go back to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Friendly message for any failed request
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.request) return "Cannot reach the server. Check your connection.";
  return fallback;
};

export default api;
