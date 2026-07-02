import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "X-Code-Key": process.env.NEXT_PUBLIC_X_CODE_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
// console.log(process.env.NEXT_PUBLIC_API_URL);
// console.log(process.env.NEXT_PUBLIC_X_CODE_KEY);

api.interceptors.request.use((config) => {

  if (typeof window !== "undefined") {

    const access_token = localStorage.getItem("access_token");

    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
  }

  return config;

});

export default api;