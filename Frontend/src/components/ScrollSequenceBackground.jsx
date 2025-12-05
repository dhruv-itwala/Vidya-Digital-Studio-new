// src/components/ScrollSequenceBackground.jsx
import React, { useEffect, useState } from "react";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 7560; // Terrace + 6 floors * 1080 + Footer
const TERRACE_HEIGHT = 140; // 540 px terrace in design
const FOOTER_HEIGHT = 540; // 320 px footer in design
const FLOOR_HEIGHT = 1080;

const IMAGE_WIDTH = 1920; // Real measured width of your PNG
const INNER_WIDTH = 1400; // Usable center area width
const SIDE_PADDING = (IMAGE_WIDTH - INNER_WIDTH) / 2; // ~260px

const ScrollSequenceBackground = ({ image, floors = 6 }) => {
  const [offset, setOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const updateDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", updateDevice);
    updateDevice();

    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // Accurate scaling
      const scale = isMobile
        ? vh / FLOOR_HEIGHT // MOBILE zoom to fill height
        : vw / DESIGN_WIDTH;

      const scaledImageHeight = DESIGN_HEIGHT * scale;

      const scrollTop = window.scrollY;
      const totalScroll = floors * vh;

      const clamped = Math.max(0, Math.min(scrollTop, totalScroll));
      const segmentIndex = Math.floor(clamped / vh);
      const localT = (clamped - segmentIndex * vh) / vh;

      const getFloorCenter = (i) => {
        const y = TERRACE_HEIGHT + (i + 0.5) * FLOOR_HEIGHT;
        return y * scale;
      };

      const currY = getFloorCenter(segmentIndex);
      const nextY = getFloorCenter(Math.min(segmentIndex + 1, floors - 1));

      let centerY = currY + (nextY - currY) * localT;

      // ★ FIX TERRACE CUTOFF ★
      const NAVBAR_HEIGHT = 90; // measure exactly from UI
      if (segmentIndex === 0) {
        centerY += NAVBAR_HEIGHT / 2;
      }

      let newOffset = centerY - vh / 2;

      const maxOffset = scaledImageHeight - vh;
      newOffset = Math.max(0, Math.min(newOffset, maxOffset));

      setOffset(newOffset);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [floors, isMobile]);

  // Compute scale again for the <img> size
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const scale = isMobile ? vh / FLOOR_HEIGHT : vw / DESIGN_WIDTH;

  const imgWidth = DESIGN_WIDTH * scale;
  const imgHeight = DESIGN_HEIGHT * scale;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      <img
        src={image}
        alt="Building"
        style={{
          position: "absolute",
          left: "50%",
          transform: `translate(-50%, -${offset}px)`,

          // Desktop
          ...(isMobile === false && {
            top: 0,
            width: imgWidth,
            height: imgHeight,
            objectFit: "contain",
            objectPosition: "center top",
          }),

          // Mobile
          ...(isMobile && {
            position: "absolute",
            top: 0,
            left: `calc(50% - ${SIDE_PADDING * scale}px)`,
            width: imgWidth,
            height: imgHeight,
            objectFit: "cover",
            objectPosition: "center center",
          }),
        }}
      />
    </div>
  );
};

export default ScrollSequenceBackground;
