// Altech Dark Premium — JS token constants
// Mirror of CSS custom properties in index.css.
// Use for inline styles where CSS vars aren't available (SVG, canvas, etc.)
export const T = {
  bgPage:      '#0e1016',
  bgSurface:   '#171a22',
  bgSurface2:  '#1e222c',
  border:      '#262b37',
  border2:     '#2f3547',
  text1:       '#e7eaf2',
  text2:       '#a2a8ba',
  text3:       '#6a7390',
  accent:      '#7d92ff',
  accentDim:   'rgba(125,146,255,0.12)',
  accentBorder:'rgba(125,146,255,0.3)',
  success:     '#35c9ae',
  successDim:  'rgba(53,201,174,0.12)',
  warn:        '#e6b23c',
  warnDim:     'rgba(230,178,60,0.12)',
  crit:        '#f0805c',
  critDim:     'rgba(240,128,92,0.12)',
  neutral:     '#6a7390',
  neutralDim:  'rgba(106,115,144,0.12)',
  purple:      '#a78bfa',
  purpleDim:   'rgba(167,139,250,0.12)',
  shadow2:     '0 4px 16px rgba(0,0,0,0.4)',
  shadowModal: '0 32px 80px rgba(0,0,0,0.56)',
} as const

export type TK = typeof T
