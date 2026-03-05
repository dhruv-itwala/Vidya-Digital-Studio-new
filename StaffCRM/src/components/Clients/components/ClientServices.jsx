import { useState } from "react";
import styles from "../ClientForm.module.css";

export default function ClientServices({ services = [], setForm, isView }) {
  const [input, setInput] = useState("");

  const addService = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Prevent duplicates
    if (services.includes(trimmed)) {
      setInput("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      services: [...(prev.services || []), trimmed],
    }));

    setInput("");
  };

  const removeService = (index) => {
    setForm((prev) => ({
      ...prev,
      services: (prev.services || []).filter((_, i) => i !== index),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addService();
    }
  };

  return (
    <div className={styles.card}>
      <h3>Services</h3>

      <div className={styles.pillsContainer}>
        {services.length > 0
          ? services.map((service, index) => (
              <span key={index} className={styles.servicePill}>
                {service}
                {!isView && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          : isView && <p className={styles.noService}>No services added</p>}
      </div>

      {!isView && (
        <div className={styles.formGroup}>
          <input
            type="text"
            value={input}
            placeholder="Type service and press Enter"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
}
