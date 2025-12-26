import { motion } from "framer-motion";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceInvitation() {
  return (
    <div className={styles.inviteContainer}>
      <motion.div
        className={styles.inviteCard}
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
      >
        <p>If this felt familiar,</p>
        <p className={styles.inviteStay}>stay a little.</p>
        <p className={styles.inviteMuted}>
          There’s more to build — slowly and properly.
        </p>
        <p className={styles.inviteWhisper}>No pressure. Just presence.</p>
      </motion.div>
    </div>
  );
}
