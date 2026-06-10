import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../components/ConfirmModal';

const defaultProps = {
  isOpen: true,
  title: 'Delete Task',
  message: 'Are you sure?',
  confirmLabel: 'Delete',
  confirmClass: 'btn-confirm-danger',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
  });

  it('displays the message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('displays the confirm button label', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Remove" />);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    // The presentation div is the backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed on backdrop', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    const backdrop = document.querySelector('.modal-backdrop');
    fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking inside the dialog box', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('applies the confirmClass to the confirm button', () => {
    render(<ConfirmModal {...defaultProps} confirmClass="btn-confirm-danger" />);
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    expect(confirmBtn.className).toContain('btn-confirm-danger');
  });

  it('has default confirmLabel "Confirm" when not provided', () => {
    const { confirmLabel: _, ...withoutLabel } = defaultProps;
    render(<ConfirmModal {...withoutLabel} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
