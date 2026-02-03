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
  "perRender",
  "perDesign",
];

const ServiceSelector = ({
  validateServiceAdd,
  lockedCategory,
  resetSystem,
  isAdmin,
}) => {
  const { getValues, control, watch } = useFormContext();
  const { append, update } = useFieldArray({ control, name: "services" });

  const { servicePrices, loading, error } = useServicePrices();
  const servicesList = watch("services") || [];

  /** UNLOCK */
  useEffect(() => {
    if (servicesList.length === 0 && lockedCategory) resetSystem();
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

  // Standard service selector states
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

  /** AUTO TOTAL */
  useEffect(() => {
    if (!selectedData) return;

    let t = 0;
    if (selectedData.priceType === "fixed") t = selectedData.price;
    else if (unitTypes.includes(selectedData.priceType))
      t = quantity * selectedData.price;
    else if (selectedData.priceType === "range") t = selectedData.priceRange[0];
    // else if (selectedData.priceType === "multiOption")
    // t = selectedData.options[optionKey];
    else if (selectedData.priceType === "multiOption")
      t = selectedData.options?.[optionKey] || 0;

    setTotal(Number(t) || 0);
  }, [quantity, optionKey, selectedData]);

  /** ADD SERVICE */
  const handleAdd = () => {
    if (!category || !service || !selectedData)
      return alert("Select a service properly.");

    const newItem = {
      category,
      service,
      id: selectedData.id,
      description: selectedData.description || "",
      quantity: selectedData.priceType === "fixed" ? 1 : Number(quantity),
      option: selectedData.priceType === "multiOption" ? optionKey : null,
      // unitPrice: selectedData.price || 0,
      unitPrice:
        selectedData.priceType === "multiOption"
          ? selectedData.options?.[optionKey] || 0
          : selectedData.price || 0,

      total: calculatedTotal,
    };

    if (!validateServiceAdd(newItem)) return;

    const current = getValues("services") || [];
    const idx = current.findIndex(
      (it) =>
        it.category === newItem.category &&
        it.service === newItem.service &&
        (it.option || "") === (newItem.option || "") &&
        it.unitPrice === newItem.unitPrice,
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

    // Clear
    setCategory("");
    setService("");
    setSelectedData(null);
    setQuantity("");
    setOptionKey("");
    setTotal(0);
  };

  /** -------------------------
   * CUSTOM ROW LOGIC
   * ------------------------ */

  const [showCustom, setShowCustom] = useState(false);

  const [custom, setCustom] = useState({
    category: "",
    service: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });

  /** Handle custom input updates */
  const updateCustom = (field, value) => {
    const newData = { ...custom, [field]: value };

    // auto-update total
    if (field === "quantity" || field === "unitPrice") {
      newData.total = Number(newData.quantity) * Number(newData.unitPrice);
    }

    setCustom(newData);
  };

  /** Save custom row */
  const saveCustom = () => {
    if (
      !custom.category ||
      !custom.service ||
      !custom.quantity ||
      !custom.unitPrice
    ) {
      alert("Fill all required custom fields");
      return;
    }

    append({
      ...custom,
      id: "custom_" + Date.now(),
      option: null,
    });

    // reset
    setCustom({
      category: "",
      service: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
    setShowCustom(false);
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

      {/* -------------------------
        NORMAL SERVICE SELECTOR
      -------------------------- */}

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

      {selectedData && (
        <p className={styles.totalBox}>
          Total: <strong>₹{calculatedTotal}</strong>
        </p>
      )}

      <div className={styles.selectorActions}>
        <button className={styles.addButton} onClick={handleAdd}>
          Add Service
        </button>
        {isAdmin && (
          <button
            className={styles.addButton}
            onClick={() => setShowCustom(!showCustom)}
          >
            Add Custom Row
          </button>
        )}
      </div>

      {/* ------------------------- CUSTOM ROW FIELDS -------------------------- */}

      {showCustom && (
        <div className={styles.customBox}>
          <h4>Add Custom Entry</h4>
          <label>Category</label>
          <input
            className={styles.input}
            placeholder="Category"
            value={custom.category}
            onChange={(e) => updateCustom("category", e.target.value)}
          />

          <label>Service</label>
          <input
            className={styles.input}
            placeholder="Service"
            value={custom.service}
            onChange={(e) => updateCustom("service", e.target.value)}
          />

          <label>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Description (optional)"
            value={custom.description}
            onChange={(e) => updateCustom("description", e.target.value)}
          />

          <label>Quantity</label>
          <input
            type="number"
            className={styles.input}
            placeholder="Quantity"
            min="1"
            value={custom.quantity}
            onChange={(e) => updateCustom("quantity", Number(e.target.value))}
          />

          <label>Unit Price</label>
          <input
            type="number"
            className={styles.input}
            placeholder="Unit Price"
            min="1"
            value={custom.unitPrice}
            onChange={(e) => updateCustom("unitPrice", Number(e.target.value))}
          />

          <p className={styles.totalBox}>
            Total: <strong>₹{custom.total}</strong>
          </p>

          <div className={styles.customActions}>
            <button className={styles.saveCustom} onClick={saveCustom}>
              Add
            </button>
            <button
              className={styles.cancelCustom}
              onClick={() => setShowCustom(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
