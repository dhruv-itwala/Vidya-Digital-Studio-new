import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginAPI } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { Images } from "../../assets/Data/images";
import styles from "./Login.module.css";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data) => {
    try {
      setServerError("");
      const res = await loginAPI(data);
      // ONLY store token
      login({ token: res.data.token });
      // Go to neutral route
      navigate("/");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Invalid email or password"
      );
    }
  };

  return (
    <div className={styles.page}>
      
      {/* LEFT: Branding Area */}
      <div className={styles.branding}>
        <div className={styles.brandContent}>
          <div className={styles.brandBadge}>Vidya Digital Studio</div>
          <h1 className={styles.brandTitle}>
            Manage your workspace brilliantly.
          </h1>
          <p className={styles.brandSubtitle}>
            Streamline your workflow, manage tasks, and stay on top of your
            team's performance all in one place.
          </p>
        </div>
        {/* Decorative elements */}
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
      </div>

      {/* RIGHT: Login Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.logoWrapper}>
            <img src={Images.login_logo} alt="CRM Logo" className={styles.logo} />
          </div>

          <div className={styles.header}>
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.field}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className={styles.error}>{errors.email.message}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.passwordBox}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters required",
                    },
                  })}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className={styles.error}>{errors.password.message}</p>
              )}
            </div>

            {/* Optional: Forgot Password Link could go here */}
            <div className={styles.forgotPassword}>
              <a href="#">Forgot password?</a>
            </div>

            {serverError && (
              <div className={styles.serverError}>{serverError}</div>
            )}

            <button type="submit" className={styles.btn} disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in to account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
