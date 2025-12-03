import React, { useState, useEffect } from "react";
import Step1Client from "./steps/Step1Client";
import Step2Categories from "./steps/Step2Categories";
import StepServiceSelection from "./steps/StepServiceSelection";
import StepSummary from "./steps/StepSummary";

const QuoteWizard = ({ apiData }) => {
  const [step, setStep] = useState(1);

  const [client, setClient] = useState({
    name: "",
    email: "",
    contact: "",
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [serviceSelections, setServiceSelections] = useState({});
  // e.g. { "Content Writing": [{...}, ...], "Content Strategy": [...] }

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  // Build all service-step pages dynamically
  const categorySteps = selectedCategories.map((cat, i) => ({
    stepNumber: 3 + i,
    category: cat,
  }));

  const lastServiceStep = 2 + selectedCategories.length;

  return (
    <>
      {step === 1 && (
        <Step1Client client={client} setClient={setClient} goNext={goNext} />
      )}

      {step === 2 && (
        <Step2Categories
          apiData={apiData}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          goNext={goNext}
          goBack={goBack}
        />
      )}

      {categorySteps.map((cs, index) =>
        step === cs.stepNumber ? (
          <StepServiceSelection
            key={cs.category}
            category={cs.category}
            services={apiData[cs.category]}
            selected={serviceSelections[cs.category] || []}
            setSelected={(data) =>
              setServiceSelections({
                ...serviceSelections,
                [cs.category]: data,
              })
            }
            goNext={goNext}
            goBack={goBack}
            isLast={index === categorySteps.length - 1}
          />
        ) : null
      )}

      {step === lastServiceStep + 1 && (
        <StepSummary
          client={client}
          selections={serviceSelections}
          goBack={goBack}
        />
      )}
    </>
  );
};

export default QuoteWizard;
