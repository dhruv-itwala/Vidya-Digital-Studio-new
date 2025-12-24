import { useEffect, useState } from "react";

export const Typewriter = ({ phrases = [], speed = 100, pause = 1200 }) => {
  const [text, setText] = useState("");
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [typing, setTyping] = useState(true); // typing or deleting
  const [charIndex, setCharIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return; // <-- prevent error
    const current = phrases[currentPhrase];
    if (!current) return; // safety check

    let timeout;

    if (typing) {
      if (charIndex < current.length) {
        timeout = setTimeout(() => {
          setText(current.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, speed);
      } else {
        // Hold after finishing typing
        timeout = setTimeout(() => setTyping(false), pause);
      }
    } else {
      if (charIndex > 0) {
        const deleteSpeed = speed / 1.5 + Math.random() * 50;
        timeout = setTimeout(() => {
          setText(current.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, deleteSpeed);
      } else {
        // Move to next phrase
        setTyping(true);
        setCurrentPhrase((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, typing, currentPhrase, phrases, speed, pause]);

  return (
    <span>
      {text}
      {showCursor && "|"}
    </span>
  );
};
