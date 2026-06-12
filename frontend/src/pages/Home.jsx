import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = '/api';

const Home = ({ setAuth }) => {
  const [user, setUser]           = useState(null);
  const [todos, setTodos]         = useState([]);
  const [order, setOrder]         = useState([]);
  const [completedOrder, setCompletedOrder] = useState([]);
  const [newTitle, setNewTitle]   = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading]     = useState(false);

  // Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [logoutModal, setLogoutModal] = useState(false);

  // ── True ghost-drag state ──────────────────────────────────────────────────
  const dragId          = useRef(null);
  const dragGroup       = useRef(null);
  const originIndex     = useRef(null);
  const longPressTimer  = useRef(null);
  const ghostRef        = useRef(null);
  const ghostOffset     = useRef({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState(null);
  const [overIndex,  setOverIndex]  = useState(null);
  const [overGroup,  setOverGroup]  = useState(null);

  const navigate = useNavigate();

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

  useEffect(() => { if (user) fetchTodos(); }, [user]);

  const fetchTodos = async () => {
    const res = await fetch(`${API_BASE}/todos/`);
    if (!res.ok) return;
    const data = await res.json();
    setTodos(data);
    setOrder(prev => {
      const existing = new Set(prev);
      const newIds = data.filter(t => !t.completed).map(t => t.id);
      const retained = prev.filter(id => newIds.includes(id));
      const added    = newIds.filter(id => !existing.has(id));
      return [...added, ...retained];
    });
    setCompletedOrder(prev => {
      const existing = new Set(prev);
      const newIds = data.filter(t => t.completed).map(t => t.id);
      const retained = prev.filter(id => newIds.includes(id));
      const added    = newIds.filter(id => !existing.has(id));
      return [...added, ...retained];
    });
  };

  const todoMap = Object.fromEntries(todos.map(t => [t.id, t]));
  const sortedTodos = [
    ...order.filter(id => todoMap[id] && !todoMap[id].completed).map(id => todoMap[id]),
    ...completedOrder.filter(id => todoMap[id]?.completed).map(id => todoMap[id]),   // L77: optional chain
  ];

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/todos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) { setNewTitle(''); fetchTodos(); }
    setLoading(false);
  };

  const handleToggle = async (todo) => {
    await fetch(`${API_BASE}/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    // L100: positive condition first (no negated condition)
    if (todo.completed) {
      setCompletedOrder(prev => prev.filter(id => id !== todo.id));
      setOrder(prev => [todo.id, ...prev.filter(id => id !== todo.id)]);
    } else {
      setOrder(prev => prev.filter(id => id !== todo.id));
      setCompletedOrder(prev => [todo.id, ...prev.filter(id => id !== todo.id)]);
    }
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
  };

  const handleEditSave = async (id) => {
    if (!editTitle.trim()) return;
    await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setEditingId(null);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, title: editTitle.trim() } : t));
  };

  // ── Delete with confirmation ───────────────────────────────────────────────
  const requestDelete = (id) => setDeleteModal({ open: true, id });

  const confirmDelete = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null });
    await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
    setOrder(prev => prev.filter(x => x !== id));
    setCompletedOrder(prev => prev.filter(x => x !== id));
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // ── Logout with confirmation ───────────────────────────────────────────────
  const confirmLogout = async () => {
    setLogoutModal(false);
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    setAuth(false);
    navigate('/login');
  };

  // ── Ghost-drag helpers ─────────────────────────────────────────────────────
  const removeGhost = () => {
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
  };

  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const startLongPress = useCallback((id, group, idx, e) => {
    if (['BUTTON', 'INPUT'].includes(e.target.tagName)) return;
    e.preventDefault();
    cancelLongPress();
    longPressTimer.current = setTimeout(() => {
      dragId.current      = id;
      dragGroup.current   = group;
      originIndex.current = idx;
      setDraggingId(id);

      const sourceEl = document.querySelector(`[data-todo-id="${id}"]`);
      if (sourceEl) {
        const rect  = sourceEl.getBoundingClientRect();
        const ghost = sourceEl.cloneNode(true);
        ghost.id = 'drag-ghost';
        ghost.style.cssText = `
          position: fixed;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: ${rect.width}px;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.85;
          transform: scale(1.03) rotate(1deg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          transition: transform 0.1s ease;
          border-color: var(--accent-color);
        `;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? rect.left;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? rect.top;
        ghostOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }
    }, 350);
  }, []);

  const moveGhost = useCallback((clientX, clientY) => {
    if (!ghostRef.current) return;
    ghostRef.current.style.top  = `${clientY - ghostOffset.current.y}px`;
    ghostRef.current.style.left = `${clientX - ghostOffset.current.x}px`;

    ghostRef.current.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY)?.closest('.todo-item');
    ghostRef.current.style.display = '';

    if (!el) { setOverIndex(null); setOverGroup(null); return; }

    const grp = el.classList.contains('completed') ? 'completed' : 'incomplete';
    const groupItems = [...document.querySelectorAll('.todo-item')]
      .filter(i => grp === 'completed' ? i.classList.contains('completed') : !i.classList.contains('completed'));
    const gIdx = groupItems.indexOf(el);
    if (gIdx !== -1) { setOverIndex(gIdx); setOverGroup(grp); }
  }, []);

  const commitDrop = useCallback(() => {
    removeGhost();
    if (!dragId.current) return;
    const id    = dragId.current;
    const group = dragGroup.current;

    if (overGroup === group && overIndex !== null) {
      const setter = group === 'incomplete' ? setOrder : setCompletedOrder;
      setter(prev => {
        const arr  = [...prev];
        const from = arr.indexOf(id);
        if (from === -1) return arr;
        arr.splice(from, 1);
        arr.splice(overIndex, 0, id);
        return arr;
      });
    }

    setDraggingId(null); setOverIndex(null); setOverGroup(null);
    dragId.current = null; dragGroup.current = null; originIndex.current = null;
  }, [overIndex, overGroup]);

  const endDrag = useCallback(() => {
    cancelLongPress();
    if (draggingId) commitDrop();
  }, [draggingId, commitDrop]);

  // Global mouse/touch move & up — use globalThis instead of window (L243-L251)
  useEffect(() => {
    const onMove = (e) => {
      if (!dragId.current) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x != null) moveGhost(x, y);
    };
    const onUp = () => { if (dragId.current) endDrag(); };

    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup',   onUp);
    globalThis.addEventListener('touchmove', onMove, { passive: false });
    globalThis.addEventListener('touchend',  onUp);
    return () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup',   onUp);
      globalThis.removeEventListener('touchmove', onMove);
      globalThis.removeEventListener('touchend',  onUp);
    };
  }, [moveGhost, endDrag]);

  // ─────────────────────────────────────────────────────────────────────────
  if (!user) return <div className="title" style={{ marginTop: '2rem' }}>Loading...</div>;

  const remaining      = todos.filter(t => !t.completed).length;
  const incompleteList = order.filter(id => todoMap[id] && !todoMap[id].completed).map(id => todoMap[id]);
  const completedList  = completedOrder.filter(id => todoMap[id]?.completed).map(id => todoMap[id]);  // L260: optional chain

  const renderItem = (todo, idx, group) => {
    const isDragging   = draggingId === todo.id;
    const isDropTarget = overGroup === group && overIndex === idx && draggingId && draggingId !== todo.id;
    return (
      <li
        key={todo.id}
        data-todo-id={todo.id}
        className={`todo-item${todo.completed ? ' completed' : ''}${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`}
        onMouseDown={(e) => startLongPress(todo.id, group, idx, e)}
        onTouchStart={(e) => startLongPress(todo.id, group, idx, e)}
        onMouseLeave={cancelLongPress}
      >
        <button
          type="button"
          className="drag-handle"
          title="Hold to drag"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startLongPress(todo.id, group, idx, e); }}
          aria-label="Drag to reorder"
        >⠿</button>
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
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave(todo.id)}
              autoFocus
            />
            <button className="btn-icon" onClick={() => handleEditSave(todo.id)} title="Save">✓</button>
            <button className="btn-icon" onClick={() => setEditingId(null)} title="Cancel">✕</button>
          </>
        ) : (
          <>
            <span className="todo-title">{todo.title}</span>
            <button className="btn-icon" onClick={() => { setEditingId(todo.id); setEditTitle(todo.title); }} title="Edit">✎</button>
            <button className="btn-icon btn-delete" onClick={() => requestDelete(todo.id)} title="Delete">
              <Trash2 size={15} />
            </button>
          </>
        )}
      </li>
    );
  };

  return (
    <>
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="btn-confirm-danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />
      <ConfirmModal
        isOpen={logoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        confirmClass="btn-confirm-danger"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutModal(false)}
      />

      <div className="todo-container" style={{ userSelect: draggingId ? 'none' : 'auto' }}>
        <div className="todo-header">
          <div>
            <h1 className="title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>My Todos</h1>
            <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
              {/* L332: positive condition first — no negated condition */}
              Hey {user.username} · {remaining} task{remaining === 1 ? '' : 's'} remaining
            </p>
          </div>
          <button onClick={() => setLogoutModal(true)} className="btn-icon btn-logout" title="Logout">
            <LogOut size={18} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="todo-add-form">
          <input
            type="text"
            className="form-input"
            placeholder="Add a new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-add" disabled={loading}>{loading ? '...' : '+'}</button>
        </form>

        <ul className="todo-list" aria-label="Todo items">
          {sortedTodos.length === 0 && <li className="todo-empty">No tasks yet. Add one above!</li>}
          {incompleteList.map((todo, idx) => renderItem(todo, idx, 'incomplete'))}
          {completedList.map((todo, idx)  => renderItem(todo, idx, 'completed'))}
        </ul>
      </div>
    </>
  );
};

Home.propTypes = {
  setAuth: PropTypes.func.isRequired,
};

export default Home;
