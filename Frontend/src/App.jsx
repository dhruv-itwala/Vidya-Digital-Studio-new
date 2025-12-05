import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import CustomCursor from "./utils/Cursor/CustomCursor";
import ScrollToTop from "./utils/ScrollToTop";

import Homepage from "./pages/Homepage";
import PortfolioPage from "./pages/PortfolioPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicies from "./pages/PrivacyPolicies";
import ContactUsPage from "./pages/ContactUsPage";
import PageNotFound from "./pages/PageNotFound";
import UnderMaintenancePage from "./pages/UnderMaintenancePage";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import TestScrollFrames from "./pages/TestScrollFrames";

const App = () => {
  return (
    <>
      {/* Core Utilities */}
      <CustomCursor />
      <ScrollToTop />

      <Navbar />

      {/* App Routes */}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/test" element={<TestScrollFrames />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policies" element={<PrivacyPolicies />} />

        {/* System Pages */}
        <Route path="/maintenance" element={<UnderMaintenancePage />} />
        <Route path="/404" element={<PageNotFound />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>

      <Footer />

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
};

export default App;
