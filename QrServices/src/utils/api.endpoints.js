import apiClient from "./api.client";
console.log("BASE:", apiClient.defaults.baseURL);
export const getAllProjects = () => apiClient.get("/portfolio");
export const getProjects = () => apiClient.get("/projects");

export const getAllBlogPosts = () => apiClient.get("/blogs");
export const getBlogPostBySlug = (slug) => apiClient.get(`/blogs/${slug}`);

export const getMediaList = () => apiClient.get("/media");

export const getShowcase = () => apiClient.get("/showcase");

export const getFaqs = () => apiClient.get("/faqs");

export const getTotalScans = () => apiClient.get("/scan/stats");

export const logScan = () => apiClient.post("/scan/log");
