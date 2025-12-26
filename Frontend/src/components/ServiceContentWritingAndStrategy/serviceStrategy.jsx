import { motion } from "framer-motion";
import { serviceMedia } from "../../assets/Data/MasterData";
import styles from "./ServiceContentWritingAndStrategy.module.css";
import {
  FiUsers,
  FiCompass,
  FiLayers,
  FiClock,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

export default function ServiceStrategy() {
  const strategyList = [
    { text: "Audience & belief mapping", icon: FiUsers },
    { text: "Narrative pillars", icon: FiLayers },
    { text: "Platform intelligence", icon: FiCompass },
    { text: "Sequencing & timing", icon: FiClock },
    { text: "Messaging boundaries", icon: FiShield },
    { text: "Measurement loops", icon: FiTrendingUp },
  ];

  return (
    <div className="masterContainer">
      <motion.section className={styles.sectionAltGrid}>
        <motion.img
          src={serviceMedia.strategyImg}
          className={styles.sideImage}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        />

        <div>
          <h2>Where strategy enters the room</h2>

          <p className={styles.lead}>
            Strategy isn’t a document. <br />
            It’s the thinking that happens before the first word — and the
            discipline that stays long after it’s written.
          </p>

          <div className={styles.strategyList}>
            {strategyList.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={styles.strategyItem}>
                  <Icon size={22} />
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>

          <p className={styles.conclusion}>
            Strategy transforms content from noise into impact — by deciding
            what matters enough to repeat, and what deserves to be said only
            once.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
