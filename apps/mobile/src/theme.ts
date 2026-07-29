import { colors, radii, spacing } from "@obrametrik/ui-tokens";

export const theme = {
  colors: {
    canvas: colors.plaster,
    surface: colors.white,
    ink: colors.slate,
    concrete: colors.concrete,
    muted: colors.muted,
    border: colors.border,
    accent: colors.hardhat,
    accentText: colors.slate,
    accentSoft: colors.accentSoft,
    brand: colors.blueprint,
    danger: colors.safety,
  },
  radius: radii,
  spacing,
} as const;
