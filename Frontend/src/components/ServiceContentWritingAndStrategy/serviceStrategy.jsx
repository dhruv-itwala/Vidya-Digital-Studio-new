import { motion } from "framer-motion";
import { serviceMedia } from "../../assets/Data/MasterData";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceStrategy() {
  const strategyList = [
    "Audience & belief mapping",
    "Narrative pillars",
    "Platform intelligence",
    "Sequencing & timing",
    "Messaging boundaries",
    "Measurement loops",
  ];

  // Variants for animating letters
  const letterVariants = {
    hidden: { opacity: 0, y: 20 }, // initial state: invisible and moved down
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: "spring", stiffness: 120 },
    }),
  };

  return (
    <div className="masterContainer">
      <motion.section
        className={styles.sectionAltGrid}
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {/* Floating/hover image */}
        <motion.img
          src={serviceMedia.strategyImg}
          className={styles.sideImage}
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0] }} // subtle floating
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.08, rotate: [0, 2, -2, 0] }}
        />

        <div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            whileHover={{ scale: 1.05, color: "#F6C7DC" }}
          >
            Strategy in Motion
          </motion.h2>

          <motion.div className={styles.strategyList}>
            {strategyList.map((item, i) => (
              <motion.p
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{ display: "block", color: "#000" }} // ensure visible color
              >
                {item.split("").map((char, j) => (
                  <motion.span
                    key={j}
                    custom={j}
                    variants={letterVariants}
                    style={{ display: "inline-block" }}
                    whileHover={{ y: -2, scale: 1.05, color: "#F6C7DC" }}
                  >
                    {char === " " ? "\u00A0" : char} {/* preserve spaces */}
                  </motion.span>
                ))}
              </motion.p>
            ))}
          </motion.div>

          <motion.p
            className={styles.conclusion}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1, type: "spring", stiffness: 80 }}
          >
            Strategy transforms content from noise into impact.
          </motion.p>
        </div>
      </motion.section>
    </div>
  );
}
