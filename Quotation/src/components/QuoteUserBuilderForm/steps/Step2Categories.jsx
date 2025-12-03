import React, { useState } from "react";
import styles from "../QuoteUserBuilderForm.module.css";
import {
  FcEditImage,
  FcComboChart,
  FcVideoCall,
  FcAdvertising,
  FcServices,
  FcDocument,
  FcElectronics,
  FcPuzzle,
} from "react-icons/fc";

const ICON_MAP = {
  "Content Writing": <FcEditImage />,
  "Content Strategy": <FcComboChart />,
  "Content Production": <FcVideoCall />,
  "Content Distribution": <FcAdvertising />,
  "Graphic Designing + UI/UX": <FcServices />,
  "Print & Publication Design": <FcDocument />,
  "Web and App Development": <FcElectronics />,
  "2D / 3D Animation & Modelling": <FcPuzzle />,
};

const Step2Categories = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  specialCategories,
  onNext,
  onBack,
}) => {
  const [touched, setTouched] = useState(false);

  const toggleCategory = (cat) => {
    setTouched(true);

    const already = selectedCategories.includes(cat);
    if (already) {
      // unselect
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      // select freely — no restrictions
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleNext = () => {
    setTouched(true);
    if (selectedCategories.length === 0) return;
    onNext();
  };

  const hasSpecial = selectedCategories.some((c) =>
    specialCategories.includes(c)
  );

  return (
    <div className={styles.stepCard}>
      <h2 className={styles.title}>What do you need help with?</h2>
      <p className={styles.subTitle}>
        Select one or more categories you&apos;d like a quotation for.
      </p>

      <div className={styles.categoryGrid}>
        {categories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          const icon = ICON_MAP[cat] || "✨";

          return (
            <button
              key={cat}
              type="button"
              className={`${styles.categoryCard} ${
                selected ? styles.categoryCardSelected : ""
              }`}
              onClick={() => toggleCategory(cat)}
            >
              <div className={styles.categoryIcon}>{icon}</div>
              <div className={styles.categoryTitle}>{cat}</div>
            </button>
          );
        })}
      </div>

      {touched && selectedCategories.length === 0 && (
        <p className={styles.errorText}>
          Please select at least one category to continue.
        </p>
      )}

      {/* Only message changes when special category is selected */}
      {hasSpecial && (
        <div className={styles.infoBoxWarning}>
          <strong>Note:</strong> You selected a{" "}
          <strong>special category</strong>. Any services under these categories
          should be planned according to a<strong> 1-month duration</strong>.
        </div>
      )}

      {!hasSpecial && selectedCategories.length > 0 && (
        <div className={styles.infoBox}>
          You can select multiple categories together. Services will be
          configured step by step in the next screens.
        </div>
      )}

      <div className={styles.navRow}>
        <button className={styles.ghostBtn} type="button" onClick={onBack}>
          Back
        </button>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={handleNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step2Categories;
