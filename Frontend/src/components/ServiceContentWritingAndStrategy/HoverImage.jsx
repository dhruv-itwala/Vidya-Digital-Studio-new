import { motion } from "framer-motion";

export const HoverImage = ({ src, position }) => {
  if (!src) return null;

  return (
    <motion.img
      src={src}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: "fixed",
        top: position.y + 20,
        left: position.x + 20,
        width: 120,
        height: 120,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 9999,
        objectFit: "cover",
        boxShadow: "0px 8px 20px rgba(0,0,0,0.2)",
      }}
    />
  );
};
