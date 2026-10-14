import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  createBlankProjectEntry,
  createBlankResume,
  createFixtureResume,
  type Resume,
} from '@hired-hand/resume-core';
import { PortfolioForm } from './PortfolioForm';

function Harness({ initial }: { initial: Resume }): ReactElement {
  const [resume, setResume] = useState<Resume>(initial);
  return (
    <>
      <PortfolioForm
        resume={resume}
        onChange={(updater) => {
          setResume(updater);
        }}
      />
      <pre data-testid="state">{JSON.stringify(resume.portfolio)}</pre>
    </>
  );
}

function resumeWithProjects(names: string[]): Resume {
  const resume: Resume = createBlankResume();
  return {
    ...resume,
    projects: names.map((name) => ({ ...createBlankProjectEntry(), name })),
  };
}

function readPortfolioState(): Resume['portfolio'] {
  return JSON.parse(
    screen.getByTestId('state').textContent ?? '{}',
  ) as Resume['portfolio'];
}

describe('PortfolioForm', () => {
  it('saves the bio, clearing it back to undefined when emptied', () => {
    render(<Harness initial={createBlankResume()} />);
    const bioField: HTMLElement = screen.getByLabelText('Portfolio bio');

    fireEvent.change(bioField, { target: { value: 'Full-stack engineer.' } });
    expect(readPortfolioState().bio).toBe('Full-stack engineer.');

    fireEvent.change(bioField, { target: { value: '' } });
    expect(readPortfolioState().bio).toBeUndefined();
  });

  it('features, reorders, and unfeatures projects', () => {
    render(<Harness initial={resumeWithProjects(['Alpha', 'Beta'])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Feature Alpha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feature Beta' }));
    expect(readPortfolioState().featuredProjectIds).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Move Beta up' }));
    const items: HTMLElement[] = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('1. Beta');
    expect(items[1]).toHaveTextContent('2. Alpha');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Beta from featured projects',
      }),
    );
    expect(readPortfolioState().featuredProjectIds).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Feature Beta' }),
    ).toBeInTheDocument();
  });

  it('warns when fewer than the recommended number of projects are featured', () => {
    render(<Harness initial={resumeWithProjects(['Alpha'])} />);

    expect(screen.getByText(/recommend 3–5 standout projects/i)).toBeVisible();
  });

  it('ignores featured ids whose project no longer exists', () => {
    const resume: Resume = {
      ...resumeWithProjects(['Alpha']),
    };
    const stale: Resume = {
      ...resume,
      portfolio: {
        ...resume.portfolio,
        featuredProjectIds: ['00000000-0000-4000-8000-000000000000'],
      },
    };

    render(<Harness initial={stale} />);

    expect(screen.getByText(/^0 featured/)).toBeInTheDocument();
  });

  it('edits portfolio details on a project', () => {
    render(<Harness initial={resumeWithProjects(['Alpha'])} />);

    fireEvent.change(screen.getByLabelText('Repository URL for project 1'), {
      target: { value: 'https://github.com/example/alpha' },
    });
    fireEvent.change(screen.getByLabelText('Add Technologies for project 1'), {
      target: { value: 'React' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add Technologies for project 1 to list',
      }),
    );

    expect(screen.getByLabelText('Repository URL for project 1')).toHaveValue(
      'https://github.com/example/alpha',
    );
    expect(
      screen.getByRole('button', {
        name: 'Remove Technologies for project 1 React',
      }),
    ).toBeInTheDocument();
  });

  it('adds a screenshot from a file and requires a description', async () => {
    render(<Harness initial={resumeWithProjects(['Alpha'])} />);
    const file: File = new File(['abc'], 'shot.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Add screenshot to Alpha'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Screenshot 1 description/),
      ).toBeInTheDocument();
    });
  });

  it('shows an error when a screenshot has an unsupported type', async () => {
    render(<Harness initial={resumeWithProjects(['Alpha'])} />);
    const file: File = new File(['x'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(screen.getByLabelText('Add screenshot to Alpha'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('notes.txt');
  });

  it('adds a recommendation that is unpublished until permission is given', () => {
    render(<Harness initial={createBlankResume()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add recommendation' }));
    fireEvent.change(screen.getByLabelText(/author name/i), {
      target: { value: 'Jordan Rivera' },
    });
    fireEvent.change(screen.getByLabelText('Relationship'), {
      target: { value: 'client' },
    });

    const [recommendation] = readPortfolioState().recommendations;
    expect(recommendation).toMatchObject({
      authorName: 'Jordan Rivera',
      relationship: 'client',
      hasAuthorPermission: false,
    });
    expect(screen.getByText(/left out of the portfolio export/i)).toBeVisible();

    fireEvent.click(screen.getByLabelText(/agreed to have their name/i));

    expect(readPortfolioState().recommendations[0]?.hasAuthorPermission).toBe(
      true,
    );
    expect(
      screen.queryByText(/left out of the portfolio export/i),
    ).not.toBeInTheDocument();
  });

  it('has no axe violations with a fully populated portfolio', async () => {
    const { container } = render(<Harness initial={createFixtureResume()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
