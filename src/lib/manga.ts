export const mangaAssets = {
  paperTexture: '/manga/paper-texture.png',
  blackPaperTexture: '/manga/black-paper-texture.png',
  inkWashTexture: '/manga/ink-wash-texture.png',
  heroKatanaField: '/manga/hero-katana-field.png',
  sidebarSamuraiStanding: '/manga/sidebar-samurai-standing.png',
  mottoSamuraiSitting: '/manga/motto-samurai-sitting.png',
  inkBarTexture: '/manga/ink-bar-texture-v3.png',
  inkMountains: '/manga/ink-mountains.png',
  inkBird: '/manga/ink-bird.png',
  emptyStateLoneSamurai: '/manga/empty-state-lone-samurai.png',
  wandererAvatar: '/manga/wanderer-avatar.png',
} as const;

export function getSourceMonogram(name: string): string {
  const normalized = name.trim().toUpperCase();
  if (normalized.includes('GCASH')) return 'G';
  if (normalized.includes('GOTYME')) return 'GO';
  if (normalized.includes('BPI')) return 'BPI';
  if (normalized.includes('CASH')) return '₱';
  return normalized.slice(0, 3);
}
