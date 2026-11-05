import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clientApi from "../../api/clientAxios";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiArrowRight } from "react-icons/fi";
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
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={styles.loginCard}
      >
        {/* Brand / Workspace Header */}
        <div className={styles.logoSection}>
          <AnimatePresence mode="wait">
            <motion.div
              key={displayLogoUrl || initialLetter}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`${styles.logoMark} ${clientBrand ? styles.logoMarkCustom : ""}`}
              title={displayName}
            >
              {displayLogoUrl ? (
                <img src={displayLogoUrl} alt={displayName} className={styles.logoImg} />
              ) : (
                <span>{initialLetter}</span>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={displayName}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.brandTitle}
            title={displayName}
          >
            {displayName}
          </motion.div>

          <div className={styles.brandSubtitle}>
            <AnimatePresence mode="wait">
              {clientBrand ? (
                <motion.span
                  key="custom-brand"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={styles.brandBadgeCustom}
                >
                  <span className={styles.pulseDot} />
                  <span>{clientBrand.ownerName ? `${clientBrand.ownerName} · Client Portal` : "Client Workspace"}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="default-brand"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.defaultSubtext}
                >
                  Client Workspace Portal Sign In
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="client-email" className={styles.label}>
              Registered Email
            </label>
            <div className={styles.inputWrap}>
              <FiMail className={styles.fieldIcon} />
              <input
                id="client-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="client-password" className={styles.label}>
                Portal Password
              </label>
            </div>
            <div className={styles.inputWrap}>
              <FiLock className={styles.fieldIcon} />
              <input
                id="client-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`${styles.inputField} ${styles.passwordInput}`}
                autoComplete="current-password"
              />
              <motion.button
                whileTap={{ scale: 0.85 }}
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </motion.button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnContent}>
                <span className="spin" style={{ display: "inline-block" }}>⟳</span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className={styles.btnContent}>
                <span>Sign In to {clientBrand ? clientBrand.clientName : "Client Workspace"}</span>
                <FiArrowRight size={15} />
              </span>
            )}
          </motion.button>
        </form>

        {/* Security Footer Notice */}
        <div className={styles.securityFooter}>
          <FiShield className={styles.shieldIcon} />
          <span>Encrypted 256-bit Executive Client Access</span>
        </div>
      </motion.div>
    </div>
  );
}
