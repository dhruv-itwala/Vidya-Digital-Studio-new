// import React, { useEffect, useState } from "react";
// import styles from "../QuoteUserBuilderForm.module.css";

// const UNIT_TYPES = [
//   "perWord",
//   "perPage",
//   "perPost",
//   "perVideo",
//   "perScript",
//   "perReel",
//   "perMinute",
//   "perSecond",
//   "perPlatform",
//   "perItem",
//   "perScreen",
//   "perAd",
//   "perTemplate",
//   "perDesign",
//   "perBanner",
//   "perThumbnail",
// ];

// const StepServiceSelection = ({
//   category,
//   services,
//   existing,
//   onSave,
//   onNext,
//   onBack,
//   isLast,
//   isMonthlyCategory,
// }) => {
//   const [rows, setRows] = useState([]);

//   // build initial rows from API + existing selections
//   useEffect(() => {
//     const entries = Object.entries(services || {});
//     const initial = entries.map(([serviceName, data]) => {
//       const matched = existing?.find((e) => e.service === serviceName);
//       const baseUnitPrice =
//         data.priceType === "multiOption"
//           ? null
//           : data.price || matched?.unitPrice || 0;

//       return {
//         service: serviceName,
//         description: Array.isArray(data.description)
//           ? data.description.join(" ")
//           : data.description || "",
//         id: data.id,
//         priceType: data.priceType,
//         unit: data.unit || "",
//         options: data.options || null,
//         checked: !!matched,
//         quantity: matched?.quantity || (data.priceType === "fixed" ? 1 : 0),
//         option: matched?.option || "",
//         unitPrice: matched?.unitPrice || baseUnitPrice,
//         total: matched?.total || 0,
//       };
//     });
//     setRows(initial);
//   }, [category, services, existing]);

//   const recalcRow = (row) => {
//     let unitPrice = row.unitPrice;

//     if (row.priceType === "multiOption" && row.option && row.options) {
//       unitPrice = row.options[row.option] || 0;
//     } else if (row.priceType !== "multiOption") {
//       unitPrice = row.unitPrice ?? 0;
//     }

//     const qty =
//       row.checked && (row.quantity || row.priceType === "fixed")
//         ? row.quantity || 1
//         : 0;

//     const total = row.checked ? unitPrice * (qty || 1) : 0;

//     return {
//       ...row,
//       unitPrice,
//       quantity: qty || (row.priceType === "fixed" ? 1 : 0),
//       total,
//     };
//   };

//   const updateRow = (index, changes) => {
//     setRows((prev) => {
//       const copy = [...prev];
//       const merged = { ...copy[index], ...changes };
//       copy[index] = recalcRow(merged);
//       return copy;
//     });
//   };

//   const toggleChecked = (index) => {
//     setRows((prev) => {
//       const copy = [...prev];
//       let row = copy[index];

//       // turning on → default quantity and option if needed
//       if (!row.checked) {
//         let quantity = row.quantity;
//         if (!quantity || quantity <= 0) {
//           quantity = row.priceType === "fixed" ? 1 : 1;
//         }

//         let option = row.option;
//         if (row.priceType === "multiOption" && !option && row.options) {
//           option = Object.keys(row.options)[0];
//         }

//         row = { ...row, checked: true, quantity, option };
//       } else {
//         row = { ...row, checked: false, quantity: 0, total: 0 };
//       }

//       copy[index] = recalcRow(row);
//       return copy;
//     });
//   };

//   const handleNext = () => {
//     const selected = rows
//       .filter((r) => r.checked && r.total > 0)
//       .map((r) => ({
//         category,
//         service: r.service,
//         id: r.id,
//         description: r.description,
//         quantity: r.quantity || 1,
//         option: r.priceType === "multiOption" ? r.option : null,
//         unitPrice: r.unitPrice,
//         total: r.total,
//       }));

//     onSave(selected);
//     onNext();
//   };

