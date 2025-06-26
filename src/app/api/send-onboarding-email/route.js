import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const body = await request.json();
    const { first_name, email_address, emp_id, temp_password, business_name } = body;

    if (!first_name || !email_address || !emp_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch the actual business name from the database
    const { data: employeeData, error: employeeError } = await supabase
      .from('employee')
      .select(`
        business_id,
        last_name,
        business(business_name)
      `)
      .eq('emp_id', emp_id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee data:', employeeError);
      return NextResponse.json({ success: false, error: 'Failed to fetch employee data.' }, { status: 500 });
    }

    const actualBusinessName = employeeData.business?.business_name || business_name || 'ShiftSync';

    // Try Edge Function first, then fallback to direct Resend
    let emailSent = false;
    let edgeFunctionError = null;

    try {
      // Call the Supabase Edge Function
      const res = await fetch(
        `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.functions.supabase.co/send-onboarding-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ 
            first_name, 
            email_address, 
            emp_id, 
            temp_password, 
            business_name: actualBusinessName 
          }),
        }
      );

      let data;
      const responseText = await res.text();
      
      try {
        data = JSON.parse(responseText);
        if (res.ok && data.success) {
          emailSent = true;
        }
      } catch (parseError) {
        edgeFunctionError = `Edge Function error: ${res.status} - ${responseText.substring(0, 100)}`;
      }
    } catch (fetchError) {
      edgeFunctionError = `Edge Function fetch error: ${fetchError.message}`;
    }

    // Fallback: Send email directly using Resend
    if (!emailSent) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Onboarding: Welcome to ${actualBusinessName}</title>
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
                <h1 style="margin: 0; font-size: 28px;">Welcome to ${actualBusinessName}!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is ready to go</p>
              </div>
              
              <div class="content">
                <div class="welcome-box">
                  <h2 style="color: #333; margin-top: 0;">Hi ${first_name},</h2>
                  <p>Welcome to the team! We're excited to have you on board at <strong>${actualBusinessName}</strong>.</p>
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
                  <a href="http://localhost:3000/login" class="login-button">Login to Your Account</a>
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
                <p>This email was sent by ShiftSync on behalf of ${actualBusinessName}.</p>
                <p>If you didn't expect this email, please contact your administrator.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const { data, error } = await resend.emails.send({
          from: "ShiftSync <onboarding@shiftssync.com>",
          to: email_address,
          subject: `Welcome to ${actualBusinessName}! Your Account is Ready`,
          html,
        });

        if (error) {
          throw new Error(error.message);
        }

        emailSent = true;
        console.log('Email sent via fallback Resend service');
      } catch (resendError) {
        console.error('Fallback email error:', resendError);
        if (edgeFunctionError) {
          console.error('Original Edge Function error:', edgeFunctionError);
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to send onboarding email. Both Edge Function and fallback service failed.' 
        }, { status: 500 });
      }
    }

    // Record that the onboarding email was sent
    const { error: updateError } = await supabase
      .from('employee')
      .update({ onboarding_email_sent_at: new Date().toISOString() })
      .eq('emp_id', emp_id);

    if (updateError) {
      console.error('Error updating onboarding email status:', updateError);
      // Don't fail the request, just log the error
    }

    // Log activity: onboarding email sent
    try {
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .insert({
          business_id: employeeData.business_id,
          user_id: null,
          type: 'email',
          description: `Sent onboarding email to ${first_name} ${employeeData.last_name} (${emp_id})`,
          employee_id: emp_id,
          metadata: { 
            action: 'onboarding_email_sent',
            email_address: email_address,
            method: emailSent ? 'edge_function' : 'fallback_resend'
          }
        })
        .select();

      if (activityError) {
        console.error('Activity logging error:', activityError);
      }
    } catch (err) {
      // Log but don't block the response
      console.error('Failed to log onboarding email activity:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to send onboarding email.' }, { status: 500 });
  }
} 