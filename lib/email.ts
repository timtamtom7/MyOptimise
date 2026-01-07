import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const defaultFrom = process.env.RESEND_FROM || "Optimise Operations <onboarding@resend.dev>";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail({ to, subject, html, from = defaultFrom }: SendEmailParams) {
  if (!resend) {
    console.warn("Resend API key missing. Email not sent:", { to, subject });
    return { success: false, error: "missing_api_key" };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    
    // Fallback logic for testing/onboarding domain constraints
    if (from.toLowerCase().includes("onboarding@resend.dev")) {
        // Already tried onboarding domain, just fail
        return { success: false, error };
    }

    try {
        // Try fallback to onboarding domain if custom domain fails (common in dev)
        const fallbackData = await resend.emails.send({
            from: "Optimise Operations <onboarding@resend.dev>",
            to,
            subject,
            html,
        });
        return { success: true, data: fallbackData };
    } catch (fallbackError) {
        return { success: false, error: fallbackError };
    }
  }
}
