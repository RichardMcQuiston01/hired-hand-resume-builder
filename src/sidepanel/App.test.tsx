import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the side panel heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Hired Hand: Resume Builder' }),
    ).toBeInTheDocument();
  });

  it('reflects edits to the form in the live preview', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jordan Rivera' },
    });

    expect(
      screen.getByRole('heading', { name: 'Jordan Rivera', level: 1 }),
    ).toBeInTheDocument();
  });

  it('adds a new experience entry to the form', () => {
    render(<App />);

    expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Add job' }));

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  it('creates a new profile from the profile bar', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'New' }));

    const select = screen.getByLabelText(
      'Active resume profile',
    ) as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(select.value).not.toBe('');
    expect(
      screen.getByRole('option', { name: 'Untitled resume' }),
    ).toBeInTheDocument();
  });
});
