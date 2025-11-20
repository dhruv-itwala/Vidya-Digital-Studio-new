// src/components/ServiceSelector/ServiceSelector.jsx
import React, { useEffect, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import useServicePrices from "../../hooks/useServicePrices";
import useQuoteSystem from "../../modules/QuoteSystem";
import styles from "../styles/quote.module.css";

const SPECIAL = ["Content Production", "Content Distribution"];
const unitTypes = [
  "perWord",
  "perPage",
  "perPost",
  "perVideo",
  "perScript",
  "perReel",
  "perMinute",
  "perSecond",
  "perPlatform",
  "perItem",
  "perScreen",
  "perAd",
];

const ServiceSelector = ({
  validateServiceAdd,
  lockedCategory,
  resetSystem,
}) => {
  const { getValues, control, watch } = useFormContext();
  const { append, update } = useFieldArray({ control, name: "services" });

  // const { reset: resetSystem } = useQuoteSystem();
  const { servicePrices, loading, error } = useServicePrices();

  const servicesList = watch("services") || [];

  /** 🟢 FIXED — Unlock category when last item removed */
  useEffect(() => {
    if (servicesList.length === 0 && lockedCategory) {
      resetSystem(); // unlock CP/CD
    }
  }, [servicesList.length]);

  const categories = Object.keys(servicePrices || {});

  const filteredCategories = categories.filter((cat) => {
    if (!lockedCategory) return true;
    if (lockedCategory === "Content Production")
      return cat === "Content Production";
    if (lockedCategory === "Content Distribution")
      return cat === "Content Distribution";
    if (lockedCategory === "normal") return !SPECIAL.includes(cat);
    return true;
  });

  // LOCAL UI STATE
  const [category, setCategory] = useState("");
  const [service, setService] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [optionKey, setOptionKey] = useState("");
  const [calculatedTotal, setTotal] = useState(0);

  useEffect(() => {
    setService("");
    setSelectedData(null);
    setQuantity("");
    setOptionKey("");
    setTotal(0);
  }, [category]);

  useEffect(() => {
    if (!category || !service) return;
    const d = servicePrices[category]?.[service];
    setSelectedData(d || null);
    setQuantity("");
    setOptionKey("");
    setTotal(0);
  }, [service]);

  // calculate total
  useEffect(() => {
    if (!selectedData) return;

    let t = 0;
    if (selectedData.priceType === "fixed") t = selectedData.price;
    else if (unitTypes.includes(selectedData.priceType))
      t = quantity * selectedData.price;
    else if (selectedData.priceType === "range") t = selectedData.priceRange[0];
    else if (selectedData.priceType === "multiOption")
      t = selectedData.options[optionKey] || 0;

    setTotal(Number(t) || 0);
  }, [quantity, optionKey, selectedData]);

  /** ADD SERVICE */
  const handleAdd = () => {
    if (!category || !service || !selectedData)
      return alert("Select service first");

    const newItem = {
      category,
      service,
      id: selectedData.id,
      description: selectedData.description || "",
      quantity: selectedData.priceType === "fixed" ? 1 : Number(quantity),
      option: selectedData.priceType === "multiOption" ? optionKey : null,
      unitPrice: selectedData.price || 0,
      total: calculatedTotal,
    };

    if (!validateServiceAdd(newItem)) return;

    /** 🟢 FIXED MERGE — use fresh RHF values */
    const current = getValues("services") || [];

    const idx = current.findIndex(
      (it) =>
        it.category === newItem.category &&
        it.service === newItem.service &&
        (it.option || "") === (newItem.option || "") &&
        it.unitPrice === newItem.unitPrice
    );

    if (idx !== -1) {
      update(idx, {
        ...current[idx],
        quantity: current[idx].quantity + newItem.quantity,
        total: (current[idx].quantity + newItem.quantity) * newItem.unitPrice,
      });
    } else {
      append(newItem);
    }

    // reset UI
    setCategory("");
    setService("");
    setSelectedData(null);
    setQuantity("");
    setOptionKey("");
    setTotal(0);
  };

  if (loading) return <p>Loading services…</p>;
  if (error) return <p>Failed to load services</p>;

  const serviceNames =
    category && servicePrices[category]
      ? Object.keys(servicePrices[category])
      : [];

  return (
    <div className={styles.selectorBox}>
      <h3>Add Service</h3>

      {/* CATEGORY */}
      <label>Category</label>
      <select
        className={styles.select}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        {filteredCategories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      {/* SERVICE */}
      {category && (
        <>
          <label>Service</label>
          <select
            className={styles.select}
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Select Service</option>
            {serviceNames.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </>
      )}

      {/* OPTIONS */}
      {selectedData?.priceType === "multiOption" && (
        <>
          <label>Option</label>
          <select
            className={styles.select}
            value={optionKey}
            onChange={(e) => setOptionKey(e.target.value)}
          >
            <option value="">Select</option>
            {Object.keys(selectedData.options).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </>
      )}

      {/* QUANTITY */}
      {selectedData && unitTypes.includes(selectedData.priceType) && (
        <>
          <label>Quantity</label>
          <input
            type="number"
            className={styles.input}
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(e.target.value)}
          />
        </>
      )}

      {/* TOTAL */}
      {selectedData && (
        <p className={styles.totalBox}>
          Total: <strong>₹{calculatedTotal}</strong>
        </p>
      )}

      <button className={styles.addButton} onClick={handleAdd}>
        Add Service
      </button>
    </div>
  );
};

export default ServiceSelector;
