export const colors = {
  blueprint: "#2A4B4F",
  plaster: "#F9F8F4",
  hardhat: "#F4AC3D",
  slate: "#1C3133",
  concrete: "#8A9A9C",
  safety: "#E76F51",
  white: "#FFFFFF",
  background: "#F9F8F4",
  foreground: "#1C3133",
  muted: "#687D7F",
  accent: "#F4AC3D",
  accentForeground: "#1C3133",
  accentSoft: "#FFF3D9",
  surface: "#FFFFFF",
  border: "#DDE4E2",
  success: "#39705F",
  warning: "#9A5A14",
} as const;

export const radii = {
  card: 24,
  control: 16,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const shadows = {
  card: "0 8px 24px rgba(42, 75, 79, 0.08)",
  action: "0 4px 16px rgba(244, 172, 61, 0.40)",
} as const;

export const typography = {
  family: "Quicksand, Nunito, system-ui, sans-serif",
  weights: { medium: 500, bold: 700, extraBold: 800 },
} as const;