//   const stepTitle = isMonthlyCategory
//     ? `${category} – Monthly Services`
//     : `${category} – Select Services`;

//   const stepSubtitle = isMonthlyCategory
//     ? "This quotation is for a 1-month duration. Enter service quantities based on your monthly requirement."
//     : "Choose the services you need under this category. You can adjust quantities per service.";

//   return (
//     <div className={styles.stepCard}>
//       <h2 className={styles.title}>{stepTitle}</h2>
//       <p className={styles.subTitle}>{stepSubtitle}</p>

//       <div className={styles.serviceList}>
//         {rows.map((row, idx) => {
//           const isUnitBased = UNIT_TYPES.includes(row.priceType);
//           const hasOptions = row.priceType === "multiOption";

//           return (
//             <div
//               key={row.service}
//               className={`${styles.serviceCard} ${
//                 row.checked ? styles.serviceCardSelected : ""
//               }`}
//             >
//               <div className={styles.serviceHeader}>
//                 <label className={styles.serviceCheckboxWrap}>
//                   <input
//                     type="checkbox"
//                     checked={row.checked}
//                     onChange={() => toggleChecked(idx)}
//                   />
//                   <span className={styles.serviceName}>{row.service}</span>
//                 </label>

//                 <div className={styles.servicePrice}>
//                   {row.unitPrice ? (
//                     <>
//                       ₹{row.unitPrice}
//                       {row.unit && (
//                         <span className={styles.serviceUnit}>
//                           {" "}
//                           / {row.unit}
//                         </span>
//                       )}
//                     </>
//                   ) : (
//                     "Select option"
//                   )}
//                 </div>
//               </div>

//               {row.description && (
//                 <ul className={styles.serviceDescList}>
//                   {row.description
//                     .split(".")
//                     .filter(Boolean)
//                     .map((item, index) => (
//                       <li key={index}>{item.trim()}.</li>
//                     ))}
//                 </ul>
//               )}

//               <div className={styles.serviceControlsRow}>
//                 {hasOptions && (
//                   <div className={styles.optionField}>
//                     <span className={styles.optionLabel}>Option</span>
//                     <select
//                       className={styles.select}
//                       value={row.option}
//                       disabled={!row.checked}
//                       onChange={(e) =>
//                         updateRow(idx, { option: e.target.value })
//                       }
//                     >
//                       <option value="">Select</option>
//                       {row.options &&
//                         Object.keys(row.options).map((opt) => (
//                           <option key={opt} value={opt}>
//                             {opt} – ₹{row.options[opt]}
//                           </option>
//                         ))}
//                     </select>
//                   </div>
//                 )}

//                 <div
//                   className={styles.qtyField}
//                   style={{ flexDirection: "column", alignItems: "flex-start" }}
//                 >
//                   <span className={styles.optionLabel}>Quantity</span>
//                   <div className={styles.qtyControl}>
//                     <button
//                       type="button"
//                       className={styles.qtyButton}
//                       disabled={!row.checked || row.quantity <= 1}
//                       onClick={() =>
//                         updateRow(idx, {
//                           quantity: Math.max(1, (row.quantity || 1) - 1),
//                         })
//                       }
//                     >
//                       –
//                     </button>
//                     <input
//                       type="number"
//                       min={row.priceType === "fixed" ? 1 : 0}
//                       className={styles.qtyInput}
//                       disabled={!row.checked}
//                       value={
//                         row.checked
//                           ? row.quantity || (row.priceType === "fixed" ? 1 : 0)
//                           : 0
//                       }
//                       onWheel={(e) => e.target.blur()}
//                       onChange={(e) =>
//                         updateRow(idx, {
//                           quantity: Math.max(
//                             row.priceType === "fixed" ? 1 : 0,
//                             Number(e.target.value) || 0
//                           ),
//                         })
//                       }
//                     />
//                     <button
//                       type="button"
//                       className={styles.qtyButton}
//                       disabled={!row.checked}
//                       onClick={() =>
//                         updateRow(idx, {
//                           quantity: (row.quantity || 0) + 1,
//                         })
//                       }
//                     >
//                       +
//                     </button>
//                   </div>
//                 </div>

