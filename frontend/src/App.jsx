import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';

const API_BASE = '/api';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
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
          <label className="form-label">Username</label>
          <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="footer-text">
        Don't have an account? <span className="link" onClick={() => navigate('/register')}>Register</span>
      </div>
    </div>
  );
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="error-msg" style={{ color: '#10b981' }}>{success}</div>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="footer-text">
        Already have an account? <span className="link" onClick={() => navigate('/login')}>Sign In</span>
      </div>
    </div>
  );
};

const Home = ({ setAuth }) => {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch the logged-in user's profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/home`);
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data);
      } catch {
        setAuth(false);
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate, setAuth]);

  // Fetch todos once user is loaded
  useEffect(() => {
    if (!user) return;
    fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    const res = await fetch(`${API_BASE}/todos/`);
    if (res.ok) setTodos(await res.json());
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/todos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      setNewTitle('');
      fetchTodos();
    }
    setLoading(false);
  };

  const handleToggle = async (todo) => {
    await fetch(`${API_BASE}/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    fetchTodos();
  };

  const handleEditSave = async (id) => {
    if (!editTitle.trim()) return;
    await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setEditingId(null);
    fetchTodos();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    setAuth(false);
    navigate('/login');
  };

  if (!user) return <div className="title" style={{ marginTop: '2rem' }}>Loading...</div>;

  const remaining = todos.filter(t => !t.completed).length;

  return (
    <div className="todo-container">
      <div className="todo-header">
        <div>
          <h1 className="title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>
            My Todos
          </h1>
          <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
            Hey {user.username} · {remaining} task{remaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
        <button onClick={handleLogout} className="btn-icon" title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      <form onSubmit={handleAdd} className="todo-add-form">
        <input
          type="text"
          className="form-input"
          placeholder="Add a new task..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-add" disabled={loading}>
          {loading ? '...' : '+'}
        </button>
      </form>

      <ul className="todo-list">
        {todos.length === 0 && (
          <li className="todo-empty">No tasks yet. Add one above!</li>
        )}
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              className="todo-check"
              checked={todo.completed}
              onChange={() => handleToggle(todo)}
            />
            {editingId === todo.id ? (
              <>
                <input
                  className="form-input todo-edit-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEditSave(todo.id)}
                  autoFocus
                />
                <button className="btn-icon" onClick={() => handleEditSave(todo.id)} title="Save">✓</button>
                <button className="btn-icon" onClick={() => setEditingId(null)} title="Cancel">✕</button>
              </>
            ) : (
              <>
                <span className="todo-title">{todo.title}</span>
                <button className="btn-icon" onClick={() => { setEditingId(todo.id); setEditTitle(todo.title); }} title="Edit">✎</button>
                <button className="btn-icon btn-delete" onClick={() => handleDelete(todo.id)} title="Delete">🗑</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home setAuth={setIsAuthenticated} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
