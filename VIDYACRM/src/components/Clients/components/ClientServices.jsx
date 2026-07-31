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
    <>
      <h3 className={styles.sectionTitle}>Active Services</h3>

      <div className={styles.inputGroupFull}>
        <label>Services Provided to Client</label>
        
        <div className={isView ? "" : styles.tagInputWrapper} onClick={() => document.getElementById("clientServiceInput")?.focus()}>
          <div className={styles.tagsContainer}>
            {services.length > 0 ? (
              services.map((service, index) => (
                <span key={index} className={styles.serviceTag}>
                  {service}
                  {!isView && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeService(index);
                      }}
                      className={styles.removeTagBtn}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))
            ) : (
              isView && <span className={styles.emptyBlock} style={{padding: "16px", width: "100%", margin: 0}}>No services assigned.</span>
            )}

            {!isView && (
              <input
                id="clientServiceInput"
                type="text"
                value={input}
                placeholder={services.length ? "" : "Type a service and press Enter..."}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.tagInput}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