//                 <div className={styles.totalField}>
//                   <span className={styles.optionLabel}>Total</span>
//                   <div className={styles.totalValue}>₹{row.total || 0}</div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className={styles.navRow}>
//         <button className={styles.ghostBtn} type="button" onClick={onBack}>
//           Back
//         </button>
//         <button
//           className={styles.primaryBtn}
//           type="button"
//           onClick={handleNext}
//         >
//           {isLast ? "Continue to Summary" : "Next Category"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default StepServiceSelection;

// src/components/QuoteUserBuilderForm/steps/StepServiceSelection.jsx
import React, { useEffect, useState } from "react";
import styles from "../QuoteUserBuilderForm.module.css";

const UNIT_TYPES = [
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
  "perTemplate",
  "perDesign",
  "perBanner",
  "perThumbnail",
];

const StepServiceSelection = ({
  category,
  services,
  existing,
  onSave,
  onNext,
  onBack,
  isLast,
  isMonthlyCategory,
}) => {
  const [rows, setRows] = useState([]);

  // build initial rows from API + existing selections
  useEffect(() => {
    const entries = Object.entries(services || {});
    const initial = entries.map(([serviceName, data]) => {
      const matched = existing?.find((e) => e.service === serviceName);
      const baseUnitPrice =
        data.priceType === "multiOption"
          ? null
          : data.price || matched?.unitPrice || 0;

      return {
        service: serviceName,
        description: Array.isArray(data.description)
          ? data.description.join(" ")
          : data.description || "",
        id: data.id,
        priceType: data.priceType,
        unit: data.unit || "",
        options: data.options || null,
        checked: !!matched,
        quantity: matched?.quantity || (data.priceType === "fixed" ? 1 : 0),
        option: matched?.option || "",
        unitPrice: matched?.unitPrice || baseUnitPrice,
        total: matched?.total || 0,
      };
    });
    setRows(initial);
  }, [category, services, existing]);

  const recalcRow = (row) => {
    let unitPrice = row.unitPrice;

    if (row.priceType === "multiOption" && row.option && row.options) {
      unitPrice = row.options[row.option] || 0;
    } else if (row.priceType !== "multiOption") {
      unitPrice = row.unitPrice ?? 0;
    }

    const qty =
      row.checked && (row.quantity || row.priceType === "fixed")
        ? row.quantity || 1
        : 0;

    const total = row.checked ? unitPrice * (qty || 1) : 0;

    return {
      ...row,
      unitPrice,
      quantity: qty || (row.priceType === "fixed" ? 1 : 0),
      total,
    };
  };

  const updateRow = (index, changes) => {
    setRows((prev) => {
      const copy = [...prev];
      const merged = { ...copy[index], ...changes };
      copy[index] = recalcRow(merged);
      return copy;
    });
  };

  const toggleChecked = (index) => {
    setRows((prev) => {
      const copy = [...prev];
      let row = copy[index];

      // turning on → default quantity and option if needed
      if (!row.checked) {
        let quantity = row.quantity;
        if (!quantity || quantity <= 0) {
          quantity = row.priceType === "fixed" ? 1 : 1;
        }

        let option = row.option;
        if (row.priceType === "multiOption" && !option && row.options) {
          option = Object.keys(row.options)[0];
        }

        row = { ...row, checked: true, quantity, option };
      } else {
        row = { ...row, checked: false, quantity: 0, total: 0 };
      }

      copy[index] = recalcRow(row);
      return copy;
    });
  };

  const buildSelectedPayload = () =>
    rows
      .filter((r) => r.checked && r.total > 0)
      .map((r) => ({
        category,
        service: r.service,
        id: r.id,
        description: r.description,
        quantity: r.quantity || 1,
        option: r.priceType === "multiOption" ? r.option : null,
        unitPrice: r.unitPrice,
        total: r.total,
      }));

  const handleNext = () => {
    const selected = buildSelectedPayload();
    onSave(selected);
    onNext();
  };

  // 🔙 NEW: save current selections even when going back
  const handleBack = () => {
    const selected = buildSelectedPayload();
    onSave(selected);
    onBack();
  };

  const stepTitle = isMonthlyCategory
    ? `${category} – Monthly Services`
    : `${category} – Select Services`;

  const stepSubtitle = isMonthlyCategory
    ? "This quotation is for a 1-month duration. Enter service quantities based on your monthly requirement."
    : "Choose the services you need under this category. You can adjust quantities per service.";

  return (
    <div className={styles.stepCard}>
      <h2 className={styles.title}>{stepTitle}</h2>
      <p className={styles.subTitle}>{stepSubtitle}</p>

      <div className={styles.serviceList}>
        {rows.map((row, idx) => {
          const hasOptions = row.priceType === "multiOption";

          return (
            <div
              key={row.service}
              className={`${styles.serviceCard} ${
                row.checked ? styles.serviceCardSelected : ""
              }`}
            >
              <div className={styles.serviceHeader}>
                <label className={styles.serviceCheckboxWrap}>
                  <input
                    type="checkbox"
                    checked={row.checked}
                    onChange={() => toggleChecked(idx)}
                  />
                  <span className={styles.serviceName}>{row.service}</span>
                </label>

                <div className={styles.servicePrice}>
                  {row.unitPrice ? (
                    <>
                      ₹{row.unitPrice}
                      {row.unit && (
                        <span className={styles.serviceUnit}>
                          {" "}
                          / {row.unit}
                        </span>
                      )}
                    </>
                  ) : (
                    "Select option"
                  )}
                </div>
              </div>

              {row.description && (
                <ul className={styles.serviceDescList}>
                  {row.description
                    .split(".")
                    .filter(Boolean)
                    .map((item, index) => (
                      <li key={index}>{item.trim()}.</li>
                    ))}
                </ul>
              )}

              <div className={styles.serviceControlsRow}>
                {hasOptions && (
                  <div className={styles.optionField}>
                    <span className={styles.optionLabel}>Option</span>
                    <select
                      className={styles.select}
                      value={row.option}
                      disabled={!row.checked}
                      onChange={(e) =>
                        updateRow(idx, { option: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      {row.options &&
                        Object.keys(row.options).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt} – ₹{row.options[opt]}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div
                  className={styles.qtyField}
                  style={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <span className={styles.optionLabel}>Quantity</span>
                  <div className={styles.qtyControl}>
                    <button
                      type="button"
                      className={styles.qtyButton}
                      disabled={!row.checked || row.quantity <= 1}
                      onClick={() =>
                        updateRow(idx, {
                          quantity: Math.max(1, (row.quantity || 1) - 1),
                        })
                      }
                    >
                      –
                    </button>
                    <input
                      type="number"
                      min={row.priceType === "fixed" ? 1 : 0}
                      className={styles.qtyInput}
                      disabled={!row.checked}
                      value={
                        row.checked
                          ? row.quantity || (row.priceType === "fixed" ? 1 : 0)
                          : 0
                      }
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) =>
                        updateRow(idx, {
                          quantity: Math.max(
                            row.priceType === "fixed" ? 1 : 0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={styles.qtyButton}
                      disabled={!row.checked}
                      onClick={() =>
                        updateRow(idx, {
                          quantity: (row.quantity || 0) + 1,
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.totalField}>
                  <span className={styles.optionLabel}>Total</span>
                  <div className={styles.totalValue}>₹{row.total || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.navRow}>
        <button className={styles.ghostBtn} type="button" onClick={handleBack}>
          Back
        </button>
        <button
          className={styles.primaryBtn}
          type="button"
          onClick={handleNext}
        >
          {isLast ? "Continue to Summary" : "Next Category"}
        </button>
      </div>
    </div>
  );
};

export default StepServiceSelection;
