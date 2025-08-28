// Theme Configuration for MediMind AI

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Color Palette - Inspired by MacroFactor's clean design
export const colors = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // Primary - Clean blue
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  secondary: {
    50: '#FDF4FF',
    100: '#FAE8FF',
    200: '#F5D0FE',
    300: '#F0ABFC',
    400: '#E879F9',
    500: '#D946EF', // Secondary - Purple
    600: '#C026D3',
    700: '#A21CAF',
    800: '#86198F',
    900: '#701A75',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Success - Green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warning - Amber
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Error - Red
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Info - Blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // MacroFactor-inspired colors
  macro: {
    protein: '#EF4444', // Red for protein
    carbs: '#22C55E',   // Green for carbs
    fat: '#F59E0B',     // Amber for fat
  },
} as const;

// Dark mode specific colors - Proper dark theme palette
export const darkColors = {
  // Background colors - Using balanced dark shades instead of pure black
  background: '#121212', // Main background - Material Design dark theme standard
  surface: '#1E1E1E',    // Surface background - Slightly lighter for contrast
  surfaceVariant: '#2D2D2D', // Card/container background
  surfaceElevated: '#333333', // Elevated surfaces (modals, dropdowns)
  
  // Text colors - Optimized for readability
  onBackground: '#FFFFFF', // Primary text on background
  onSurface: '#FFFFFF',    // Primary text on surface
  onSurfaceVariant: '#E0E0E0', // Secondary text on surface
  onSurfaceMuted: '#B0B0B0',   // Muted text (captions, hints)
  
  // Border and divider colors
  outline: '#404040',     // Borders and dividers
  outlineVariant: '#2A2A2A', // Subtle borders
  
  // Elevation colors for depth
  elevation: {
    level0: 'transparent',
    level1: '#1E1E1E',
    level2: '#2D2D2D',
    level3: '#333333',
    level4: '#404040',
    level5: '#4A4A4A',
  },
} as const;

// Light Theme - Clean and modern like MacroFactor
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[500],
    primaryContainer: colors.primary[50],
    secondary: colors.secondary[500],
    secondaryContainer: colors.secondary[50],
    tertiary: colors.info[500],
    tertiaryContainer: colors.info[50],
    surface: '#FFFFFF',
    surfaceVariant: colors.neutral[50],
    background: '#FFFFFF',
    error: colors.error[500],
    errorContainer: colors.error[50],
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.primary[900],
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.secondary[900],
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.info[900],
    onSurface: colors.neutral[900],
    onSurfaceVariant: colors.neutral[600],
    onBackground: colors.neutral[900],
    onError: '#FFFFFF',
    onErrorContainer: colors.error[900],
    outline: colors.neutral[200],
    outlineVariant: colors.neutral[100],
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],
    inverseSurface: colors.neutral[900],
    inverseOnSurface: '#FFFFFF',
    inversePrimary: colors.primary[100],
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: colors.neutral[50],
      level3: colors.neutral[100],
      level4: colors.neutral[200],
      level5: colors.neutral[300],
    },
  },
  roundness: 16,
};

// Dark Theme - Properly designed with balanced dark shades
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors - Adjusted for dark theme
    primary: colors.primary[300], // Lighter blue for better contrast
    primaryContainer: colors.primary[900],
    secondary: colors.secondary[300], // Lighter purple for better contrast
    secondaryContainer: colors.secondary[900],
    tertiary: colors.info[300], // Lighter info blue
    tertiaryContainer: colors.info[900],
    
    // Background and surface colors - Using proper dark shades
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    background: darkColors.background,
    
    // Error colors - Adjusted for dark theme
    error: colors.error[300], // Lighter red for better contrast
    errorContainer: colors.error[900],
    
    // Text colors - Optimized for readability
    onPrimary: darkColors.background, // Dark text on light primary
    onPrimaryContainer: colors.primary[100],
    onSecondary: darkColors.background, // Dark text on light secondary
    onSecondaryContainer: colors.secondary[100],
    onTertiary: darkColors.background, // Dark text on light tertiary
    onTertiaryContainer: colors.info[100],
    onSurface: darkColors.onSurface, // White text on dark surface
    onSurfaceVariant: darkColors.onSurfaceVariant, // Light gray for secondary text
    onBackground: darkColors.onBackground, // White text on dark background
    onError: darkColors.background, // Dark text on light error
    onErrorContainer: colors.error[100],
    
    // Border and outline colors
    outline: darkColors.outline,
    outlineVariant: darkColors.outlineVariant,
    
    // Shadow and scrim colors
    shadow: darkColors.background,
    scrim: darkColors.background,
    
    // Inverse colors
    inverseSurface: darkColors.onBackground,
    inverseOnSurface: darkColors.background,
    inversePrimary: colors.primary[900],
    
    // Elevation colors - Proper depth hierarchy
    elevation: darkColors.elevation,
  },
  roundness: 12,
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    light: 'System',
    thin: 'System',
  },
  fontSize: {
    displayLarge: 57,
    displayMedium: 45,
    displaySmall: 36,
    headlineLarge: 32,
    headlineMedium: 28,
    headlineSmall: 24,
    titleLarge: 22,
    titleMedium: 16,
    titleSmall: 14,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 12,
    labelLarge: 14,
    labelMedium: 12,
    labelSmall: 11,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    light: '300',
    thin: '100',
  },
} as const;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
} as const;

