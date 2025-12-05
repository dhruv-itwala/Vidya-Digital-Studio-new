// src/pages/Homepage.jsx
import React from "react";
import CD from "../components/CD";
import building from "../assets/media/Building.png";
import ScrollSequenceBackground from "../components/ScrollSequenceBackground";

const SERVICES = [
  "CD — Content + 3D Model",
  "Service 2",
  "Service 3",
  "Service 4",
  "Service 5",
  "Service 6",
];

const Homepage = () => {
  return (
    <>
      {/* Scroll-synced building background */}
      <ScrollSequenceBackground image={building} floors={7} />

      {/* MAIN PAGE CONTENT */}
      <main style={{ position: "relative", zIndex: 5 }}>
        {SERVICES.map((title, index) => (
          <section key={index} className="floorSection">
            <CD title={title} />
          </section>
        ))}
      </main>
    </>
  );
};

export default Homepage;
