/**
 * Email Service for LexChronos
 * Handles transactional emails, notifications, and templates
 */

import nodemailer from 'nodemailer';

// Dynamic imports to avoid webpack warnings
let fs: any;
let path: any;
let handlebars: any;

// Only import these on server side to avoid webpack bundling issues
if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
    handlebars = require('handlebars');
  } catch (error) {
    console.warn('Email templates may not be available:', error);
  }
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: any;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: {
        name: process.env.FROM_NAME || 'LexChronos',
        address: process.env.FROM_EMAIL || 'noreply@lexchronos.com'
      }
    };

    this.initialize();
  }

  private async initialize() {
    try {
      // Create nodemailer transporter
      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      if (process.env.NODE_ENV !== 'test') {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }

      // Load email templates
      await this.loadTemplates();
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      
      // In development, fall back to console logging
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email service will log to console in development mode');
      }
    }
  }

  private async loadTemplates() {
    // Only load templates on server side
    if (typeof window !== 'undefined' || !fs || !path || !handlebars) {
      console.log('📧 Email templates skipped (client side or dependencies missing)');
      return;
    }

    const templatesDir = path.join(process.cwd(), 'email-templates');
    
    try {
      if (fs.existsSync(templatesDir)) {
        const templateFiles = fs.readdirSync(templatesDir).filter((file: string) => file.endsWith('.hbs'));
        
        for (const file of templateFiles) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
        
        console.log(`📧 Loaded ${templateFiles.length} email templates`);
      }
    } catch (error) {
      console.error('❌ Failed to load email templates:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailData: nodemailer.SendMailOptions = {
        from: options.from || `"${this.config.from.name}" <${this.config.from.address}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments
      };

      // Use template if specified
      if (options.template && this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        emailData.html = template(options.data || {});
        
        // Generate text version from HTML if not provided
        if (!options.text) {
          emailData.text = this.htmlToText(emailData.html);
        }
      } else {
        emailData.html = options.html;
        emailData.text = options.text;
      }

      // In development or if no transporter, log to console
      if (!this.transporter || process.env.NODE_ENV === 'development') {
        console.log('📧 Email (would be sent):');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('Template:', options.template);
        console.log('Data:', options.data);
        console.log('---');
        return true;
      }

      const result = await this.transporter.sendMail(emailData);
      console.log('✅ Email sent successfully:', result.messageId);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Notification email methods
  async sendDeadlineReminder(to: string, deadline: any, daysLeft: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Deadline Reminder: ${deadline.title} (${daysLeft} days left)`,
      template: 'deadline-reminder',
      data: {
        deadline,
        daysLeft,
        urgencyClass: daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'normal'
      }
    });
  }

  async sendCourtDateReminder(to: string, courtDate: any, daysLeft: number): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Court Date Reminder: ${courtDate.title}`,
      template: 'court-date-reminder',
      data: {
        courtDate,
        daysLeft,
        formattedDate: new Date(courtDate.scheduledDate).toLocaleDateString(),
        formattedTime: courtDate.scheduledTime
      }
    });
  }

  async sendWelcomeEmail(to: string, user: any, organization: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Welcome to LexChronos - ${organization.name}`,
      template: 'welcome',
      data: {
        user,
        organization,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
      }
    });
  }

  async sendPasswordReset(to: string, user: any, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to,
      subject: 'Reset Your LexChronos Password',
      template: 'password-reset',
      data: {
        user,
        resetUrl,
        expirationHours: 24
      }
    });
  }

  async sendCaseAssignment(to: string, user: any, caseData: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `New Case Assignment: ${caseData.title}`,
      template: 'case-assignment',
      data: {
        user,
        case: caseData,
        caseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cases/${caseData.id}`
      }
    });
  }

  async sendInvoice(to: string, invoice: any, organization: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Invoice ${invoice.number} from ${organization.name}`,
      template: 'invoice',
      data: {
        invoice,
        organization,
        paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pay`
      }
    });
  }

  async sendSystemNotification(to: string, notification: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `System Notification: ${notification.title}`,
      template: 'system-notification',
      data: {
        notification,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@lexchronos.com'
      }
    });
  }

  // Utility methods
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Template management
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  hasTemplate(templateName: string): boolean {
    return this.templates.has(templateName);
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;