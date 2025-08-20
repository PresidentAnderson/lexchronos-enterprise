/**
 * Notification Scheduler for LexChronos
 * Handles automated email notifications for deadlines, court dates, and other reminders
 */

import { prisma } from '../db';
import { emailService } from '../email';
import cron from 'node-cron';

interface NotificationJob {
  id: string;
  type: 'deadline' | 'court-date' | 'case-update' | 'system';
  scheduledFor: Date;
  data: any;
}

class NotificationScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Daily notification check at 8 AM
    this.scheduleJob('daily-check', '0 8 * * *', () => {
      this.processDeadlineReminders();
      this.processCourtDateReminders();
      this.cleanupOldNotifications();
    });

    // Hourly urgent deadline check
    this.scheduleJob('hourly-urgent', '0 * * * *', () => {
      this.processUrgentDeadlines();
    });

    console.log('📅 Notification scheduler initialized');
  }

  private scheduleJob(id: string, cronExpression: string, task: () => void) {
    const job = cron.schedule(cronExpression, task, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set(id, job);
  }

  start() {
    if (this.isRunning) return;

    for (const [id, job] of this.jobs.entries()) {
      job.start();
      console.log(`✅ Started notification job: ${id}`);
    }

    this.isRunning = true;
    console.log('🚀 Notification scheduler started');
  }

  stop() {
    if (!this.isRunning) return;

    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      console.log(`⏹️ Stopped notification job: ${id}`);
    }

    this.isRunning = false;
    console.log('⏸️ Notification scheduler stopped');
  }

  async processDeadlineReminders() {
    try {
      console.log('📋 Processing deadline reminders...');

      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Get deadlines approaching in 1, 3, 7, or 14 days
      const upcomingDeadlines = await prisma.deadline.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: today,
            lte: fourteenDaysFromNow
          },
          reminderDays: {
            not: null
          }
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              clientName: true
            }
          },
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      for (const deadline of upcomingDeadlines) {
        const daysUntilDue = Math.ceil((deadline.dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        // Check if reminder should be sent based on reminderDays array
        if (deadline.reminderDays && deadline.reminderDays.includes(daysUntilDue)) {
          const assigneeEmail = deadline.assignee?.email;
          
          if (assigneeEmail) {
            // Check if reminder was already sent today
            const existingNotification = await prisma.notification.findFirst({
              where: {
                type: 'DEADLINE_REMINDER',
                relatedId: deadline.id,
                userId: deadline.assignee.id,
                createdAt: {
                  gte: new Date(today.toDateString()) // Start of today
                }
              }
            });

            if (!existingNotification) {
              await emailService.sendDeadlineReminder(assigneeEmail, deadline, daysUntilDue);
              
              // Create notification record
              await prisma.notification.create({
                data: {
                  type: 'DEADLINE_REMINDER',
                  title: `Deadline Reminder: ${deadline.title}`,
                  message: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
                  userId: deadline.assignee.id,
                  relatedId: deadline.id,
                  relatedType: 'deadline',
                  priority: daysUntilDue <= 1 ? 'URGENT' : daysUntilDue <= 3 ? 'HIGH' : 'MEDIUM',
                  actionUrl: `/deadlines/${deadline.id}`
                }
              });

              console.log(`📧 Sent deadline reminder for: ${deadline.title} (${daysUntilDue} days)`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing deadline reminders:', error);
    }
  }

  async processCourtDateReminders() {
    try {
      console.log('⚖️ Processing court date reminders...');

      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcomingCourtDates = await prisma.courtDate.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            gte: today,
            lte: sevenDaysFromNow
          },
          reminderSet: true,
          reminderDays: {
            not: null
          }
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              clientName: true,
              assignee: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          organization: {
            select: {
              users: {
                where: { isActive: true },
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        }
      });

      for (const courtDate of upcomingCourtDates) {
        const daysUntilCourt = Math.ceil((courtDate.scheduledDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        if (courtDate.reminderDays && courtDate.reminderDays.includes(daysUntilCourt)) {
          // Send to case assignee
          if (courtDate.case.assignee?.email) {
            await this.sendCourtDateReminder(courtDate, courtDate.case.assignee, daysUntilCourt);
          }

          // Send to other relevant team members (paralegals, admins)
          const relevantUsers = courtDate.organization.users.filter(user => 
            user.role === 'PARALEGAL' || user.role === 'ADMIN'
          );

          for (const user of relevantUsers) {
            await this.sendCourtDateReminder(courtDate, user, daysUntilCourt);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing court date reminders:', error);
    }
  }

  private async sendCourtDateReminder(courtDate: any, user: any, daysLeft: number) {
    try {
      // Check if reminder was already sent today
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'COURT_DATE',
          relatedId: courtDate.id,
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().toDateString())
          }
        }
      });

      if (!existingNotification) {
        await emailService.sendCourtDateReminder(user.email, courtDate, daysLeft);
        
        // Create notification record
        await prisma.notification.create({
          data: {
            type: 'COURT_DATE',
            title: `Court Date: ${courtDate.title}`,
            message: `Scheduled for ${courtDate.scheduledDate.toDateString()}`,
            userId: user.id,
            relatedId: courtDate.id,
            relatedType: 'court-date',
            priority: daysLeft <= 1 ? 'URGENT' : 'HIGH',
            actionUrl: `/court-dates/${courtDate.id}`
          }
        });

        console.log(`⚖️ Sent court date reminder for: ${courtDate.title} to ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Error sending court date reminder to ${user.email}:`, error);
    }
  }

  async processUrgentDeadlines() {
    try {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const urgentDeadlines = await prisma.deadline.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: today,
            lte: tomorrow
          }
        },
        include: {
          case: true,
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      for (const deadline of urgentDeadlines) {
        if (deadline.assignee?.email) {
          const daysLeft = Math.ceil((deadline.dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          
          // Send urgent notification
          await prisma.notification.create({
            data: {
              type: 'DEADLINE_REMINDER',
              title: `🚨 URGENT: ${deadline.title}`,
              message: `Due ${daysLeft === 0 ? 'TODAY' : 'TOMORROW'}!`,
              userId: deadline.assignee.id,
              relatedId: deadline.id,
              relatedType: 'deadline',
              priority: 'URGENT',
              actionUrl: `/deadlines/${deadline.id}`
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error processing urgent deadlines:', error);
    }
  }

  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          isRead: true
        }
      });

      console.log('🧹 Cleaned up old notifications');
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
    }
  }

  // Manual methods for testing
  async sendTestDeadlineReminder(deadlineId: string) {
    try {
      const deadline = await prisma.deadline.findUnique({
        where: { id: deadlineId },
        include: {
          case: true,
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (deadline && deadline.assignee?.email) {
        const daysLeft = Math.ceil((deadline.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        await emailService.sendDeadlineReminder(deadline.assignee.email, deadline, daysLeft);
        console.log(`📧 Test deadline reminder sent for: ${deadline.title}`);
      }
    } catch (error) {
      console.error('❌ Error sending test deadline reminder:', error);
    }
  }

  async sendTestCourtDateReminder(courtDateId: string) {
    try {
      const courtDate = await prisma.courtDate.findUnique({
        where: { id: courtDateId },
        include: {
          case: {
            include: {
              assignee: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (courtDate && courtDate.case.assignee?.email) {
        const daysLeft = Math.ceil((courtDate.scheduledDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        await emailService.sendCourtDateReminder(courtDate.case.assignee.email, courtDate, daysLeft);
        console.log(`⚖️ Test court date reminder sent for: ${courtDate.title}`);
      }
    } catch (error) {
      console.error('❌ Error sending test court date reminder:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;