// Shadows - Updated for better dark mode support
export const shadows = {
  small: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Dark mode shadows - Subtle shadows for dark theme
export const darkShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Hook to get the current theme based on settings
export const useAppTheme = (themePreference: 'light' | 'dark' | 'auto', accessibilitySettings?: any) => {
  const systemColorScheme = useColorScheme();
  
  let baseTheme;
  if (themePreference === 'auto') {
    baseTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
  } else {
    baseTheme = themePreference === 'dark' ? darkTheme : lightTheme;
  }

  // Apply accessibility modifications if provided
  if (accessibilitySettings) {
    const { accessibilityHelper } = require('../utils/accessibility');
    const accessibilityStyles = accessibilityHelper.getAccessibilityStyles({ accessibility: accessibilitySettings });
    
    // Create modified theme with accessibility adjustments
    const modifiedTheme = {
      ...baseTheme,
      fonts: {
        ...baseTheme.fonts,
        displayLarge: { ...baseTheme.fonts.displayLarge, fontSize: accessibilityStyles.fontSize.displayLarge },
        displayMedium: { ...baseTheme.fonts.displayMedium, fontSize: accessibilityStyles.fontSize.displayMedium },
        displaySmall: { ...baseTheme.fonts.displaySmall, fontSize: accessibilityStyles.fontSize.displaySmall },
        headlineLarge: { ...baseTheme.fonts.headlineLarge, fontSize: accessibilityStyles.fontSize.headlineLarge },
        headlineMedium: { ...baseTheme.fonts.headlineMedium, fontSize: accessibilityStyles.fontSize.headlineMedium },
        headlineSmall: { ...baseTheme.fonts.headlineSmall, fontSize: accessibilityStyles.fontSize.headlineSmall },
        titleLarge: { ...baseTheme.fonts.titleLarge, fontSize: accessibilityStyles.fontSize.titleLarge },
        titleMedium: { ...baseTheme.fonts.titleMedium, fontSize: accessibilityStyles.fontSize.titleMedium },
        titleSmall: { ...baseTheme.fonts.titleSmall, fontSize: accessibilityStyles.fontSize.titleSmall },
        bodyLarge: { ...baseTheme.fonts.bodyLarge, fontSize: accessibilityStyles.fontSize.bodyLarge },
        bodyMedium: { ...baseTheme.fonts.bodyMedium, fontSize: accessibilityStyles.fontSize.bodyMedium },
        bodySmall: { ...baseTheme.fonts.bodySmall, fontSize: accessibilityStyles.fontSize.bodySmall },
        labelLarge: { ...baseTheme.fonts.labelLarge, fontSize: accessibilityStyles.fontSize.labelLarge },
        labelMedium: { ...baseTheme.fonts.labelMedium, fontSize: accessibilityStyles.fontSize.labelMedium },
        labelSmall: { ...baseTheme.fonts.labelSmall, fontSize: accessibilityStyles.fontSize.labelSmall },
      },
    };

    // Apply high contrast modifications if enabled
    if (accessibilitySettings.high_contrast) {
      const contrastRatio = accessibilityStyles.contrast.multiplier;
      
      // Enhance contrast for better visibility
      modifiedTheme.colors = {
        ...modifiedTheme.colors,
        outline: themePreference === 'dark' ? colors.neutral[400] : colors.neutral[700],
        outlineVariant: themePreference === 'dark' ? colors.neutral[500] : colors.neutral[600],
      };
    }

    return modifiedTheme;
  }
  
  return baseTheme;
};

// Utility function to get appropriate shadows based on theme
export const getThemeShadows = (isDark: boolean) => {
  return isDark ? darkShadows : shadows;
};

// Utility function to get theme-aware colors
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkColors : colors;
};
