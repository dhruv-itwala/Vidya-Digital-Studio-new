import React from "react";
import "./FloorSection.css";

export default function FloorSection({ bg, children }) {
  return (
    <section className="floorSection" style={{ backgroundImage: `url(${bg})` }}>
      <div className="floorInner">{children}</div>
    </section>
  );
}
