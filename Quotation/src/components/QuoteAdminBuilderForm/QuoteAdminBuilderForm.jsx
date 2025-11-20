// src/components/QuoteAdminBuilderForm/QuoteAdminBuilderForm.jsx
import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import useQuoteSystem from "../../modules/QuoteSystem";
import ServiceSelector from "../ServiceSelector/ServiceSelector";
import QuoteSummary from "../QuoteSummary/QuoteSummary";
import styles from "./QuoteAdminBuilderForm.module.css";

const QuoteAdminBuilderForm = () => {
  const {
    client,
    setClient,
    validateServiceAdd,
    lockedCategory,
    reset: resetSystem,
  } = useQuoteSystem({ isAdmin: true });

  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: client.name,
      email: client.email,
      contact: client.contact,
      designation: client.designation,
      address: client.address,
      duration: client.duration,
      notes: Array.isArray(client.notes)
        ? client.notes.join("\n")
        : client.notes || "",
      services: [],
    },
  });

  const { register, watch } = methods;

  /** 🔥 Sync RHF ➝ QuoteSystem */
  useEffect(() => {
    const sub = watch((v) => {
      setClient({
        name: v.name,
        email: v.email,
        contact: v.contact,
        designation: v.designation,
        address: v.address,
        duration: v.duration,
        notes: v.notes,
      });
    });

    return () => sub.unsubscribe();
  }, []);

  return (
    <FormProvider {...methods} reset={methods.reset}>
      <div className={styles.wrapper}>
        <h2 className={styles.title}>Admin Quotation</h2>

        {/* CLIENT DETAILS */}
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Name *</label>
            <input
              className={`${styles.input} ${
                methods.formState.errors.name ? styles.inputError : ""
              }`}
              {...register("name", { required: "Name is required" })}
              placeholder="Client name"
            />
            {methods.formState.errors.name && (
              <p className={styles.errorText}>
                {methods.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label>Email *</label>
            <input
              className={`${styles.input} ${
                methods.formState.errors.email ? styles.inputError : ""
              }`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
              placeholder="Email address"
            />
            {methods.formState.errors.email && (
              <p className={styles.errorText}>
                {methods.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label>Contact *</label>
            <input
              className={`${styles.input} ${
                methods.formState.errors.contact ? styles.inputError : ""
              }`}
              {...register("contact", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Phone must be exactly 10 digits",
                },
              })}
              placeholder="Contact number"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {
                // Block non-numeric keys
                if (
                  !/[0-9]/.test(e.key) &&
                  e.key !== "Backspace" &&
                  e.key !== "Delete" &&
                  e.key !== "ArrowLeft" &&
                  e.key !== "ArrowRight" &&
                  e.key !== "Tab"
                ) {
                  e.preventDefault();
                }
              }}
            />

            {methods.formState.errors.contact && (
              <p className={styles.errorText}>
                {methods.formState.errors.contact.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label>Designation</label>
            <input
              className={styles.input}
              {...register("designation")}
              placeholder="Designation"
            />
          </div>

          <div className={styles.fieldFull}>
            <label>Address</label>
            <input
              className={styles.input}
              {...register("address")}
              placeholder="Address"
            />
          </div>

          {/* ========================== SERVICE SELECTOR ========================== */}
          <div className={styles.fieldFull}>
            <ServiceSelector
              validateServiceAdd={validateServiceAdd}
              lockedCategory={lockedCategory}
              resetSystem={resetSystem}
            />
          </div>

          {/* ========================== DURATION ========================== */}
          {(lockedCategory === "Content Production" ||
            lockedCategory === "Content Distribution") && (
            <div className={styles.fieldFull}>
              <label>Duration</label>
              <select className={styles.select} {...register("duration")}>
                <option value="">Select duration</option>
                <option>7 days</option>
                <option>15 days</option>
                <option>30 days</option>
                <option>2 months</option>
                <option>3 months</option>
                <option>6 months</option>
                <option>1 year</option>
              </select>
            </div>
          )}
        </div>

        {/* NOTES */}
        <div className={styles.fieldFull}>
          <label>Notes</label>{" "}
          <textarea
            className={styles.textarea}
            {...register("notes")}
            placeholder="Write each note on a new line..."
            rows={4}
          />
        </div>

        {/* SUMMARY */}
        <QuoteSummary isAdmin={true} resetSystem={resetSystem} />
      </div>
    </FormProvider>
  );
};

export default QuoteAdminBuilderForm;
