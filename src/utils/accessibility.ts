import { AppSettings } from '../hooks/useSettings';

export interface AccessibilityStyles {
  fontSize: {
    displayLarge: number;
    displayMedium: number;
    displaySmall: number;
    headlineLarge: number;
    headlineMedium: number;
    headlineSmall: number;
    titleLarge: number;
    titleMedium: number;
    titleSmall: number;
    bodyLarge: number;
    bodyMedium: number;
    bodySmall: number;
    labelLarge: number;
    labelMedium: number;
    labelSmall: number;
  };
  contrast: {
    multiplier: number;
    borderWidth: number;
    shadowOpacity: number;
  };
}

// Base font sizes (from theme)
const BASE_FONT_SIZES = {
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
};

// Large text multiplier
const LARGE_TEXT_MULTIPLIER = 1.3;

// High contrast settings
const HIGH_CONTRAST_SETTINGS = {
  multiplier: 1.5,
  borderWidth: 2,
  shadowOpacity: 0.3,
};

const NORMAL_CONTRAST_SETTINGS = {
  multiplier: 1.0,
  borderWidth: 1,
  shadowOpacity: 0.15,
};

export const accessibilityHelper = {
  /**
   * Get accessibility styles based on settings
   */
  getAccessibilityStyles(settings: AppSettings): AccessibilityStyles {
    const { large_text, high_contrast } = settings.accessibility;
    
    // Calculate font sizes
    const fontSizeMultiplier = large_text ? LARGE_TEXT_MULTIPLIER : 1.0;
    const fontSize = Object.entries(BASE_FONT_SIZES).reduce((acc, [key, value]) => {
      acc[key as keyof typeof BASE_FONT_SIZES] = Math.round(value * fontSizeMultiplier);
      return acc;
    }, {} as any);

    // Calculate contrast settings
    const contrast = high_contrast ? HIGH_CONTRAST_SETTINGS : NORMAL_CONTRAST_SETTINGS;

    return {
      fontSize,
      contrast,
    };
  },

  /**
   * Apply large text scaling to a specific font size
   */
  scaleFont(baseSize: number, settings: AppSettings): number {
    const { large_text } = settings.accessibility;
    return large_text ? Math.round(baseSize * LARGE_TEXT_MULTIPLIER) : baseSize;
  },

  /**
   * Get contrast-adjusted color opacity
   */
  getContrastAdjustedOpacity(baseOpacity: number, settings: AppSettings): number {
    const { high_contrast } = settings.accessibility;
    return high_contrast ? Math.min(baseOpacity * HIGH_CONTRAST_SETTINGS.multiplier, 1.0) : baseOpacity;
  },

  /**
   * Get accessibility-friendly border width
   */
  getBorderWidth(settings: AppSettings): number {
    const { high_contrast } = settings.accessibility;
    return high_contrast ? HIGH_CONTRAST_SETTINGS.borderWidth : NORMAL_CONTRAST_SETTINGS.borderWidth;
  },

  /**
   * Get accessibility-friendly shadow opacity
   */
  getShadowOpacity(settings: AppSettings): number {
    const { high_contrast } = settings.accessibility;
    return high_contrast ? HIGH_CONTRAST_SETTINGS.shadowOpacity : NORMAL_CONTRAST_SETTINGS.shadowOpacity;
  },

  /**
   * Generate accessibility props for React Native components
   */
  getAccessibilityProps(label: string, hint?: string, role?: string) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: role as any,
    };
  },

  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled(settings: AppSettings): boolean {
    return settings.accessibility.screen_reader;
  },

  /**
   * Get minimum touch target size for accessibility
   */
  getMinTouchTargetSize(settings: AppSettings): number {
    // iOS and Android accessibility guidelines recommend 44pt/48dp minimum
    return 44;
  },

  /**
   * Get enhanced focus indicator styles
   */
  getFocusIndicatorStyle(settings: AppSettings, theme: any) {
    const { high_contrast } = settings.accessibility;
    
    return {
      borderWidth: high_contrast ? 3 : 2,
      borderColor: theme.colors.primary,
      borderRadius: 4,
    };
  },

  /**
   * Generate semantic color names for screen readers
   */
  getSemanticColorName(colorValue: string): string {
    const colorMap: Record<string, string> = {
      '#FF0000': 'red',
      '#00FF00': 'green',
      '#0000FF': 'blue',
      '#FFFF00': 'yellow',
      '#FF00FF': 'magenta',
      '#00FFFF': 'cyan',
      '#000000': 'black',
      '#FFFFFF': 'white',
      '#808080': 'gray',
    };

    return colorMap[colorValue.toUpperCase()] || 'color';
  },

  /**
   * Format time for screen readers
   */
  formatTimeForScreenReader(time: string): string {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    
    return `${displayHour} ${minutes} ${period}`;
  },

  /**
   * Format date for screen readers
   */
  formatDateForScreenReader(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Get accessibility-enhanced button props
   */
  getButtonAccessibilityProps(
    label: string,
    settings: AppSettings,
    options: {
      hint?: string;
      disabled?: boolean;
      loading?: boolean;
    } = {}
  ) {
    const { hint, disabled, loading } = options;
    
    let accessibilityLabel = label;
    let accessibilityHint = hint;
    
    if (loading) {
      accessibilityLabel = `${label}, loading`;
    }
    
    if (disabled) {
      accessibilityLabel = `${label}, disabled`;
    }

    return {
      accessible: true,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole: 'button' as any,
      accessibilityState: {
        disabled: disabled || false,
        busy: loading || false,
      },
    };
  },
};
