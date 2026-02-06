import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render text skeleton by default', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-4');
  });

  it('should render card skeleton', () => {
    const { container } = render(<SkeletonLoader variant="card" />);
    const card = container.querySelector('.shadow-md');
    expect(card).toBeInTheDocument();
  });

  it('should render transaction skeleton', () => {
    const { container } = render(<SkeletonLoader variant="transaction" />);
    const transaction = container.querySelector('.shadow-sm');
    expect(transaction).toBeInTheDocument();
  });

  it('should render chart skeleton', () => {
    const { container } = render(<SkeletonLoader variant="chart" />);
    const chart = container.querySelector('.h-64');
    expect(chart).toBeInTheDocument();
  });

  it('should render multiple skeletons based on count', () => {
    const { container } = render(<SkeletonLoader variant="text" count={3} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('should apply custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    const skeleton = container.querySelector('.custom-class');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have pulse animation', () => {
    const { container } = render(<SkeletonLoader />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});
