import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import styles from "./ServiceContentWritingAndStrategy.module.css";
import ServiceHero from "./serviceHero";
import ServiceQuietRealisation from "./ServiceQuietRealisation";
import ServiceContentWriting from "./serviceContentWriting";
import ServiceStrategy from "./serviceStrategy";
import ServiceProcess from "./serviceProcess";
import { HoverImage } from "./HoverImage";
import ServiceInvitation from "./serviceInvitation";

export default function ServiceContentWritingAndStrategy() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hoverImg, setHoverImg] = useState(null);
  const [startTypewriter, setStartTypewriter] = useState({});

  return (
    <div onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}>
      <ServiceHero
        setHoverImg={setHoverImg}
        startTypewriter={startTypewriter}
        setStartTypewriter={setStartTypewriter}
      />{" "}
      <AnimatePresence>
        {hoverImg && <HoverImage src={hoverImg} position={cursorPos} />}
      </AnimatePresence>
      <div>
        <div className={styles.page}>
          <ServiceQuietRealisation
            setHoverImg={setHoverImg}
            startTypewriter={startTypewriter}
            setStartTypewriter={setStartTypewriter}
          />
          <ServiceContentWriting setHoverImg={setHoverImg} />
          <ServiceStrategy />
          <ServiceProcess />
          <ServiceInvitation />
        </div>
      </div>
    </div>
  );
}
