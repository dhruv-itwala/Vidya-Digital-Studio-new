// src/components/ServiceSelector/ServiceSelector.jsx
import React, { useEffect, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import useServicePrices from "../../hooks/useServicePrices";
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

const ServiceSelector = ({ validateServiceAdd, lockedCategory }) => {
  const { control } = useFormContext();
  const { append, update, fields } = useFieldArray({
    control,
    name: "services",
  });

  const { servicePrices, loading, error } = useServicePrices();
  const { getValues } = useFormContext();

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

  // LOCAL STATE
  const [category, setCategory] = useState("");
  const [service, setService] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [optionKey, setOptionKey] = useState("");
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Reset when changing category
  useEffect(() => {
    setService("");
    setSelectedData(null);
    setQuantity("");
    setOptionKey("");
    setCalculatedTotal(0);
  }, [category]);

  // Load service details
  useEffect(() => {
    if (category && service && servicePrices[category]?.[service]) {
      const data = servicePrices[category][service];
      setSelectedData(data);
      setQuantity("");
      setOptionKey("");
      setCalculatedTotal(0);
    }
  }, [service]);

  // Calculate total
  useEffect(() => {
    if (!selectedData) return;

    let total = 0;
    if (selectedData.priceType === "fixed") total = selectedData.price;
    else if (unitTypes.includes(selectedData.priceType))
      total = quantity * selectedData.price;
    else if (selectedData.priceType === "range")
      total = selectedData.priceRange[0];
    else if (selectedData.priceType === "multiOption")
      total = selectedData.options[optionKey] || 0;

    setCalculatedTotal(Number(total) || 0);
  }, [quantity, optionKey, selectedData]);

  // MAIN ACTION: ADD SERVICE
  const handleAdd = () => {
    if (!category || !service || !selectedData)
      return alert("Select category & service");

    const item = {
      id: selectedData.id,
      category,
      service,
      description: selectedData.description || "",
      quantity: selectedData.priceType === "fixed" ? 1 : Number(quantity),
      option: selectedData.priceType === "multiOption" ? optionKey : null,
      unitPrice: selectedData.price || 0,
      total: calculatedTotal,
    };

    // Validate CP/CD logic
    if (!validateServiceAdd(item)) return;

    // MERGE logic inside RHF
    const current = getValues("services") || [];

    const existingIndex = current.findIndex(
      (it) =>
        it.category === item.category &&
        it.service === item.service &&
        (it.option || "") === (item.option || "") &&
        it.unitPrice === item.unitPrice
    );

    if (existingIndex !== -1) {
      const merged = {
        ...fields[existingIndex],
        quantity: fields[existingIndex].quantity + item.quantity,
        total:
          (fields[existingIndex].quantity + item.quantity) * item.unitPrice,
      };
      update(existingIndex, merged);
    } else {
      append(item);
    }

    // reset local UI
    setCategory("");
    setService("");
    setSelectedData(null);
    setQuantity("");
    setOptionKey("");
    setCalculatedTotal(0);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load services</p>;

  const services =
    category && servicePrices[category]
      ? Object.keys(servicePrices[category])
      : [];

  return (
    <div className={styles.selectorBox}>
      <h3>Add Service</h3>

      {/* CATEGORY */}
      <label className={styles.label}>Category</label>
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
          <label className={styles.label}>Service</label>
          <select
            className={styles.select}
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </>
      )}

      {/* MULTI-OPTION */}
      {selectedData?.priceType === "multiOption" && (
        <>
          <label className={styles.label}>Option</label>
          <select
            className={styles.select}
            value={optionKey}
            onChange={(e) => setOptionKey(e.target.value)}
          >
            <option value="">Select Option</option>
            {Object.keys(selectedData.options).map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </>
      )}

      {/* QUANTITY */}
      {selectedData && unitTypes.includes(selectedData.priceType) && (
        <>
          <label className={styles.label}>Quantity</label>
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
