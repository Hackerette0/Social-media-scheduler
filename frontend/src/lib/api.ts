import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: BASE_URL });

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>("/auth/login", data),
};

// Posts
export const postsApi = {
  list: (params?: { status_filter?: string; platform?: string; limit?: number; offset?: number }) =>
    api.get("/posts", { params }),
  get: (id: string) => api.get(`/posts/${id}`),
  create: (data: object) => api.post("/posts", data),
  update: (id: string, data: object) => api.patch(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
};

// Hashtags
export const hashtagsApi = {
  generate: (content: string, count = 10, platforms = ["twitter"]) =>
    api.post("/hashtags/generate", { content, count, platforms }),
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
};

// Captions
export const captionsApi = {
  generate: (idea: string, tone: string, platforms: string[], count = 4) =>
    api.post("/captions/generate", { idea, tone, platforms, count }),

  adapt: (caption: string, target_platform: string) =>
    api.post("/captions/adapt", { caption, target_platform }),

  bestTimes: (platforms: string[], count = 3) =>
    api.post("/captions/best-times", { platforms, count }),
};
