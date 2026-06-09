import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Check } from 'lucide-react';

// Password rules — single source of truth
export const PASSWORD_RULES = [
  { id: 'length',  label: '8–14 characters',          test: (p) => p.length >= 8 && p.length <= 14 },
  { id: 'upper',   label: 'At least one uppercase',    test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least one lowercase',    test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number',       test: (p) => /\d/.test(p) },
  { id: 'special', label: 'At least one special char', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const isPasswordValid = (p) => PASSWORD_RULES.every((r) => r.test(p));

const PasswordField = ({ value, onChange, showRules = false }) => {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={inputId}>Password</label>
      <div className="password-wrapper">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className="form-input"
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="eye-btn"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showRules && (
        <ul className="pw-rules">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li key={rule.id} className={`pw-rule ${ok ? 'pw-rule--ok' : ''}`}>
                <span className="pw-rule-icon">
                  {ok ? <Check size={12} /> : <span className="pw-dot" />}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

PasswordField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  showRules: PropTypes.bool,
};

export default PasswordField;
