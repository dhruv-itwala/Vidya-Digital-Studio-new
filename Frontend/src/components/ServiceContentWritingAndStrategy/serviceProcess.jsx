import { motion } from "framer-motion";
import { useState } from "react";
import { serviceMedia } from "../../assets/Data/MasterData";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceProcess() {
  const steps = [
    { label: "We listen", img: serviceMedia.Listen },
    { label: "We observe", img: serviceMedia.Observe },
    { label: "We define", img: serviceMedia.Define },
    { label: "We write", img: serviceMedia.Write },
    { label: "We refine", img: serviceMedia.Refine },
    { label: "We evolve", img: serviceMedia.Evolve },
  ];

  // Holds the image currently displayed
  const [currentImg, setCurrentImg] = useState(serviceMedia.processImg);

  return (
    <div className="masterContainer">
      <motion.section className={styles.sectionGrid}>
        <div>
          <h2>How it comes together</h2>

          <div className={styles.process}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className={styles.processStep}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                onMouseEnter={() => setCurrentImg(step.img)} // Update image on hover
                // NO onMouseLeave → image will stay
              >
                <span className={styles.stepCircle}></span>
                <span>{step.label}</span>
              </motion.div>
            ))}
          </div>
          <br />
          <p className={styles.processNote}>
            This is not a sprint. It’s a long, intentional build — every step
            matters.
          </p>
        </div>

        {/* Right-side image updates dynamically */}
        <motion.img
          src={currentImg}
          className={styles.sideImage}
          whileHover={{ y: -8, scale: 1.04 }}
          transition={{ type: "spring", stiffness: 200 }}
        />
      </motion.section>
    </div>
  );
}
