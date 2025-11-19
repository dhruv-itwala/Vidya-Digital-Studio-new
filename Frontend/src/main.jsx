import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);

// 🔥 Let prerender plugin know when to snapshot
window.addEventListener("load", () => {
  setTimeout(() => {
    document.dispatchEvent(new Event("prerender-ready"));
  }, 300); // wait a short time for Helmet to inject meta tags
});
