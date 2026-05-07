import type { ReactElement, SVGProps } from 'react';

interface CategoryIconProps extends SVGProps<SVGSVGElement> {
  name?: string;
  icon?: string;
}

type IconRenderer = (props: SVGProps<SVGSVGElement>) => ReactElement;

const shared = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const iconMap: Record<string, IconRenderer> = {
  food: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}>
      <path d="M4.5 10.5h15" />
      <path d="M6.5 10.5c0 4.3 2.4 7 5.5 7s5.5-2.7 5.5-7" />
      <path d="M8 7.5c.9-1.5 2.2-2.2 4-2.2 1.7 0 3 .7 4 2.2" />
      <path d="M17.7 4.7l1.8 3.1" />
      <path d="M15.9 5.6l1.5 2.6" />
    </svg>
  ),
  transport: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M5 14V9.5C5 8.1 6.1 7 7.5 7h9C17.9 7 19 8.1 19 9.5V14" /><path d="M4.5 14h15" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /><path d="M8 19h8" /></svg>
  ),
  bills: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M7 4.5h10v15l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V4.5Z" /><path d="M9 9h6" /><path d="M9 12.5h6" /></svg>
  ),
  entertainment: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><rect x="4" y="6" width="16" height="12" rx="1.5" /><path d="m10 9 5 3-5 3Z" /></svg>
  ),
  salary: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M12 4v16" /><path d="M16.5 7.5c0-1.7-1.7-3-4-3-2.5 0-4.5 1.2-4.5 3.2 0 4.8 9 2.2 9 6.8 0 2-1.9 3.5-4.5 3.5-2.3 0-4.1-1-4.8-2.7" /></svg>
  ),
  freelance: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><rect x="4" y="8" width="16" height="10" rx="1.5" /><path d="M9 8V6.5C9 5.1 10.1 4 11.5 4h1C13.9 4 15 5.1 15 6.5V8" /><path d="M10 12h4" /></svg>
  ),
  shopping: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M7 8h10l-1 10H8L7 8Z" /><path d="M9.5 8V6.5C9.5 5.1 10.6 4 12 4s2.5 1.1 2.5 2.5V8" /></svg>
  ),
  healthcare: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M12 19s-6-3.6-6-8.2A3.8 3.8 0 0 1 12 7.9a3.8 3.8 0 0 1 6 2.9C18 15.4 12 19 12 19Z" /><path d="M12 9.5v4.5" /><path d="M9.75 11.75h4.5" /></svg>
  ),
  education: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="m4 9 8-4 8 4-8 4-8-4Z" /><path d="M7 10.5v4.2c0 .6 2.2 2.3 5 2.3s5-1.7 5-2.3v-4.2" /></svg>
  ),
  heart: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><path d="M12 19.2 5.8 13a4 4 0 0 1 5.7-5.6L12 8l.5-.6A4 4 0 1 1 18.2 13L12 19.2Z" /></svg>
  ),
  other: (props) => (
    <svg viewBox="0 0 24 24" {...shared} {...props}><circle cx="12" cy="12" r="7.5" /><path d="M12 8.8v6.4" /><path d="M8.8 12h6.4" /></svg>
  ),
};

const aliasMap: Record<string, string> = {
  '🍔': 'food', '🍕': 'food', '🍜': 'food', '🍣': 'food', '☕': 'food',
  '🚗': 'transport', '🚕': 'transport', '🚌': 'transport', '🚇': 'transport', '✈️': 'transport',
  '📄': 'bills', '💡': 'bills', '💧': 'bills', '📱': 'bills',
  '🎬': 'entertainment', '🎮': 'entertainment', '🎵': 'entertainment', '📺': 'entertainment',
  '💰': 'salary', '💵': 'salary',
  '💼': 'freelance',
  '🛍️': 'shopping', '🛒': 'shopping', '🎁': 'shopping',
  '🏥': 'healthcare', '💊': 'healthcare', '🩺': 'healthcare',
  '📚': 'education', '🎓': 'education', '📝': 'education',
  '❤️': 'heart', '💖': 'heart', '💗': 'heart', '♥️': 'heart',
  '📌': 'other', '🎯': 'other',
};

function resolveKey(name?: string, icon?: string): string {
  const rawIcon = (icon || '').trim();
  const normalizedIcon = rawIcon.toLowerCase();
  if (aliasMap[rawIcon]) return aliasMap[rawIcon];
  if (iconMap[normalizedIcon]) return normalizedIcon;

  const normalizedName = (name || '').trim().toLowerCase();
  if (normalizedName.includes('aki') || normalizedName.includes('love') || normalizedName.includes('heart')) return 'heart';
  if (normalizedName.includes('food') || normalizedName.includes('drink') || normalizedName.includes('grocer')) return 'food';
  if (normalizedName.includes('transport') || normalizedName.includes('travel') || normalizedName.includes('car')) return 'transport';
  if (normalizedName.includes('bill') || normalizedName.includes('rent') || normalizedName.includes('utility')) return 'bills';
  if (normalizedName.includes('entertain') || normalizedName.includes('movie') || normalizedName.includes('music')) return 'entertainment';
  if (normalizedName.includes('salary')) return 'salary';
  if (normalizedName.includes('freelance') || normalizedName.includes('work') || normalizedName.includes('business')) return 'freelance';
  if (normalizedName.includes('shop')) return 'shopping';
  if (normalizedName.includes('health') || normalizedName.includes('medical')) return 'healthcare';
  if (normalizedName.includes('educat') || normalizedName.includes('school') || normalizedName.includes('book')) return 'education';
  return 'other';
}

export const CATEGORY_ICON_OPTIONS = [
  { key: 'food', label: 'Food' },
  { key: 'transport', label: 'Transport' },
  { key: 'bills', label: 'Bills' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'salary', label: 'Salary' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'education', label: 'Education' },
  { key: 'heart', label: 'Heart' },
  { key: 'other', label: 'Other' },
] as const;

export function CategoryIcon({ name, icon, className = 'h-4 w-4', ...props }: CategoryIconProps) {
  const key = resolveKey(name, icon);
  const Renderer = iconMap[key] || iconMap.other;
  return <Renderer className={className} aria-hidden="true" {...props} />;
}
