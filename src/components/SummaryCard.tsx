import { formatCurrency } from '../utils';

interface SummaryCardProps {
  title: string;
  amount: number;
  color: 'green' | 'red' | 'blue';
}

export function SummaryCard({ title, amount }: SummaryCardProps) {
  return (
    <div className="app-panel p-4 sm:p-5">
      <div className="app-kicker mb-2">{title}</div>
      <p className="app-numeric text-[2rem] font-black leading-none sm:text-[2.4rem]">{formatCurrency(amount)}</p>
    </div>
  );
}
