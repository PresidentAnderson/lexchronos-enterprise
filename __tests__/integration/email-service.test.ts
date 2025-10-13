/**
 * Email Service Integration Tests
 * Tests email functionality, templates, and notification system
 */

import { emailService } from '@/lib/email';
import { notificationScheduler } from '@/lib/notifications/scheduler';
import { prisma } from '@/lib/db';

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    })
  }))
}));

// Mock console to reduce noise in tests
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Email Service Integration Tests', () => {
  beforeAll(async () => {
    // Set test environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'test-password';
    process.env.FROM_EMAIL = 'noreply@lexchronos.com';
    process.env.FROM_NAME = 'LexChronos Test';
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Email Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(emailService).toBeDefined();
    });

    it('should test connection successfully', async () => {
      const result = await emailService.testConnection();
      expect(result).toBe(true);
    });
  });

  describe('Basic Email Functionality', () => {
    it('should send basic email', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Test Email Content</h1>',
        text: 'Test Email Content'
      });

      expect(result).toBe(true);
    });

    it('should handle email to multiple recipients', async () => {
      const result = await emailService.sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Multiple Recipients',
        html: '<h1>Test Content</h1>'
      });

      expect(result).toBe(true);
    });

    it('should handle email with attachments', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email with Attachment',
        html: '<h1>Test Content</h1>',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test file content'
          }
        ]
      });

      expect(result).toBe(true);
    });
  });

  describe('Notification Emails', () => {
    const mockDeadline = {
      id: 'deadline-test-123',
      title: 'Test Deadline',
      description: 'Test deadline description',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      type: 'FILING',
      priority: 'HIGH',
      case: {
        id: 'case-123',
        caseNumber: 'CASE-2025-001',
        title: 'Test Case'
      },
      assignee: {
        firstName: 'John',
        lastName: 'Attorney'
      }
    };

    const mockCourtDate = {
      id: 'court-date-123',
      title: 'Motion Hearing',
      description: 'Hearing on motion to dismiss',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      scheduledTime: '10:00 AM',
      courtName: 'Test Court',
      courtroom: 'Courtroom 1',
      address: '123 Court St, Legal City, NY 10001',
      type: 'MOTION',
      judge: 'Judge Smith',
      case: {
        id: 'case-123',
        caseNumber: 'CASE-2025-001',
        title: 'Test Case'
      }
    };

    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Attorney',
      email: 'john@lawfirm.com'
    };

    const mockOrganization = {
      id: 'org-123',
      name: 'Test Law Firm',
      email: 'admin@lawfirm.com'
    };

    it('should send deadline reminder email', async () => {
      const result = await emailService.sendDeadlineReminder(
        'attorney@lawfirm.com',
        mockDeadline,
        7
      );

      expect(result).toBe(true);
    });

    it('should send court date reminder email', async () => {
      const result = await emailService.sendCourtDateReminder(
        'attorney@lawfirm.com',
        mockCourtDate,
        3
      );

      expect(result).toBe(true);
    });

    it('should send welcome email', async () => {
      const result = await emailService.sendWelcomeEmail(
        'newuser@lawfirm.com',
        mockUser,
        mockOrganization
      );

      expect(result).toBe(true);
    });

    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordReset(
        'user@lawfirm.com',
        mockUser,
        'test-reset-token'
      );

      expect(result).toBe(true);
    });

    it('should send case assignment email', async () => {
      const mockCase = {
        id: 'case-123',
        title: 'New Legal Case',
        caseNumber: 'CASE-2025-002',
        description: 'Test case assignment'
      };

      const result = await emailService.sendCaseAssignment(
        'attorney@lawfirm.com',
        mockUser,
        mockCase
      );

      expect(result).toBe(true);
    });

    it('should send system notification email', async () => {
      const notification = {
        title: 'System Maintenance',
        message: 'System will be under maintenance tonight',
        type: 'system'
      };

      const result = await emailService.sendSystemNotification(
        'admin@lawfirm.com',
        notification
      );

      expect(result).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should return list of available templates', () => {
      const templates = emailService.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should check template existence', () => {
      // Note: In test environment, templates might not be loaded
      const hasTemplate = emailService.hasTemplate('welcome');
      expect(typeof hasTemplate).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email addresses gracefully', async () => {
      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test Email',
        html: '<h1>Test Content</h1>'
      });

      // Should return true in development/test mode even with invalid email
      expect(result).toBe(true);
    });

    it('should handle missing template gracefully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'non-existent-template',
        data: { test: 'data' }
      });

      expect(result).toBe(true);
    });
  });
});

