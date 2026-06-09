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
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
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
      {success && <div className="error-msg" style={{ color: '#10b981' }}>{success}</div>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
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
        <span className="link" onClick={() => navigate('/login')}>Sign In</span>
      </div>
    </div>
  );
};

export default Register;
