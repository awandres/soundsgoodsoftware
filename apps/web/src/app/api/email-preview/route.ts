import { NextRequest, NextResponse } from "next/server";
import { auth } from "@soundsgood/auth";
import { 
  getContrastRatio, 
  meetsWCAG, 
  getContrastRating,
  suggestAccessibleColor 
} from "@/lib/colorUtils";

// Default brand colors (matching email.ts)
const DEFAULT_COLORS = {
  primary: "#667eea",
  secondary: "#764ba2",
  accent: "#ffffff",
};

const APP_NAME = "SoundsGood Software";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface EmailPreviewRequest {
  email: string;
  name?: string;
  organizationName?: string;
  brandColors?: BrandColors;
  logoUrl?: string;
  message?: string;
}

interface ContrastWarning {
  type: "error" | "warning";
  location: string;
  message: string;
  currentRatio: number;
  requiredRatio: number;
  suggestion?: string;
}

/**
 * Generate CSS gradient from brand colors
 */
function getBrandGradient(colors: BrandColors): string {
  const primary = colors.primary || DEFAULT_COLORS.primary;
  const secondary = colors.secondary || DEFAULT_COLORS.secondary;
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * Get contrasting text color for a background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generate invitation email HTML (matches email.ts format)
 */
function generateInvitationEmailHtml({
  email,
  name,
  organizationName,
  brandColors,
  logoUrl,
  message,
}: EmailPreviewRequest): string {
  const greeting = name ? `Hi ${name}` : "Hi there";
  const fromLine = `SoundsGood Team from ${APP_NAME}`;
  const orgLine = organizationName ? ` for ${organizationName}` : "";
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const colors = {
    primary: brandColors?.primary || DEFAULT_COLORS.primary,
    secondary: brandColors?.secondary || DEFAULT_COLORS.secondary,
    accent: brandColors?.accent || DEFAULT_COLORS.accent,
  };
  const gradient = getBrandGradient(colors);
  const buttonTextColor = getContrastColor(colors.primary);

  const logoSection = logoUrl 
    ? `<img src="${logoUrl}" alt="${organizationName || APP_NAME}" style="max-height: 60px; max-width: 200px; margin-bottom: 15px;" />`
    : "";

  // Preview link (not a real link)
  const inviteLink = "#preview-link";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to ${organizationName || APP_NAME}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${gradient}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          ${logoSection}
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${organizationName || APP_NAME}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">${greeting},</p>
          
          <p>${fromLine} has invited you to join the client portal${orgLine}.</p>
          
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-left: 4px solid ${colors.primary}; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; font-style: italic;">"${message}"</p></div>` : ""}
          
          <p>Click the button below to set up your account and access your personalized client portal:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: ${gradient}; color: ${buttonTextColor}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">This invitation link will expire on <strong>${expiresFormatted}</strong>.</p>
          
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: ${colors.primary}; word-break: break-all;">https://www.soundsgoodapps.com/accept-invite?token=...</a>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Analyze colors for contrast issues
 */
function analyzeContrast(brandColors?: BrandColors): ContrastWarning[] {
  const warnings: ContrastWarning[] = [];
  const colors = {
    primary: brandColors?.primary || DEFAULT_COLORS.primary,
    secondary: brandColors?.secondary || DEFAULT_COLORS.secondary,
  };

  // Check header text (white) against primary color
  const headerContrast = meetsWCAG("#ffffff", colors.primary);
  if (!headerContrast.aaLarge) {
    const rating = getContrastRating(headerContrast.ratio);
    warnings.push({
      type: "error",
      location: "Header text",
      message: `White text on primary color (${colors.primary}) has ${rating.label.toLowerCase()} contrast.`,
      currentRatio: headerContrast.ratio,
      requiredRatio: 3,
      suggestion: `Consider using a darker primary color or ${suggestAccessibleColor(colors.primary) === "#000000" ? "dark" : "light"} text.`,
    });
  } else if (!headerContrast.aa) {
    warnings.push({
      type: "warning",
      location: "Header text",
      message: `White text on primary color passes for large text but may be difficult for small text.`,
      currentRatio: headerContrast.ratio,
      requiredRatio: 4.5,
    });
  }

  // Check button text against primary color (using gradient, so check primary)
  const buttonTextColor = getContrastColor(colors.primary);
  const buttonContrast = meetsWCAG(buttonTextColor, colors.primary);
  if (!buttonContrast.aa) {
    const rating = getContrastRating(buttonContrast.ratio);
    warnings.push({
      type: buttonContrast.aaLarge ? "warning" : "error",
      location: "Button text",
      message: `Button text has ${rating.label.toLowerCase()} contrast against the primary color.`,
      currentRatio: buttonContrast.ratio,
      requiredRatio: 4.5,
      suggestion: "Try adjusting the primary or secondary color for better visibility.",
    });
  }

  // Check link color against white background
  const linkContrast = meetsWCAG(colors.primary, "#ffffff");
  if (!linkContrast.aa) {
    warnings.push({
      type: linkContrast.aaLarge ? "warning" : "error",
      location: "Link text",
      message: `Primary color (${colors.primary}) used for links may be hard to read on white.`,
      currentRatio: linkContrast.ratio,
      requiredRatio: 4.5,
      suggestion: "Consider using a darker shade for the primary color.",
    });
  }

  return warnings;
}

/**
 * POST - Generate email HTML preview without sending
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can preview emails
    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: EmailPreviewRequest = await request.json();
    const { email, name, organizationName, brandColors, logoUrl, message } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for preview" },
        { status: 400 }
      );
    }

    // Generate HTML
    const html = generateInvitationEmailHtml({
      email,
      name,
      organizationName,
      brandColors,
      logoUrl,
      message,
    });

    // Analyze contrast
    const warnings = analyzeContrast(brandColors);

    return NextResponse.json({
      html,
      warnings,
      colors: {
        primary: brandColors?.primary || DEFAULT_COLORS.primary,
        secondary: brandColors?.secondary || DEFAULT_COLORS.secondary,
        accent: brandColors?.accent || DEFAULT_COLORS.accent,
      },
    });
  } catch (error) {
    console.error("Failed to generate email preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}

