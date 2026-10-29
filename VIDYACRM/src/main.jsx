import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

// Register the PWA Service Worker
try {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      console.log("✅ Service Worker registered:", registration);
    },
    onRegisterError(error) {
      console.warn("⚠️ Service Worker registration note:", error);
    },
  });
} catch (swErr) {
  console.warn("⚠️ SW initialization warning:", swErr);
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
