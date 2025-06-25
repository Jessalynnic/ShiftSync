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

    // Compose email HTML
    let html = `
      <div>
        <h1>Welcome to ${business_name}</h1>
        <p>Hi <strong>${first_name}</strong>,</p>
        <p>Your Employee ID: <b>${emp_id}</b></p>
    `;
    if (temp_password) {
      html += `<p>Your Temporary Password: <b>${temp_password}</b></p>`;
    }
    html += `
        <p>
          <b>Your account is now confirmed! You can log in and get started.</b>
        </p>
      </div>
    `;

    // Send onboarding email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: "ShiftSync <onboarding@shiftssync.com>",
      to: email_address,
      subject: `Welcome to ${business_name}!`,
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
