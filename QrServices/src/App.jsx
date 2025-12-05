import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RedirectToYoutube from "./components/RedirectingComponents/RedirectToYoutube";
import RedirectToInstagram from "./components/RedirectingComponents/RedirectToInstagram";
import BusinessCard from "./components/BusinessCard/BusinessCard";
import "./App.css";
import PageNotFound from "./Pages/PageNotFound";
import UnderMaintenance from "./components/PNF/UnderMaintenance";
const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<BusinessCard />} />
        <Route
          path="/freezariaacafe"
          element={<RedirectToInstagram username="freezeriaacafe" />}
        />
        <Route
          path="/3D-Apartment-Showcase"
          element={<RedirectToYoutube url="https://youtu.be/k78M0EBs9zY" />}
        />
        <Route path="/404" element={<PageNotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/maintenance" element={<UnderMaintenance err={true} />} />
      </Routes>
    </>
  );
};

export default App;
