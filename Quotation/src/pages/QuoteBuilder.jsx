import React from "react";
import { Route, Routes } from "react-router-dom";
import QuoteUserBuilderForm from "../components/QuoteUserBuilderForm/QuoteUserBuilderForm";
import QuoteAdminBuilderForm from "../components/QuoteAdminBuilderForm/QuoteAdminBuilderForm";
import PageNotFound from "./PageNotFound";

const QuoteBuilder = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<QuoteUserBuilderForm />} />
        <Route path="/admin" element={<QuoteAdminBuilderForm />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

export default QuoteBuilder;
