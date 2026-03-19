import React, { useState } from 'react';
import PropTypes from "prop-types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import './Login.css';

// PUBLIC_INTERFACE
export default function Signup({ onClose, onSwitchToLogin, onSignup }) {
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await onSignup(fullname, email, password);
    } catch (err) {
      setError(err?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose}>×</button>
        <h2>
          <FontAwesomeIcon icon={faUser} /> Sign Up
        </h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <FontAwesomeIcon icon={faUser} className="auth-form__icon" />
            <input
              type="text"
              placeholder="Full Name"
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              required
            />
          </div>
          <div className="auth-form__group">
            <FontAwesomeIcon icon={faEnvelope} className="auth-form__icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-form__group">
            <FontAwesomeIcon icon={faKey} className="auth-form__icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && <div className="auth-form__error">{error}</div>}
          <button className="auth-form__submit">Sign Up</button>
        </form>
        <div className="auth-modal__switch">
          Have an account? <button onClick={onSwitchToLogin} className="auth-link-btn">Login</button>
        </div>
      </div>
    </div>
  );
}

Signup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
  onSignup: PropTypes.func.isRequired,
};
