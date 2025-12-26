import { motion } from "framer-motion";
import { serviceMedia } from "../../assets/Data/MasterData";
import { Typewriter } from "./Typewriter.jsx";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceQuietRealisation({
  setHoverImg,
  startTypewriter,
  setStartTypewriter,
}) {
  const textHoverMap = { pause: serviceMedia.Pause };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
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
      <motion.img
        src={serviceMedia.reflectionImg}
        className={styles.sideImage}
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />

      <motion.div className={styles.textContent} variants={containerVariants}>
        <motion.p
          className={styles.pauseLabel}
          variants={fadeInUp}
          onMouseEnter={() => setHoverImg(textHoverMap.pause)}
          onMouseLeave={() => setHoverImg(null)}
        >
          A small pause…{" "}
          <Typewriter
            phrases={["before we go further"]}
            start={startTypewriter.pause}
            speed={50}
          />
        </motion.p>

        <motion.p className={styles.reflectionBold} variants={fadeInUp}>
          Think about the last piece of content you posted.
        </motion.p>

        <motion.p className={styles.reflection} variants={fadeInUp}>
          Did it feel necessary, or did it feel like it had to be posted?
        </motion.p>

        <motion.p className={styles.reflectionMuted} variants={fadeInUp}>
          That difference matters more than algorithms ever will.
        </motion.p>

        <motion.p className={styles.reflectionSoft} variants={fadeInUp}>
          Most content fails quietly. <br />
          Not because it’s bad - <br />
          but because it was written without a reason to exist.
        </motion.p>

        <motion.p className={styles.reflectionWhisper} variants={fadeInUp}>
          You didn’t miss the trend. You missed the intention.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}
