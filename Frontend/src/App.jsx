import React from "react";
import CustomCursor from "./utils/Cursor/CustomCursor";
import ScrollToTop from "./utils/ScrollToTop";
import WhatsAppButton from "./utils/Whatsapp/WhatsAppButton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Footer from "./components/Footer/Footer";
import Homepage from "./pages/Homepage";
import PortfolioPage from "./pages/PortfolioPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicies from "./pages/PrivacyPolicies";
import ContactUsPage from "./pages/ContactUsPage";
import PageNotFound from "./pages/PageNotFound";
import UnderMaintenancePage from "./pages/UnderMaintenancePage";
import Navbar from "./components/Navbar/Navbar";
import { Navigate, Route, Routes } from "react-router-dom";
import Overlay from "./components/Overlay/Overlay";

const App = () => {
  return (
    <div className="app">
      {/* Custom Utils */}
      <CustomCursor />
      <ScrollToTop />
      <Overlay />
      {/* Navbar */}
      {/* <Navbar /> */}

      {/* Main Content */}
      <Routes>
        {/* Primary Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policies" element={<PrivacyPolicies />} />

        {/* Custom Routes */}

        {/* Service Routes */}
        <Route path="/404" element={<PageNotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/maintenance" element={<UnderMaintenancePage />} />
      </Routes>

      {/* Footer */}
      {/* <Footer /> */}

      {/* Custom Utils */}
      {/* <WhatsAppButton /> */}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
