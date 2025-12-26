import { motion } from "framer-motion";
import { useState } from "react";
import { serviceMedia } from "../../assets/Data/MasterData";
import styles from "./ServiceContentWritingAndStrategy.module.css";

export default function ServiceContentWriting() {
  const writingHoverMap = {
    "Script writing for short & long-form": serviceMedia.Script_writing,
    "Social media & campaign copy": serviceMedia.Social_Media,
    "Website content clarity": serviceMedia.Web_Content,
    "Blogs & articles": serviceMedia.Blogs_Articles,
    "Personal brand voice": serviceMedia.Personal_brand_voice,
    "Ad & film scripts": serviceMedia.Ads_Films_Scripts,
  };

  const [currentImg, setCurrentImg] = useState(serviceMedia.writingImg);

  return (
    <div className="masterContainer">
      <motion.section className={styles.sectionGrid}>
        <div>
          <h2>What content writing means to us</h2>

          <p className={styles.lead}>
            Content rarely needs more creativity. <br />
            It needs more honesty about what it’s trying to do.
          </p>

          <div className={styles.services}>
            {Object.keys(writingHoverMap).map((item, i) => (
              <motion.p
                key={i}
                className={styles.serviceItem}
                whileHover={{ x: 8 }}
                onMouseEnter={() => setCurrentImg(writingHoverMap[item])}
              >
                {item}
              </motion.p>
            ))}
          </div>

          <p className={styles.servicesNote}>
            Different formats. <br /> One intention.
          </p>

          <p className={styles.question}>
            The question is never “what should we write?”
            <br />
            <span>It is always “what needs to be felt?”</span>
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
