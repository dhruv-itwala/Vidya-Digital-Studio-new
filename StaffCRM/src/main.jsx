import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Register the PWA Service Worker
registerSW({
  immediate: true,
  onRegistered(registration) {
    console.log("✅ Service Worker registered:", registration);
  },
  onRegisterError(error) {
    console.error("❌ Service Worker registration failed:", error);
  },
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
