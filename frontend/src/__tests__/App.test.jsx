import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// App uses BrowserRouter internally. We replace it with MemoryRouter so
// tests can control the initial path without nesting two Routers.
let memoryRouterProps = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => (
      <MemoryRouter {...memoryRouterProps}>{children}</MemoryRouter>
    ),
  };
});

// Import App AFTER the mock is set up
const { default: App } = await import('../App');

// Stub child pages so we don't need full API mocking
vi.mock('../pages/Login',    () => ({ default: () => <div>Login Page</div>    }));
vi.mock('../pages/Register', () => ({ default: () => <div>Register Page</div> }));
vi.mock('../pages/Home',     () => ({ default: () => <div>Home Page</div>     }));

const renderAt = (path) => {
  memoryRouterProps = { initialEntries: [path] };
  render(<App />);
};

describe('App routing', () => {
  it('renders Login page at /login', () => {
    renderAt('/login');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders Register page at /register', () => {
    renderAt('/register');
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  it('renders Home page at /', () => {
    renderAt('/');
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('redirects unknown paths to /login when unauthenticated', () => {
    renderAt('/unknown-route');
    // isAuthenticated starts false → Navigate to /login → Login page renders
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

