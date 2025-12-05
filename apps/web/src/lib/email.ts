import { Resend } from "resend";

// Email configuration
// In production, use your verified domain. For development, Resend provides a test sender.
const FROM_EMAIL = process.env.EMAIL_FROM || 
  (process.env.NODE_ENV === "production" 
    ? "SoundsGood Software <noreply@soundsgoodapps.com>"
    : "SoundsGood Software <onboarding@resend.dev>");
const APP_NAME = "SoundsGood Software";

// Default brand colors (used when org doesn't have custom colors)
const DEFAULT_COLORS = {
  primary: "#667eea",
  secondary: "#764ba2",
  accent: "#ffffff",
};

// Lazy-initialize Resend client to avoid issues with env vars at module load time
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ RESEND_API_KEY not set - emails will not be sent");
      // Return a mock client that logs instead of sending
      return {
        emails: {
          send: async (params: any) => {
            console.log("📧 [DEV MODE] Would send email:", {
              to: params.to,
              subject: params.subject,
            });
            return { data: { id: "dev-mode-no-send" }, error: null };
          },
        },
      } as unknown as Resend;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Brand colors interface
interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface SendInvitationEmailParams {
  to: string;
  inviteeName?: string;
  inviterName?: string;
  organizationName?: string;
  inviteLink: string;
  message?: string;
  expiresAt: Date;
  brandColors?: BrandColors;
  logoUrl?: string;
}

/**
 * Generate a CSS gradient from brand colors
 */
function getBrandGradient(colors: BrandColors): string {
  const primary = colors.primary || DEFAULT_COLORS.primary;
  const secondary = colors.secondary || DEFAULT_COLORS.secondary;
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * Get contrasting text color (white or black) for a background
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Send an invitation email to a new client
 */
export async function sendInvitationEmail({
  to,
  inviteeName,
  inviterName,
  organizationName,
  inviteLink,
  message,
  expiresAt,
  brandColors,
  logoUrl,
}: SendInvitationEmailParams) {
  const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi there";
  const fromLine = inviterName ? `${inviterName} from ${APP_NAME}` : APP_NAME;
  const orgLine = organizationName ? ` for ${organizationName}` : "";
  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Use brand colors or defaults
  const colors = {
    primary: brandColors?.primary || DEFAULT_COLORS.primary,
    secondary: brandColors?.secondary || DEFAULT_COLORS.secondary,
    accent: brandColors?.accent || DEFAULT_COLORS.accent,
  };
  const gradient = getBrandGradient(colors);
  const buttonTextColor = getContrastColor(colors.primary);

  // Logo section (only if provided)
  const logoSection = logoUrl 
    ? `<img src="${logoUrl}" alt="${organizationName || APP_NAME}" style="max-height: 60px; max-width: 200px; margin-bottom: 15px;" />`
    : "";

  const html = `
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
            <a href="${inviteLink}" style="color: ${colors.primary}; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${greeting},

${fromLine} has invited you to join the client portal${orgLine}.

${message ? `Message from ${inviterName || "the team"}: "${message}"\n` : ""}

Click the link below to set up your account:
${inviteLink}

This invitation will expire on ${expiresFormatted}.

If you didn't expect this invitation, you can safely ignore this email.

---
${APP_NAME}
  `.trim();

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You're invited to join ${organizationName || APP_NAME}`,
      html,
      text,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}

interface SendWelcomeEmailParams {
  to: string;
  name?: string;
  loginUrl: string;
  organizationName?: string;
  brandColors?: BrandColors;
  logoUrl?: string;
}

/**
 * Send a welcome email after account setup is complete
 */
export async function sendWelcomeEmail({
  to,
  name,
  loginUrl,
  organizationName,
  brandColors,
  logoUrl,
}: SendWelcomeEmailParams) {
  const greeting = name ? `Welcome, ${name}!` : "Welcome!";

  // Use brand colors or defaults
  const colors = {
    primary: brandColors?.primary || DEFAULT_COLORS.primary,
    secondary: brandColors?.secondary || DEFAULT_COLORS.secondary,
  };
  const gradient = getBrandGradient(colors);
  const buttonTextColor = getContrastColor(colors.primary);

  // Logo section (only if provided)
  const logoSection = logoUrl 
    ? `<img src="${logoUrl}" alt="${organizationName || APP_NAME}" style="max-height: 60px; max-width: 200px; margin-bottom: 15px;" />`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organizationName || APP_NAME}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${gradient}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          ${logoSection}
          <h1 style="color: white; margin: 0; font-size: 28px;">${greeting}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Your account has been set up successfully!</p>
          
          <p>You now have full access to your client portal where you can:</p>
          
          <ul style="color: #555;">
            <li>View your project status and updates</li>
            <li>Access important documents</li>
            <li>Upload photos and brand assets</li>
            <li>Submit support requests</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: ${gradient}; color: ${buttonTextColor}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Portal</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you have any questions, don't hesitate to reach out!</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${greeting}

Your account has been set up successfully!

You now have full access to your client portal where you can:
- View your project status and updates
- Access important documents
- Upload photos and brand assets
- Submit support requests

Log in here: ${loginUrl}

If you have any questions, don't hesitate to reach out!

---
${APP_NAME}
  `.trim();

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${organizationName || APP_NAME}!`,
      html,
      text,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}
