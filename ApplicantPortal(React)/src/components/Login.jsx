import React, { useState } from 'react';
import PropTypes from "prop-types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import './Login.css';

// PUBLIC_INTERFACE
export default function Login({ onClose, onSwitchToSignup, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose}>×</button>
        <h2>
          <FontAwesomeIcon icon={faKey} /> Login
        </h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <FontAwesomeIcon icon={faEnvelope} className="auth-form__icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
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
          <button className="auth-form__submit">Log in</button>
        </form>
        <div className="auth-modal__switch">
          New to Portal? <button onClick={onSwitchToSignup} className="auth-link-btn">Sign Up</button>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSwitchToSignup: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
};
