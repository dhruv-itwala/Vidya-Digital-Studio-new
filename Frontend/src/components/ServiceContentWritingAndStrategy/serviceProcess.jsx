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

  const [currentImg, setCurrentImg] = useState(serviceMedia.processImg);

  return (
    <div className="masterContainer">
      <motion.section className={styles.sectionGrid}>
        <div>
          <h2>How it comes together</h2>

          <p className={styles.lead}>There is no rush here. Only direction.</p>

          <div className={styles.process}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className={styles.processStep}
                onMouseEnter={() => setCurrentImg(step.img)}
              >
                <span className={styles.stepCircle}></span>
                <span>{step.label}</span>
              </motion.div>
            ))}
          </div>

          <p className={styles.processNote}>
            This is not a sprint. <br />
            It’s a long, intentional build — where clarity compounds over time.
          </p>
        </div>

        <motion.img
          src={currentImg}
          className={styles.sideImage}
          whileHover={{ y: -8, scale: 1.04 }}
        />
      </motion.section>
    </div>
  );
}
