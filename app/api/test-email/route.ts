import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  // SECURITY: Only admins can send test emails
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Only administrators can send test emails' },
      { status: 403 }
    );
  }
  try {
    // Parse request body
    const body = await request.json();
    const { to, subject, text } = body;

    // Validate input
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Test email configuration
    const result = await emailService.sendEmail({
      to: to || 'info@richereverydayineveryway.com',
      subject: subject || 'Test Email from LexChronos',
      text: text || 'This is a test email to verify SMTP configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">LexChronos Email Test</h2>
          <p>${text || 'This is a test email to verify SMTP configuration is working correctly.'}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent from LexChronos Legal Case Management System<br>
            Configuration: Gmail SMTP via ${process.env.SMTP_USER}
          </p>
        </div>
      `
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        configuration: {
          smtp_host: process.env.SMTP_HOST,
          smtp_port: process.env.SMTP_PORT,
          from_email: process.env.FROM_EMAIL,
          from_name: process.env.FROM_NAME
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test email. Check server logs for details.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Email test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// GET method to check email configuration status
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  // SECURITY: Only admins can view email configuration
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Only administrators can view email configuration' },
      { status: 403 }
    );
  }
  try {
    const isConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    const testResult = await emailService.testConnection();

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      connected: testResult,
      configuration: {
        smtp_host: process.env.SMTP_HOST || 'Not configured',
        smtp_port: process.env.SMTP_PORT || 'Not configured',
        smtp_user: process.env.SMTP_USER || 'Not configured',
        from_email: process.env.FROM_EMAIL || 'Not configured',
        from_name: process.env.FROM_NAME || 'Not configured',
        support_email: process.env.SUPPORT_EMAIL || 'Not configured'
      },
      instructions: !isConfigured ? {
        message: 'Email is not fully configured',
        steps: [
          '1. Set SMTP_HOST environment variable',
          '2. Set SMTP_PORT environment variable',
          '3. Set SMTP_USER environment variable',
          '4. Set SMTP_PASS environment variable',
          '5. For Gmail, use app-specific password with 2FA enabled'
        ]
      } : null
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});