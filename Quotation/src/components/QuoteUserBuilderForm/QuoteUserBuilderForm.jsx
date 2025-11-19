// src/components/QuoteUserBuilderForm/QuoteUserBuilderForm.jsx
import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import useQuoteSystem from "../../modules/QuoteSystem";

import ServiceSelector from "../ServiceSelector/ServiceSelector";
import QuoteSummary from "../QuoteSummary/QuoteSummary";

import styles from "./QuoteUserBuilderForm.module.css";

const QuoteUserBuilderForm = () => {
  const { client, setClient, validateServiceAdd, lockedCategory } =
    useQuoteSystem({ isAdmin: false });

  const methods = useForm({
    defaultValues: {
      name: client.name,
      email: client.email,
      contact: client.contact,
      designation: client.designation,
      address: client.address,
      duration: client.duration,
      services: [],
    },
  });

  const { register, watch } = methods;

  // Sync to QuoteSystem
  useEffect(() => {
    const sub = watch((v) => {
      setClient({
        name: v.name,
        email: v.email,
        contact: v.contact,
        designation: v.designation,
        address: v.address,
        duration: v.duration,
      });
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <FormProvider {...methods} reset={methods.reset}>
      <div className={styles.wrapper}>
        <h2 className={styles.title}>Get Your Custom Quote</h2>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Name</label>
            <input
              className={styles.input}
              {...register("name")}
              placeholder="Your full name"
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              className={styles.input}
              {...register("email")}
              placeholder="Your email address"
            />
          </div>

          <div className={styles.field}>
            <label>Contact</label>
            <input
              className={styles.input}
              {...register("contact")}
              placeholder="Your contact number"
            />
          </div>

          <div className={styles.field}>
            <label>Designation</label>
            <input
              className={styles.input}
              {...register("designation")}
              placeholder="Your designation"
            />
          </div>

          <div className={styles.fieldFull}>
            <label>Address</label>
            <input
              className={styles.input}
              {...register("address")}
              placeholder="Your address"
            />
          </div>
        </div>

        <ServiceSelector
          validateServiceAdd={validateServiceAdd}
          lockedCategory={lockedCategory}
        />

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

        <QuoteSummary isAdmin={false} />
      </div>
    </FormProvider>
  );
};

export default QuoteUserBuilderForm;
