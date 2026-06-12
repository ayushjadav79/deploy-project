import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ── Helpers ────────────────────────────────────────────────────────────────
const userPayload   = { username: 'testuser' };
const todoIncomplete = { id: 1, title: 'Buy milk',   completed: false };
const todoCompleted  = { id: 2, title: 'Read book',  completed: true  };

/** Build a resolved fetch mock response */
const ok  = (data) => Promise.resolve({ ok: true,  json: async () => data });
const bad = (data) => Promise.resolve({ ok: false, json: async () => data });

/**
 * Render Home inside a MemoryRouter.
 * fetchSequence: ordered list of mock return values for global.fetch calls.
 *   [0] = /api/home   (user auth)
 *   [1] = /api/todos/ (initial todo list)
 *   additional entries are consumed by CRUD operations
 */
const renderHome = async (fetchSequence, setAuth = vi.fn()) => {
  fetchSequence.forEach((v) => mockFetch.mockResolvedValueOnce(v));
  await act(async () => {
    render(
      <MemoryRouter>
        <Home setAuth={setAuth} />
      </MemoryRouter>
    );
  });
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Home page', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigate.mockReset();
  });

  // ── Auth & initial load ──────────────────────────────────────────────────

  it('shows loading state before user data resolves', () => {
    // Provide a never-resolving promise so the component stays in loading state
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(
      <MemoryRouter>
        <Home setAuth={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to /login when auth check fails', async () => {
    const setAuth = vi.fn();
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await act(async () => {
      render(
        <MemoryRouter>
          <Home setAuth={setAuth} />
        </MemoryRouter>
      );
    });
    expect(setAuth).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the page header after successful auth', async () => {
    await renderHome([ok(userPayload), ok([])]);
    expect(screen.getByText('My Todos')).toBeInTheDocument();
    expect(screen.getByText(/hey testuser/i)).toBeInTheDocument();
  });

  it('shows empty state message when there are no todos', async () => {
    await renderHome([ok(userPayload), ok([])]);
    expect(screen.getByText('No tasks yet. Add one above!')).toBeInTheDocument();
  });

  it('renders incomplete todos fetched from the API', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('renders completed todos fetched from the API', async () => {
    await renderHome([ok(userPayload), ok([todoCompleted])]);
    expect(screen.getByText('Read book')).toBeInTheDocument();
  });

  it('renders both incomplete and completed todos', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete, todoCompleted])]);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Read book')).toBeInTheDocument();
  });

  // ── Task counter ─────────────────────────────────────────────────────────

  it('shows correct remaining task count (plural)', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete, { id: 3, title: 'Walk dog', completed: false }])]);
    expect(screen.getByText(/2 tasks remaining/i)).toBeInTheDocument();
  });

  it('shows singular "task" when exactly 1 remaining', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    expect(screen.getByText(/1 task remaining/i)).toBeInTheDocument();
  });

  it('shows 0 tasks remaining when all completed', async () => {
    await renderHome([ok(userPayload), ok([todoCompleted])]);
    // Component uses plural 's' for 0 (singular only for exactly 1)
    expect(screen.getByText(/0 tasks remaining/i)).toBeInTheDocument();
  });

  // ── Add todo ─────────────────────────────────────────────────────────────

  it('submitting an empty input does not call fetch', async () => {
    await renderHome([ok(userPayload), ok([])]);
    const btn = screen.getByRole('button', { name: /\+/ });
    fireEvent.click(btn);
    // Only the 2 setup fetches should have been called
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('adds a new todo on form submit', async () => {
    // POST ok, then re-fetch todos returns new list
    await renderHome([
      ok(userPayload),
      ok([]),
      ok({}),                         // POST /api/todos/
      ok([{ id: 10, title: 'New task', completed: false }]), // re-fetch
    ]);

    fireEvent.change(screen.getByPlaceholderText(/add a new task/i), {
      target: { value: 'New task' },
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /\+/ }).closest('form'));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/todos/',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('does not clear input when POST fails', async () => {
    await renderHome([
      ok(userPayload),
      ok([]),
      bad({ detail: 'error' }),       // POST fails
    ]);
    const input = screen.getByPlaceholderText(/add a new task/i);
    fireEvent.change(input, { target: { value: 'Failed task' } });
    await act(async () => {
      fireEvent.submit(input.closest('form'));
    });
    expect(input.value).toBe('Failed task');
  });

  // ── Toggle todo ──────────────────────────────────────────────────────────

  it('toggles an incomplete todo to completed', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete]), ok({})]);
    const checkbox = screen.getByRole('checkbox');
    await act(async () => { fireEvent.click(checkbox); });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/todos/${todoIncomplete.id}`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('toggles a completed todo back to incomplete', async () => {
    await renderHome([ok(userPayload), ok([todoCompleted]), ok({})]);
    const checkbox = screen.getByRole('checkbox');
    await act(async () => { fireEvent.click(checkbox); });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/todos/${todoCompleted.id}`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  // ── Edit todo ────────────────────────────────────────────────────────────

  it('clicking Edit enters edit mode showing an input', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByDisplayValue('Buy milk')).toBeInTheDocument();
  });

  it('clicking Cancel in edit mode exits edit mode', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByTitle('Cancel'));
    expect(screen.queryByDisplayValue('Buy milk')).not.toBeInTheDocument();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('saves edit on Save button click', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete]), ok({})]);
    fireEvent.click(screen.getByTitle('Edit'));
    const editInput = screen.getByDisplayValue('Buy milk');
    fireEvent.change(editInput, { target: { value: 'Buy oat milk' } });
    await act(async () => { fireEvent.click(screen.getByTitle('Save')); });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/todos/${todoIncomplete.id}`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('saves edit on Enter key press', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete]), ok({})]);
    fireEvent.click(screen.getByTitle('Edit'));
    const editInput = screen.getByDisplayValue('Buy milk');
    fireEvent.change(editInput, { target: { value: 'Buy almond milk' } });
    await act(async () => {
      fireEvent.keyDown(editInput, { key: 'Enter' });
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/todos/${todoIncomplete.id}`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('does not save edit when title is blank', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    fireEvent.click(screen.getByTitle('Edit'));
    const editInput = screen.getByDisplayValue('Buy milk');
    fireEvent.change(editInput, { target: { value: '   ' } });
    await act(async () => { fireEvent.click(screen.getByTitle('Save')); });
    // No PATCH call beyond the initial 2 setup fetches
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── Delete todo (with modal) ──────────────────────────────────────────────

  it('clicking delete icon opens the delete confirmation modal', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('cancelling the delete modal closes it without deleting', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete])]);
    fireEvent.click(screen.getByTitle('Delete'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2); // no DELETE call
  });

  it('confirming delete calls DELETE and removes the todo', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete]), ok({})]);
    fireEvent.click(screen.getByTitle('Delete'));
    await act(async () => {
      // Both the trash icon (title="Delete") and modal button share the name "Delete".
      // Pick the modal confirm button by its class.
      const deleteBtns = screen.getAllByRole('button', { name: 'Delete' });
      const modalConfirm = deleteBtns.find(btn => btn.classList.contains('btn-confirm-danger'));
      fireEvent.click(modalConfirm);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/todos/${todoIncomplete.id}`,
      expect.objectContaining({ method: 'DELETE' })
    );
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    });
  });

  // ── Logout (with modal) ───────────────────────────────────────────────────

  it('clicking the logout button opens the logout confirmation modal', async () => {
    await renderHome([ok(userPayload), ok([])]);
    fireEvent.click(screen.getByTitle('Logout'));
    // The modal heading uniquely identifies the modal
    expect(screen.getByRole('heading', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to logout/i)).toBeInTheDocument();
  });

  it('cancelling the logout modal closes it without logging out', async () => {
    await renderHome([ok(userPayload), ok([])]);
    fireEvent.click(screen.getByTitle('Logout'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/are you sure you want to logout/i)).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('confirming logout calls POST /api/logout and redirects', async () => {
    const setAuth = vi.fn();
    await renderHome([ok(userPayload), ok([]), ok({})], setAuth);
    fireEvent.click(screen.getByTitle('Logout'));
    await act(async () => {
      // Two buttons are named 'Logout': the icon button (title) and the modal confirm button.
      // The modal confirm button is the one inside the dialog — use getAllByRole and pick it.
      const logoutBtns = screen.getAllByRole('button', { name: 'Logout' });
      const modalConfirm = logoutBtns.find(btn => btn.classList.contains('btn-confirm-danger'));
      fireEvent.click(modalConfirm);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/logout',
      expect.objectContaining({ method: 'POST' })
    );
    expect(setAuth).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  // ── Drag handle ───────────────────────────────────────────────────────────

  it('renders a drag-handle button for each todo item', async () => {
    await renderHome([ok(userPayload), ok([todoIncomplete, todoCompleted])]);
    const handles = screen.getAllByRole('button', { name: /drag to reorder/i });
    expect(handles).toHaveLength(2);
  });
});
