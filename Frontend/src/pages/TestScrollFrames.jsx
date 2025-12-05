import React, { useEffect, useRef, useState } from "react";

export default function TestScrollFrames() {
  const TOTAL_FRAMES = 185;
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [frame, setFrame] = useState(1);

  const getFrameSrc = (i) => `/frames/frame_${String(i).padStart(6, "0")}.webp`;

  // 1️⃣ Preload frames
  useEffect(() => {
    const imgs = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      imgs.push(img);
    }
    imagesRef.current = imgs;
    setLoaded(true);
  }, []);

  // 2️⃣ Canvas draw logic
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawFrame = (index) => {
      const img = imagesRef.current[index - 1];
      if (!img) return;

      const cw = canvas.width;
      const ch = canvas.height;

      const iw = img.width;
      const ih = img.height;

      // Keep aspect ratio
      const scale = Math.min(cw / iw, ch / ih);
      const w = iw * scale;
      const h = ih * scale;

      const x = (cw - w) / 2;
      const y = (ch - h) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, w, h);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [loaded, frame]);

  // 3️⃣ Wheel scroll triggers frame update (GLOBAL)
  useEffect(() => {
    const wheelHandler = (e) => {
      const dir = e.deltaY > 0 ? 1 : -1;

      setFrame((prev) => {
        let next = prev + dir;
        if (next < 1) next = 1;
        if (next > TOTAL_FRAMES) next = TOTAL_FRAMES;

        console.log("Frame:", next, "URL:", getFrameSrc(next));

        return next;
      });
    };

    window.addEventListener("wheel", wheelHandler, { passive: true });

    return () => {
      window.removeEventListener("wheel", wheelHandler);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "200vh" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "black",
          zIndex: 1,
        }}
      />
    </div>
  );
}
