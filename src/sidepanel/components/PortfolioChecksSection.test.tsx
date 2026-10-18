import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  createBlankResume,
  createFixtureResume,
} from '@richardmcquiston01/ats-resume-export';
import { PortfolioChecksSection } from './AtsPanel';

describe('PortfolioChecksSection', () => {
  it('renders nothing until a portfolio has been started', () => {
    const { container } = render(
      <PortfolioChecksSection resume={createBlankResume()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists portfolio findings under a Portfolio heading', () => {
    render(<PortfolioChecksSection resume={createFixtureResume()} />);

    expect(
      screen.getByRole('heading', { name: 'Portfolio' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Only 1 featured project/)).toBeVisible();
    expect(screen.getByText(/1 publishable recommendation\./)).toBeVisible();
  });
});
