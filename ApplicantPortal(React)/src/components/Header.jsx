import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuildingColumns, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import "./Header.css";

// PUBLIC_INTERFACE
export default function Header({ onLoginClick }) {
  /** Header bar with logo/title and nav links */
  return (
    <header className="header">
      <div className="header__logo">
        <FontAwesomeIcon icon={faBuildingColumns} size="2x" className="header__icon" />
        <span className="header__title">BusinessLoan Portal</span>
      </div>
      <nav className="header__nav">
        <a href="#features" className="header__navlink">
          Features
        </a>
        <a href="#about" className="header__navlink">
          About
        </a>
        <button onClick={onLoginClick} className="header__loginbtn">
          <FontAwesomeIcon icon={faSignInAlt} />
          Login / Signup
        </button>
      </nav>
    </header>
  );
}
