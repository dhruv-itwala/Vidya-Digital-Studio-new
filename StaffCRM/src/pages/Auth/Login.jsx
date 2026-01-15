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

      // ✅ ONLY store token
      login({ token: res.data.token });

      // ✅ Go to neutral route
      navigate("/");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Invalid email or password"
      );
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.logoWrapper}>
          <img src={Images.login_logo} alt="CRM Logo" className={styles.logo} />
        </div>

        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Login to your CRM dashboard</p>

        <div className={styles.field}>
          <label>Email</label>
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

        {serverError && <div className={styles.serverError}>{serverError}</div>}

        <button type="submit" className={styles.btn} disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
