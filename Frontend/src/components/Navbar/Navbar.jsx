import React from "react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <div className="masterContainer">
      <div className={styles.navbar}>
        <ul>
          <li>Home</li>
          <li>About Us</li>
          <li>Projects</li>
          <li>Contact</li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
