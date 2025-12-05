/**
 * Color utility functions for WCAG contrast validation
 * and accessible color suggestions
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const sanitized = hex.replace(/^#/, "");
  
  // Handle shorthand hex (e.g., #fff)
  const fullHex = sanitized.length === 3
    ? sanitized.split("").map(c => c + c).join("")
    : sanitized;
  
  if (fullHex.length !== 6) {
    return null;
  }
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  
  return { r, g, b };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate relative luminance of a color (WCAG 2.1 formula)
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 * AA: 4.5:1 for normal text, 3:1 for large text
 * AAA: 7:1 for normal text, 4.5:1 for large text
 */
export function meetsWCAG(
  foreground: string,
  background: string
): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean; ratio: number } {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    aa: ratio >= 4.5,        // Normal text
    aaLarge: ratio >= 3,     // Large text (18pt+)
    aaa: ratio >= 7,         // Enhanced normal text
    aaaLarge: ratio >= 4.5,  // Enhanced large text
    ratio: Math.round(ratio * 100) / 100,
  };
}

/**
 * Suggest an accessible text color for a given background
 * Returns either white or black depending on which provides better contrast
 */
export function suggestAccessibleColor(
  background: string,
  preferLight?: boolean
): string {
  const whiteLuminance = getRelativeLuminance("#ffffff");
  const blackLuminance = getRelativeLuminance("#000000");
  const bgLuminance = getRelativeLuminance(background);
  
  // Calculate contrast with white and black
  const whiteContrast = (Math.max(whiteLuminance, bgLuminance) + 0.05) / (Math.min(whiteLuminance, bgLuminance) + 0.05);
  const blackContrast = (Math.max(blackLuminance, bgLuminance) + 0.05) / (Math.min(blackLuminance, bgLuminance) + 0.05);
  
  // If preference specified and meets AA, use preference
  if (preferLight !== undefined) {
    if (preferLight && whiteContrast >= 4.5) return "#ffffff";
    if (!preferLight && blackContrast >= 4.5) return "#000000";
  }
  
  // Otherwise return the higher contrast option
  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}

/**
 * Adjust color brightness to meet contrast requirements
 */
export function adjustColorForContrast(
  color: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const currentRatio = getContrastRatio(color, background);
  if (currentRatio >= targetRatio) return color;
  
  const bgLuminance = getRelativeLuminance(background);
  const shouldLighten = bgLuminance < 0.5;
  
  let { r, g, b } = rgb;
  let step = shouldLighten ? 10 : -10;
  let iterations = 0;
  const maxIterations = 50;
  
  while (iterations < maxIterations) {
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
    
    const newColor = rgbToHex(r, g, b);
    const newRatio = getContrastRatio(newColor, background);
    
    if (newRatio >= targetRatio) {
      return newColor;
    }
    
    // If we've hit the bounds, switch direction
    if ((shouldLighten && r >= 255 && g >= 255 && b >= 255) ||
        (!shouldLighten && r <= 0 && g <= 0 && b <= 0)) {
      break;
    }
    
    iterations++;
  }
  
  // Fallback to black or white
  return shouldLighten ? "#ffffff" : "#000000";
}

/**
 * Get a human-readable contrast rating
 */
export function getContrastRating(ratio: number): {
  rating: "poor" | "fair" | "good" | "excellent";
  label: string;
  description: string;
} {
  if (ratio < 3) {
    return {
      rating: "poor",
      label: "Poor",
      description: "Fails WCAG standards. Text may be difficult to read.",
    };
  } else if (ratio < 4.5) {
    return {
      rating: "fair",
      label: "Fair",
      description: "Passes AA for large text only. Consider improving.",
    };
  } else if (ratio < 7) {
    return {
      rating: "good",
      label: "Good",
      description: "Passes WCAG AA standard for normal text.",
    };
  } else {
    return {
      rating: "excellent",
      label: "Excellent",
      description: "Passes WCAG AAA standard. Excellent readability.",
    };
  }
}

/**
 * Validate a hex color string
 */
export function isValidHexColor(color: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Ensure hex color has # prefix
 */
export function normalizeHexColor(color: string): string {
  if (!color) return "#000000";
  return color.startsWith("#") ? color : `#${color}`;
}

