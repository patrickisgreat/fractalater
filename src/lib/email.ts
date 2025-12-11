import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const emailFrom = process.env.EMAIL_FROM || "Fractalater <noreply@fractalater.com>";

export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
) {
  if (!resend) {
    console.log("Email not configured - skipping verification email");
    console.log(`Verification link: ${baseUrl}/verify-email?token=${token}`);
    return { success: true, skipped: true };
  }

  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Verify your Fractalater account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="background-color: #0a0a0f; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #111118; border-radius: 12px; padding: 32px; border: 1px solid #1f1f2e;">
              <h1 style="color: #a855f7; margin: 0 0 8px 0; font-size: 24px;">Welcome to Fractalater!</h1>
              <p style="color: #9ca3af; margin: 0 0 24px 0;">Please verify your email address to get started.</p>

              <a href="${verifyUrl}" style="display: inline-block; background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
                Verify Email Address
              </a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Or copy this link: <br>
                <span style="color: #a855f7;">${verifyUrl}</span>
              </p>

              <hr style="border: none; border-top: 1px solid #1f1f2e; margin: 24px 0;">

              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
}

export function isEmailConfigured() {
  return !!resend;
}
