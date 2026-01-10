import styles from "./Building.module.css";
import CD from "../components/CD";

import f1 from "../assets/floors/f1.png";
import f2 from "../assets/floors/f2.png";
import f3 from "../assets/floors/f3.png";
import f4 from "../assets/floors/f4.png";
import f5 from "../assets/floors/f5.png";
import f6 from "../assets/floors/f6.png";

export default function MainServices() {
  return (
    <section className={styles.buildingPage}>
      <div className={styles.building}>
        <Floor bg={f1}>
          <CD title="Floor One — Content + 3D" />
        </Floor>
        <Floor bg={f2}>
          <CD title="Floor Two" />
        </Floor>
        <Floor bg={f3}>
          <CD title="Floor Three" />
        </Floor>
        <Floor bg={f4}>
          <CD title="Floor Four" />
        </Floor>
        <Floor bg={f5}>
          <CD title="Floor Five" />
        </Floor>
        <Floor bg={f6}>
          <CD title="Floor Six" />
        </Floor>
      </div>
    </section>
  );
}

function Floor({ bg, children }) {
  return (
    <div className={styles.floor} style={{ backgroundImage: `url(${bg})` }}>
      <div className={styles.floorContent}>{children}</div>
    </div>
  );
}
