import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordField, { isPasswordValid } from '../components/PasswordField';

const API_BASE = '/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError('Password does not meet all the requirements shown below.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        let message = 'Unable to register. Please try again.';
        try {
          const data = await res.json();
          if (data.detail) message = data.detail;
        } catch {
          // Server returned non-JSON (e.g. 502 HTML error page)
          if (res.status === 400) message = 'Username already taken. Please choose another.';
          else if (res.status === 503 || res.status === 502) message = 'Service is temporarily unavailable. Please try again shortly.';
        }
        throw new Error(message);
      }
      setSuccess('Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">Create Account</h1>
      <p className="subtitle">Join our platform today</p>
      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          {/* L50: label associated with input via htmlFor/id */}
          <label className="form-label" htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} showRules />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="footer-text">
        Already have an account?{' '}
        {/* L66: native button instead of non-interactive span with onClick */}
        <button type="button" className="link" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );
};

export default Register;
