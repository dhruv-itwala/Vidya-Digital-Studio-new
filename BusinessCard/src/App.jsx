import React from "react";
import { Route, Routes } from "react-router-dom";
import RedirectToYoutube from "./components/RedirectingComponents/RedirectToYoutube";
import RedirectToInstagram from "./components/RedirectingComponents/RedirectToInstagram";
import BusinessCard from "./components/BusinessCard/BusinessCard";
import "./App.css";
const App = () => {
  return (
    <>
      <Routes>
        <Route path="/business-card" element={<BusinessCard />} />
        <Route
          path="/freezariaacafe"
          element={<RedirectToInstagram username="freezeriaacafe" />}
        />
        <Route
          path="/3D-Apartment-Showcase"
          element={<RedirectToYoutube url="https://youtu.be/k78M0EBs9zY" />}
        />
      </Routes>
    </>
  );
};

export default App;
