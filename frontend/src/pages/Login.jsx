import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import PasswordField, { isPasswordValid } from '../components/PasswordField';

const API_BASE = '/api';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError('Password does not meet the requirements below.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        let message = 'Unable to login. Please try again.';
        try {
          const data = await res.json();
          if (data.detail) message = data.detail;
        } catch {
          // Server returned non-JSON (e.g. 502 HTML error page)
          if (res.status === 401) message = 'Invalid username or password.';
          else if (res.status === 503 || res.status === 502) message = 'Service is temporarily unavailable. Please try again shortly.';
        }
        throw new Error(message);
      }
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">Welcome Back</h1>
      <p className="subtitle">Sign in to your account</p>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          {/* L48: label associated with input via htmlFor/id */}
          <label className="form-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} showRules />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="footer-text">
        Don&apos;t have an account?{' '}
        {/* L64: native button instead of non-interactive span with onClick */}
        <button type="button" className="link" onClick={() => navigate('/register')}>Register</button>
      </div>
    </div>
  );
};

Login.propTypes = {
  setAuth: PropTypes.func.isRequired,
};

export default Login;
