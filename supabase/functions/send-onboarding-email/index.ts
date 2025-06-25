import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return response;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }));
  }

  if (req.method !== 'POST') {
    return withCors(new Response('Method not allowed', { status: 405 }));
  }

  try {
    const payload = await req.json();

    // Support both direct onboarding and webhook event
    let first_name, email_address, emp_id, temp_password, business_name;

    if ((payload.event === "user.confirmed" || payload.event === "user.email_confirmed") && payload.user) {
      // Webhook from Supabase or Postgres trigger
      first_name = payload.user.user_metadata?.first_name || "there";
      email_address = payload.user.email;
      emp_id = payload.user.user_metadata?.emp_id || "N/A";
      temp_password = payload.user.user_metadata?.temp_password || undefined;
      business_name = payload.user.user_metadata?.business_name || "ShiftSync";
    } else {
      // Direct call (from onboarding flow)
      first_name = payload.first_name;
      email_address = payload.email_address;
      emp_id = payload.emp_id;
      temp_password = payload.temp_password;
      business_name = payload.business_name || "ShiftSync";
    }

    // Compose professional onboarding email HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Onboarding: Welcome to ${business_name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .welcome-box { background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .credentials-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .login-button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: white; padding: 15px; border-radius: 6px; text-align: center; }
          .info-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 18px; font-weight: 600; color: #333; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to ${business_name}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is ready to go</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2 style="color: #333; margin-top: 0;">Hi ${first_name},</h2>
              <p>Welcome to the team! We're excited to have you on board at <strong>${business_name}</strong>.</p>
              <p>Your account has been successfully created and you can now access our workforce management platform.</p>
            </div>

            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #1976d2;">Your Login Credentials</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Employee ID</div>
                  <div class="info-value">${emp_id}</div>
                </div>
              </div>
              ${temp_password ? `
              <div class="highlight">
                <strong>🔐 Temporary Password:</strong> ${temp_password}
                <br><small style="color: #666;">Please change this password after your first login for security.</small>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center;">
              <a href="https://localhost:3000/login" class="login-button">Login to Your Account</a>
            </div>

            <div class="highlight">
              <h4 style="margin-top: 0; color: #856404;">📋 What's Next?</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Log in using your credentials above</li>
                <li>Complete your profile setup</li>
                <li>Review your schedule and upcoming shifts</li>
              </ul>
            </div>

            <div style="background: #f1f3f4; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #333;">💡 Need Help?</h4>
              <p style="margin: 10px 0;">If you have any questions or need assistance getting started, please don't hesitate to reach out to your manager or our support team.</p>
            </div>
          </div>

          <div class="footer">
            <p>This email was sent by ShiftSync on behalf of ${business_name}.</p>
            <p>If you didn't expect this email, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send onboarding email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: "ShiftSync <onboarding@shiftssync.com>",
      to: email_address,
      subject: `Welcome to ${business_name}! Your Account is Ready`,
      html,
    });

    if (error) {
      console.error("Email error:", error);
      return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
    }

    return withCors(new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (err: unknown) {
    console.error('Function error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return withCors(new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
});
