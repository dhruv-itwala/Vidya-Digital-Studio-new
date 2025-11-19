// src/components/QuoteSummary/QuoteSummary.jsx
import React, { useMemo, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import PopupModal from "../UI/PopupModal";
import { generateQuote } from "../../utils/api.endpoints";
import styles from "../styles/quote.module.css";
import useQuoteSystem from "../../modules/QuoteSystem";

import { FiEdit, FiTrash, FiSave, FiX } from "react-icons/fi";

const QuoteSummary = ({ isAdmin }) => {
  const { watch, reset: resetForm, control } = useFormContext();
  const { reset: resetSystem } = useQuoteSystem({ isAdmin });

  const { update, remove } = useFieldArray({
    control,
    name: "services",
  });

  const services = watch("services") || [];

  /** MERGE SERVICES */
  const merged = useMemo(() => {
    const map = {};
    services.forEach((s, index) => {
      const key = `${s.category}|${s.service}|${s.option || ""}|${s.unitPrice}`;
      if (!map[key]) {
        map[key] = { ...s, _indexes: [index] };
      } else {
        map[key].quantity += Number(s.quantity);
        map[key].total = map[key].quantity * map[key].unitPrice;
        map[key]._indexes.push(index);
      }
    });
    return Object.values(map);
  }, [services]);

  /** INLINE EDITING (Admin only) */
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleSave = (mergedIndex) => {
    const row = merged[mergedIndex];
    const newTotal = Number(editValue);

    row._indexes.forEach((idx) => {
      update(idx, {
        ...services[idx],
        total: newTotal,
      });
    });

    setEditIndex(null);
  };

  /** MODAL */
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [pdfUrl, setPdfUrl] = useState("");

  const subtotal = merged.reduce((a, b) => a + Number(b.total), 0);

  /** GENERATE PDF */
  const handleGenerate = async () => {
    const form = watch();

    setModalOpen(true);
    setStatus("loading");

    try {
      const payload = {
        client: {
          name: form.name,
          email: form.email,
          contact: form.contact,
          designation: form.designation,
          address: form.address,
        },
        items: merged,
        duration: form.duration || "",
        notes: Array.isArray(form.notes)
          ? form.notes
          : (form.notes || "")
              .split("\n")
              .map((n) => n.trim())
              .filter((n) => n.length > 0),
      };

      const res = await generateQuote(payload);

      if (res?.data?.success) {
        setStatus("success");
        setPdfUrl(res.data.pdfUrl);
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  /** CLOSE MODAL → RESET FORM ON SUCCESS */
  const closeModal = () => {
    const wasSuccess = status === "success";

    setModalOpen(false);
    setStatus("idle");
    setPdfUrl("");

    if (wasSuccess) {
      resetForm({
        name: "",
        email: "",
        contact: "",
        designation: "",
        address: "",
        duration: "",
        notes: "",
        services: [],
      });
      resetSystem();
    }
  };

  if (merged.length === 0) return null;

  return (
    <>
      <div className={styles.summaryBox}>
        <h3>Summary</h3>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Service</th>
                <th>Qty</th>
                <th>Total</th>

                {/* ADMIN ONLY → show Edit column */}
                {isAdmin && <th>Edit</th>}

                {/* DELETE column (always visible) */}
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {merged.map((row, i) => (
                <tr key={i}>
                  <td>{row.category}</td>
                  <td>{row.service}</td>
                  <td>{row.quantity}</td>

                  <td>
                    {editIndex === i ? (
                      <input
                        className={styles.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    ) : (
                      <>₹{row.total}</>
                    )}
                  </td>

                  {/* EDIT CELL (only admin) */}
                  {isAdmin && (
                    <td className={styles.actionsCell}>
                      {editIndex === i ? (
                        <>
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleSave(i)}
                          >
                            <FiSave size={18} />
                          </button>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setEditIndex(null)}
                          >
                            <FiX size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          className={styles.iconBtn}
                          onClick={() => {
                            setEditIndex(i);
                            setEditValue(row.total);
                          }}
                        >
                          <FiEdit size={18} />
                        </button>
                      )}
                    </td>
                  )}

                  {/* DELETE CELL (always visible) */}
                  <td className={styles.deleteCell}>
                    <button
                      className={styles.iconBtnDanger}
                      onClick={() =>
                        row._indexes
                          .slice()
                          .sort((a, b) => b - a)
                          .forEach((idx) => remove(idx))
                      }
                    >
                      <FiTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.totalText}>
          Subtotal: <strong>₹{subtotal}</strong>
        </p>

        <button className={styles.pdfBtn} onClick={handleGenerate}>
          Generate Quotation PDF
        </button>
      </div>

      {/* MODAL */}
      <PopupModal
        open={modalOpen}
        status={status}
        email={watch("email")}
        pdfUrl={pdfUrl}
        onClose={closeModal}
      />
    </>
  );
};

export default QuoteSummary;
