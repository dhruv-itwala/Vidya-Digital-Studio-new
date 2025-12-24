import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceInvitation() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={styles.inviteContainer}>
      {/* Floating background shapes */}
      <motion.div
        className={styles.floatingShape1}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.floatingShape2}
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Card */}
      <motion.div
        className={styles.inviteCard}
        initial={{ y: 50, opacity: 0, rotate: -2 }}
        whileInView={{ y: 0, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.03, y: -5, rotate: 1 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          If this felt familiar,
        </motion.p>
        <motion.p
          className={styles.inviteStay}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          stay a little.
        </motion.p>
        <motion.p
          className={styles.inviteMuted}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          There’s more to build — slowly and properly.
        </motion.p>
      </motion.div>

      {/* Cursor-follow sparkle */}
      <AnimatePresence>
        {hover && (
          <motion.div
            className={styles.cursorSparkle}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            style={{ top: cursorPos.y + 20, left: cursorPos.x + 20 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
