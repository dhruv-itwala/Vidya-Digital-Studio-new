import { forwardRef } from "react";
import InlineLoader from "./InlineLoader";
import styles from "./Button.module.css";

const Button = forwardRef(function Button(
  {
    children,
    loading = false,
    loadingText,
    disabled = false,
    onClick,
    type = "button",
    variant = "primary", // primary, secondary, danger, success, outline, ghost
    size = "md", // sm, md, lg
    icon = null,
    className = "",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  const variantClass = styles[variant] || "";
  const sizeClass = styles[size] || styles.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={`${styles.button} ${variantClass} ${sizeClass} ${loading ? styles.loading : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingWrapper}>
          <InlineLoader size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className={styles.contentWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
});

export default Button;
