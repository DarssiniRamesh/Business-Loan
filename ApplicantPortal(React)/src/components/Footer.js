import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

// PUBLIC_INTERFACE
export default function Footer() {
  /** Professional footer with links and icons */
  return (
    <footer className="footer">
      <div className="footer__links">
        <a href="mailto:support@businessloan.com" target="_blank" rel="noopener noreferrer" aria-label="Email">
          <FontAwesomeIcon icon={faEnvelope} />
        </a>
        <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <FontAwesomeIcon icon={faLinkedin} />
        </a>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </div>
      <div className="footer__copy">© {new Date().getFullYear()} BusinessLoan Portal. All rights reserved.</div>
    </footer>
  );
}
