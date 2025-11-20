// src/components/QuoteSummary/QuoteSummary.jsx
import React, { useMemo, useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import PopupModal from "../UI/PopupModal";
import { FiEdit, FiTrash, FiSave, FiX } from "react-icons/fi";
import { generateQuote } from "../../utils/api.endpoints";
import useQuoteSystem from "../../modules/QuoteSystem";
import styles from "../styles/quote.module.css";
import { toast } from "react-toastify";

const QuoteSummary = ({ isAdmin, resetSystem }) => {
  const { watch, reset: resetForm, control, setValue } = useFormContext();
  // const { reset: resetSystem } = useQuoteSystem();

  const { update, remove } = useFieldArray({ control, name: "services" });

  const services = watch("services") || [];
  const isApproved = watch("isApproved") || false;

  /** MERGED SERVICES */
  const merged = useMemo(() => {
    const map = {};
    services.forEach((s, idx) => {
      const key = `${s.category}|${s.service}|${s.option || ""}|${s.unitPrice}`;
      if (!map[key]) map[key] = { ...s, _indexes: [idx] };
      else {
        map[key].quantity += Number(s.quantity);
        map[key].total = map[key].quantity * map[key].unitPrice;
        map[key]._indexes.push(idx);
      }
    });
    return Object.values(map);
  }, [services]);

  /** INLINE EDIT */
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleSave = (mergedIndex) => {
    const row = merged[mergedIndex];
    row._indexes.forEach((idx) => {
      update(idx, { ...services[idx], total: Number(editValue) });
    });
    setEditIndex(null);
  };

  /** DELETE */
  const handleDelete = (row) => {
    row._indexes
      .slice()
      .sort((a, b) => b - a)
      .forEach((idx) => remove(idx));

    const after = watch("services");
    if (!after || after.length === 0) resetSystem();
  };

  /** MODAL */
  const [modalOpen, setModal] = useState(false);
  const [status, setStatus] = useState("idle");
  const [pdfUrl, setPdfUrl] = useState("");

  const subtotal = merged.reduce((a, b) => a + Number(b.total), 0);

  /** PDF GENERATION */
  const handleGenerate = async () => {
    const form = watch();

    if (!form.isApproved) {
      return toast.error(
        "You must accept terms & conditions before continuing."
      );
    }

    setModal(true);
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
        notes: (form.notes || "")
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n),

        // 🔥 NEW
        isAdmin: isAdmin === true,
        isApproved: form.isApproved === true,
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

  const closeModal = () => {
    const ok = status === "success";
    setModal(false);
    setStatus("idle");
    setPdfUrl("");

    if (ok) {
      resetForm({
        name: "",
        email: "",
        contact: "",
        designation: "",
        address: "",
        duration: "",
        notes: "",
        isApproved: false,
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
                {isAdmin && <th>Edit</th>}
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

                  {isAdmin && (
                    <td style={{ display: "flex", gap: "10px" }}>
                      {editIndex === i ? (
                        <>
                          <FiSave
                            size={30}
                            className={styles.iconBtn}
                            onClick={() => handleSave(i)}
                          />

                          <FiX
                            size={30}
                            className={styles.iconBtn}
                            onClick={() => setEditIndex(null)}
                          />
                        </>
                      ) : (
                        <FiEdit
                          size={30}
                          className={styles.iconBtn}
                          onClick={() => {
                            setEditIndex(i);
                            setEditValue(row.total);
                          }}
                        />
                      )}
                    </td>
                  )}

                  <td className={styles.deleteCell}>
                    <FiTrash
                      size={30}
                      className={styles.iconBtnDanger}
                      onClick={() => handleDelete(row)}
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="5" className={styles.subtotalText}>
                  Your Subtotal is <span>₹{subtotal}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* <p className={styles.totalText}>
          Subtotal: <strong>₹{subtotal}</strong>
        </p> */}

        {/* NEW CHECKBOX */}
        <div className={styles.checkboxWrap}>
          <input
            type="checkbox"
            checked={!!isApproved}
            onChange={(e) => setValue("isApproved", e.target.checked)}
          />
          <label>I accept the terms & conditions</label>
        </div>

        <button className={styles.pdfBtn} onClick={handleGenerate}>
          Generate Quotation PDF
        </button>
      </div>

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
