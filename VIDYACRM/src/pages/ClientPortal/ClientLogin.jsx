import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import clientApi from "../../api/clientAxios";
import styles from "./ClientLogin.module.css";
import { FiLock, FiMail, FiArrowRight } from "react-icons/fi";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await clientApi.post("/client-portal/login", { email, password });
      localStorage.setItem("clientToken", res.data.token);
      localStorage.setItem("clientData", JSON.stringify(res.data.data));
      toast.success("Login successful!");
      navigate("/client-portal");
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgDecoration}>
        <div className={styles.blobLeft}></div>
        <div className={styles.blobRight}></div>
      </div>

      <div className={`${styles.whiteCard} ${styles.loginCard}`}>
        <div className={styles.loginHeader}>
          <div className={styles.iconWrapper}>
            <FiLock />
          </div>
          <h1 className={styles.mainTitle}>
            Client Portal
          </h1>
          <p className={styles.subTitle}>
            Sign in to access your dashboard and deliverables
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputContainer}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                required
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputContainer}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                required
                className={styles.inputField}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.primaryBtn}
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
            {!loading && <FiArrowRight />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientLogin;
