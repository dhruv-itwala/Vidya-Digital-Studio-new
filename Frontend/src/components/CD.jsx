// src/components/CD.jsx
import "@google/model-viewer";
import styles from "./CD.module.css";

const CD = ({ title }) => {
  return (
    <div className="floorInner">
      <div className={styles.container}>
        {/* Left Side – Content */}
        <div className={styles.content}>
          <h2>{title}</h2>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries.
          </p>
        </div>

        {/* Right Side – 3D Model */}
        <div className={styles.model}>
          <model-viewer
            src="/darsh.glb"
            alt="3D model"
            camera-controls
            auto-rotate
            exposure="1"
            loading="lazy"
            className={styles.modelViewer}
          />
        </div>
      </div>
    </div>
  );
};

export default CD;
