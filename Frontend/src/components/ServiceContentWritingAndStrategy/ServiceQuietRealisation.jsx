import { motion } from "framer-motion";
import { useEffect } from "react";
import { serviceMedia } from "../../assets/Data/MasterData";
import { Typewriter } from "./Typewriter.jsx";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceQuietRealisation({
  setHoverImg,
  startTypewriter,
  setStartTypewriter,
}) {
  const textHoverMap = { pause: serviceMedia.Pause };

  // Motion variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 },
    },
  };

  return (
    <motion.section
      className={styles.sectionGrid}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      onViewportEnter={() => setStartTypewriter((s) => ({ ...s, pause: true }))}
    >
      {/* Side Image */}
      <motion.img
        src={serviceMedia.reflectionImg}
        alt="Reflection concept illustration"
        className={styles.sideImage}
        initial={{ y: 0 }}
        whileHover={{ y: -8, scale: 1.04 }}
        animate={{
          y: [0, -2, 0],
          transition: { repeat: Infinity, duration: 4 },
        }}
        transition={{ type: "spring", stiffness: 200 }}
      />

      {/* Text Content */}
      <motion.div className={styles.textContent} variants={containerVariants}>
        {/* Pause Label with Typewriter */}
        <motion.p
          className={styles.pauseLabel}
          variants={fadeInUp}
          onMouseEnter={() => setHoverImg(textHoverMap.pause)}
          onMouseLeave={() => setHoverImg(null)}
          style={{ cursor: "pointer" }}
        >
          A small pause...{" "}
          <Typewriter
            phrases={["before we go further"]}
            start={startTypewriter.pause}
            speed={50}
          />
        </motion.p>

        {/* Big bold reflective text */}
        <motion.p className={styles.reflectionBold} variants={fadeInUp}>
          Think about the last piece of content you posted.
        </motion.p>

        <motion.p className={styles.reflection} variants={fadeInUp}>
          Did it feel necessary, or did it feel like it had to be posted?
        </motion.p>

        <motion.p className={styles.reflectionMuted} variants={fadeInUp}>
          That difference matters more than algorithms ever will.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}
