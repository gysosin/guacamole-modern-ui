export type ThemeMode = 'light' | 'dark'

export interface ColorPalette {
  background: string
  surface: string
  border: string
  textPrimary: string
  textSecondary: string
  primary: string
  secondary: string
  accent: string
  accentContrast: string
  warning: string
  success: string
  info: string
  error: string
}

export interface TypographyScale {
  fontFamily: string
  sizes: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  weights: {
    light: number
    regular: number
    medium: number
    bold: number
  }
}

export interface SpacingScale {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

export interface ThemeTokens {
  mode: ThemeMode
  palette: ColorPalette
  typography: TypographyScale
  spacing: SpacingScale
  radii: {
    sm: number
    md: number
    lg: number
  }
}

const baseTypography: TypographyScale = {
  fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 600,
  },
}

const baseSpacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

const radii = { sm: 8, md: 16, lg: 24 }

const lightPalette: ColorPalette = {
  background: '#0f172a',
  surface: '#111f3f',
  border: '#1f2b52',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5f5',
  primary: '#4f46e5',
  secondary: '#a5b4fc',
  accent: '#4f46e5',
  accentContrast: '#ffffff',
  warning: '#f97316',
  success: '#37b24d',
  info: '#38bdf8',
  error: '#ef4444',
}

const darkPalette: ColorPalette = {
  background: '#020617',
  surface: '#0b1224',
  border: '#1c2541',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  primary: '#6366f1',
  secondary: '#a5b4fc',
  accent: '#6366f1',
  accentContrast: '#f8fafc',
  warning: '#fb923c',
  success: '#22c55e',
  info: '#38bdf8',
  error: '#f87171',
}

export const lightTheme: ThemeTokens = {
  mode: 'light',
  palette: lightPalette,
  typography: baseTypography,
  spacing: baseSpacing,
  radii,
}

export const darkTheme: ThemeTokens = {
  mode: 'dark',
  palette: darkPalette,
  typography: baseTypography,
  spacing: baseSpacing,
  radii,
}

export const getThemeTokens = (mode: ThemeMode): ThemeTokens =>
  mode === 'dark' ? darkTheme : lightTheme
