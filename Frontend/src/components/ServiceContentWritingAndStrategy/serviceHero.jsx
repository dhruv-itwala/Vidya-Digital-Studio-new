import { motion, useScroll, useTransform } from "framer-motion";
import { serviceMedia } from "../../assets/Data/MasterData";
import { Typewriter } from "./Typewriter.jsx";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceHero({ setHoverImg }) {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const textHoverMap = { listening: serviceMedia.Listening };

  return (
    <motion.section className={styles.hero}>
      <div className="masterContainer">
        <div className={styles.heroGrid}>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h1
              onMouseEnter={() => setHoverImg(textHoverMap.listening)}
              onMouseLeave={() => setHoverImg(null)}
            >
              Words can do <br /> wonders when they <br /> begin{" "}
              <Typewriter
                phrases={[
                  "with listening.",
                  "with observing.",
                  "with defining.",
                  "with writing.",
                  "with refining.",
                  "with evolving.",
                ]}
                speed={100}
                pause={1200}
              />
            </h1>

            <p className={styles.heroText}>
              Most brands already possess powerful ideas. <br />
              With the right clarity and direction, those ideas find their
              voice.
            </p>

            <p className={styles.heroMuted}>
              Content is not about filling space. <br />
              It’s about recognising when something needs to be said — and
              having the restraint to stay silent when it doesn’t.
            </p>

            <p className={styles.heroMicro}>Not louder. Clearer.</p>
          </motion.div>

          <motion.img
            src={serviceMedia.heroImg}
            className={styles.heroImage}
            style={{ y: parallaxY }}
            whileHover={{ y: -8, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
        </div>
      </div>
    </motion.section>
  );
}
