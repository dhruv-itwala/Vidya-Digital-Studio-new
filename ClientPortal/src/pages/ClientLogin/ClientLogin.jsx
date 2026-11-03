import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clientApi from "../../api/clientAxios";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./ClientLogin.module.css";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientBrand, setClientBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dynamically lookup client name & logo as soon as email is entered
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setClientBrand(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await clientApi.get("/client-portal/lookup-brand", {
          params: { email: trimmed },
        });
        if (res.data?.success && res.data?.found && res.data?.data) {
          setClientBrand(res.data.data);
        } else {
          setClientBrand(null);
        }
      } catch (err) {
        setClientBrand(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clientApi.post("/client-portal/login", { email, password });
      localStorage.setItem("clientToken", res.data.token);
      localStorage.setItem("clientData", JSON.stringify(res.data.data));
      navigate("/client-portal");
      toast.success("Welcome back to your workspace!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = clientBrand?.clientName || "Vidya Digital Studio";
  const displayLogoUrl = clientBrand?.profilePhoto?.url || "";
  const initialLetter = (displayName || "V").charAt(0).toUpperCase();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div
            className={`${styles.logoMark} ${clientBrand ? styles.logoMarkCustom : ""}`}
            title={displayName}
          >
            {displayLogoUrl ? (
              <img src={displayLogoUrl} alt={displayName} className={styles.logoImg} />
            ) : (
              initialLetter
            )}
          </div>
          <h2 className={styles.brandTitle} title={displayName}>
            {displayName}
          </h2>
          <div className={styles.brandSubtitle}>
            {clientBrand ? (
              <span className={styles.brandBadgeCustom}>
                <span className={styles.pulseDot} />
                {clientBrand.ownerName ? `${clientBrand.ownerName} · Client Portal` : "Client Workspace"}
              </span>
            ) : (
              <span>Client Workspace Sign In</span>
            )}
          </div>
        </div>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label>Registered Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Portal Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={styles.passwordInput}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? "Authenticating..." : `Sign In to ${clientBrand ? clientBrand.clientName : "Client Portal"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