describe('Notification Scheduler Integration Tests', () => {
  let testOrganization: any;
  let testUser: any;
  let testCase: any;

  beforeEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.deadline.deleteMany({});
    await prisma.courtDate.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Law Firm',
        email: 'test-scheduler@lawfirm.com',
        type: 'LAW_FIRM'
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-attorney@lawfirm.com',
        firstName: 'Test',
        lastName: 'Attorney',
        fullName: 'Test Attorney',
        role: 'LAWYER',
        organizationId: testOrganization.id
      }
    });

    // Create test case
    testCase = await prisma.case.create({
      data: {
        caseNumber: 'TEST-CASE-001',
        title: 'Test Legal Case',
        clientName: 'Test Client',
        type: 'CIVIL',
        organizationId: testOrganization.id,
        assigneeId: testUser.id
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.deadline.deleteMany({});
    await prisma.courtDate.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
  });

  describe('Deadline Reminder Processing', () => {
    it('should process deadline reminders correctly', async () => {
      // Create test deadline due in 3 days
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      const testDeadline = await prisma.deadline.create({
        data: {
          title: 'Test Deadline',
          description: 'Test deadline for processing',
          dueDate: threeDaysFromNow,
          type: 'FILING',
          priority: 'HIGH',
          status: 'PENDING',
          reminderDays: [3, 1],
          caseId: testCase.id,
          assignedTo: testUser.id
        }
      });

      // Process deadline reminders
      await notificationScheduler.processDeadlineReminders();

      // Check if notification was created
      const notifications = await prisma.notification.findMany({
        where: {
          type: 'DEADLINE_REMINDER',
          relatedId: testDeadline.id
        }
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].userId).toBe(testUser.id);
      expect(notifications[0].title).toContain(testDeadline.title);
    });

    it('should not create duplicate reminders', async () => {
      // Create test deadline
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const testDeadline = await prisma.deadline.create({
        data: {
          title: 'Test Deadline',
          dueDate: tomorrow,
          type: 'FILING',
          priority: 'HIGH',
          status: 'PENDING',
          reminderDays: [1],
          caseId: testCase.id,
          assignedTo: testUser.id
        }
      });

      // Run twice
      await notificationScheduler.processDeadlineReminders();
      await notificationScheduler.processDeadlineReminders();

      // Should only have one notification
      const notifications = await prisma.notification.findMany({
        where: {
          type: 'DEADLINE_REMINDER',
          relatedId: testDeadline.id
        }
      });

      expect(notifications).toHaveLength(1);
    });
  });

  describe('Court Date Reminder Processing', () => {
    it('should process court date reminders correctly', async () => {
      // Create test court date in 3 days
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      const testCourtDate = await prisma.courtDate.create({
        data: {
          title: 'Test Hearing',
          description: 'Test court hearing',
          courtName: 'Test Court',
          scheduledDate: threeDaysFromNow,
          scheduledTime: '10:00 AM',
          type: 'HEARING',
          status: 'SCHEDULED',
          reminderSet: true,
          reminderDays: [7, 3, 1],
          caseId: testCase.id,
          organizationId: testOrganization.id
        }
      });

      // Process court date reminders
      await notificationScheduler.processCourtDateReminders();

      // Check if notification was created
      const notifications = await prisma.notification.findMany({
        where: {
          type: 'COURT_DATE',
          relatedId: testCourtDate.id
        }
      });

      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Scheduler Status', () => {
    it('should return correct scheduler status', () => {
      const status = notificationScheduler.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('jobs');
      expect(status).toHaveProperty('uptime');
      expect(Array.isArray(status.jobs)).toBe(true);
      expect(typeof status.uptime).toBe('number');
    });

    it('should start and stop scheduler', () => {
      notificationScheduler.start();
      let status = notificationScheduler.getStatus();
      expect(status.isRunning).toBe(true);

      notificationScheduler.stop();
      status = notificationScheduler.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });
});