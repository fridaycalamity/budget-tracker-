import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BudgetProvider, ThemeProvider, ToastProvider, CategoryProvider } from '../contexts';
import { createMockAuth, setMockAuth } from './mockAuth';

/**
 * Custom render function that wraps components with all necessary providers
 * Use this instead of @testing-library/react's render for components that need context
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CategoryProvider>
          <BudgetProvider>
            {children}
          </BudgetProvider>
        </CategoryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render, createMockAuth, setMockAuth };
