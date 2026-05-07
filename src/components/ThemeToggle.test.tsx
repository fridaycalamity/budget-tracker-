import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../contexts';

describe('ThemeToggle', () => {
  it('renders nothing because the manga ledger theme is fixed', () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
