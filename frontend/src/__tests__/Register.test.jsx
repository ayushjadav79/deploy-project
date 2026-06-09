import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderRegister = () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
};

describe('Register page', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('renders the sign in navigation link', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error when password does not meet requirements', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText(/password does not meet/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows success message on successful registration', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Test@123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('shows server error on duplicate username', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Username already registered' }),
    });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'taken' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Test@123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Username already registered')).toBeInTheDocument();
    });
  });

  it('disables button while loading', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderRegister();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Test@123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();
    });
  });

  it('calls fetch with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    renderRegister();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'myuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Test@123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'myuser', password: 'Test@123' }),
        })
      );
    });
  });
});
