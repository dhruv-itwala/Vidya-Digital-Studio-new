import styles from "./InlineLoader.module.css";

export default function InlineLoader({ size = 16, color = "currentColor", className = "" }) {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 8)),
        borderColor: `${color} transparent transparent transparent`,
      }}
      aria-label="Loading..."
    />
  );
}
