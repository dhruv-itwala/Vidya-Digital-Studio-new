// src/components/QuoteUserBuilderForm/QuoteUserBuilderForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import useQuoteSystem from "../../modules/QuoteSystem";
import useServicePrices from "../../hooks/useServicePrices";
import QuoteSummary from "../QuoteSummary/QuoteSummary";

import Step1Client from "./steps/Step1Client";
import Step2Categories from "./steps/Step2Categories";
import StepServiceSelection from "./steps/StepServiceSelection";

import styles from "./QuoteUserBuilderForm.module.css";
import UnderMaintenance from "../PNF/UnderMaintenance";

const SPECIAL_CATEGORIES = ["Content Production", "Content Distribution"];

const QuoteUserBuilderForm = () => {
  const {
    client,
    setClient,
    reset: resetSystem,
  } = useQuoteSystem({
    isAdmin: false,
  });

  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: client.name || "",
      email: client.email || "",
      contact: client.contact || "",
      designation: client.designation || "",
      address: client.address || "",
      duration: client.duration || "",
      notes: "",
      services: [],
      isApproved: false,
    },
  });

  const { watch, setValue } = methods;

  // sync -> global QuoteSystem
  useEffect(() => {
    const sub = watch((v) => {
      setClient({
        name: v.name,
        email: v.email,
        contact: v.contact,
        designation: v.designation,
        address: v.address,
        duration: v.duration,
        isApproved: v.isApproved,
      });
    });
    return () => sub.unsubscribe();
  }, [watch, setClient]);

  const { servicePrices, loading, error } = useServicePrices();

  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [serviceSelections, setServiceSelections] = useState({}); // { [category]: [items] }

  const hasSelectedCategories = selectedCategories.length > 0;

  const lastServiceStep = useMemo(
    () => 2 + selectedCategories.length,
    [selectedCategories.length]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  // flatten service selections -> react-hook-form "services"
  useEffect(() => {
    const flat = Object.entries(serviceSelections).flatMap(
      ([category, items]) =>
        items.map((item) => ({
          category,
          service: item.service,
          id: item.id,
          description: item.description || "",
          quantity: item.quantity,
          option: item.option || null,
          unitPrice: item.unitPrice,
          total: item.total,
        }))
    );
    setValue("services", flat, { shouldDirty: true });
  }, [serviceSelections, setValue]);

  const goNext = async () => {
    // validate step-wise
    if (step === 1) {
      const ok = await methods.trigger(["name", "email"]);
      if (!ok) return;
    }
    if (step === 2 && !hasSelectedCategories) {
      // Step2 shows its own inline error
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleResetAll = () => {
    methods.reset({
      name: "",
      email: "",
      contact: "",
      designation: "",
      address: "",
      duration: "",
      notes: "",
      services: [],
      isApproved: false,
    });
    setSelectedCategories([]);
    setServiceSelections({});
    setStep(1);
    resetSystem();
  };

  const categoryList = useMemo(() => {
    if (!servicePrices) return [];
    return Object.keys(servicePrices).filter((key) => key !== "_id");
  }, [servicePrices]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <p>Loading services…</p>
      </div>
    );
  }

  if (error) {
    return <UnderMaintenance error={error} />;
  }

  // which category step are we on?
  let currentCategory = null;
  if (step >= 3 && step <= lastServiceStep) {
    currentCategory = selectedCategories[step - 3];
  }

  const isOnSummary = step === lastServiceStep + 1;

  return (
    <FormProvider {...methods}>
      <div className={styles.wrapper}>
        {/* STEP HEADER / STEPPER */}
        <div className={styles.stepper}>
          <div
            className={`${styles.stepItem} ${
              step >= 1 ? styles.stepItemActive : ""
            }`}
          >
            <div className={styles.stepCircle}>1</div>
            <div className={styles.stepLabel}>Your Details</div>
          </div>

          <div
            className={`${styles.stepItem} ${
              step >= 2 ? styles.stepItemActive : ""
            }`}
          >
            <div className={styles.stepCircle}>2</div>
            <div className={styles.stepLabel}>Categories</div>
          </div>

          {selectedCategories.map((c, idx) => (
            <div
              key={c}
              className={`${styles.stepItem} ${
                step >= 3 + idx ? styles.stepItemActive : ""
              }`}
            >
              <div className={styles.stepCircle}>{3 + idx}</div>
              <div className={styles.stepLabel}>
                {c.length > 16 ? `${c.slice(0, 16)}…` : c}
              </div>
            </div>
          ))}

          <div
            className={`${styles.stepItem} ${
              isOnSummary ? styles.stepItemActive : ""
            }`}
          >
            <div className={styles.stepCircle}>
              {Math.max(lastServiceStep + 1, 3)}
            </div>
            <div className={styles.stepLabel}>Summary</div>
          </div>
        </div>

        <div className={styles.stepContent}>
          {step === 1 && <Step1Client onNext={goNext} />}

          {step === 2 && (
            <Step2Categories
              categories={categoryList}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              specialCategories={SPECIAL_CATEGORIES}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentCategory && (
            <StepServiceSelection
              key={currentCategory}
              category={currentCategory}
              services={servicePrices[currentCategory] || {}}
              existing={serviceSelections[currentCategory] || []}
              onSave={(items) =>
                setServiceSelections((prev) => ({
                  ...prev,
                  [currentCategory]: items,
                }))
              }
              onNext={goNext}
              onBack={goBack}
              isLast={step === lastServiceStep}
              isMonthlyCategory={SPECIAL_CATEGORIES.includes(currentCategory)}
            />
          )}

          {isOnSummary && (
            <div className={styles.summaryStep}>
              <h2 className={styles.title}>Review &amp; Generate Quote</h2>
              <p className={styles.subTitle}>
                Check your selections, accept the policies, and generate a
                ready-to-share quotation.
              </p>

              {/* 🔙 BACK BUTTON ON SUMMARY */}
              <div className={styles.navRow}>
                <button
                  className={styles.ghostBtn}
                  type="button"
                  onClick={goBack}
                >
                  Back
                </button>
              </div>

              <QuoteSummary isAdmin={false} resetSystem={handleResetAll} />
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
};

export default QuoteUserBuilderForm;
