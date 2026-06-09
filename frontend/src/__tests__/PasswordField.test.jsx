import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordField, { PASSWORD_RULES, isPasswordValid } from '../../components/PasswordField';

describe('isPasswordValid', () => {
  it('returns false for empty string', () => {
    expect(isPasswordValid('')).toBe(false);
  });

  it('returns false if shorter than 8 characters', () => {
    expect(isPasswordValid('Ab1!')).toBe(false);
  });

  it('returns false if longer than 14 characters', () => {
    expect(isPasswordValid('Abcdefghij1!xxx')).toBe(false);
  });

  it('returns false with no uppercase', () => {
    expect(isPasswordValid('abcdef1!')).toBe(false);
  });

  it('returns false with no lowercase', () => {
    expect(isPasswordValid('ABCDEF1!')).toBe(false);
  });

  it('returns false with no digit', () => {
    expect(isPasswordValid('Abcdefg!')).toBe(false);
  });

  it('returns false with no special character', () => {
    expect(isPasswordValid('Abcdef12')).toBe(false);
  });

  it('returns true for a fully valid password', () => {
    expect(isPasswordValid('Test@123')).toBe(true);
  });
});

describe('PASSWORD_RULES', () => {
  it('has 5 rules', () => {
    expect(PASSWORD_RULES).toHaveLength(5);
  });

  it('each rule has id, label, and test function', () => {
    PASSWORD_RULES.forEach(rule => {
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('label');
      expect(typeof rule.test).toBe('function');
    });
  });
});

describe('PasswordField component', () => {
  const setup = (props = {}) => {
    const onChange = vi.fn();
    render(
      <PasswordField
        value={props.value ?? ''}
        onChange={props.onChange ?? onChange}
        showRules={props.showRules ?? false}
      />
    );
    return { onChange };
  };

  it('renders a password label', () => {
    setup();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders input as type password by default', () => {
    setup();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('toggles input type when eye button is clicked', () => {
    setup();
    const toggle = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggle);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('does not render rules list when showRules is false', () => {
    setup({ showRules: false });
    expect(screen.queryByText('8–14 characters')).not.toBeInTheDocument();
  });

  it('renders all 5 password rules when showRules is true', () => {
    setup({ showRules: true, value: '' });
    expect(screen.getByText('8–14 characters')).toBeInTheDocument();
    expect(screen.getByText('At least one uppercase')).toBeInTheDocument();
    expect(screen.getByText('At least one lowercase')).toBeInTheDocument();
    expect(screen.getByText('At least one number')).toBeInTheDocument();
    expect(screen.getByText('At least one special char')).toBeInTheDocument();
  });

  it('marks rules as satisfied for a valid password', () => {
    setup({ showRules: true, value: 'Test@123' });
    const okItems = document.querySelectorAll('.pw-rule--ok');
    expect(okItems.length).toBe(5);
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<PasswordField value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalled();
  });
});
