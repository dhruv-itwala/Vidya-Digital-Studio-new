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

  // Track current image
  const [currentImg, setCurrentImg] = useState(serviceMedia.writingImg);

  return (
    <div className="masterContainer">
      <motion.section className={styles.sectionGrid}>
        <div>
          <h2>What content writing means to us</h2>
          <p>
            To us, content writing is about creating meaning and choosing words
            that carry weight.
          </p>

          <div className={styles.services}>
            {Object.keys(writingHoverMap).map((item, i) => (
              <motion.p
                key={i}
                className={styles.serviceItem}
                whileHover={{ x: 8, backgroundColor: "rgba(246,199,220,0.3)" }}
                onMouseEnter={() => setCurrentImg(writingHoverMap[item])} // update image on hover
                // no onMouseLeave → image stays
              >
                {item}
              </motion.p>
            ))}
          </div>

          <p className={styles.question}>
            The question is never “what should we write?”
            <br />
            <span>It is always “what needs to be felt?”</span>
          </p>
        </div>

        <motion.img
          src={currentImg} // dynamically updates
          className={styles.sideImage}
          whileHover={{ y: -8, scale: 1.04 }}
          transition={{ type: "spring", stiffness: 200 }}
        />
      </motion.section>
    </div>
  );
}
