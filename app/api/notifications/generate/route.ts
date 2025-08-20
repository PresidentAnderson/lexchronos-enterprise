import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/notifications/generate - Generate notifications for deadlines, court dates, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, userId, types = ['DEADLINE_REMINDER', 'COURT_DATE'] } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const notifications = [];

    // Generate deadline reminders
    if (types.includes('DEADLINE_REMINDER')) {
      // Get upcoming deadlines in the next 30 days
      const upcomingDeadlines = await prisma.deadline.findMany({
        where: {
          case: {
            organizationId
          },
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      for (const deadline of upcomingDeadlines) {
        const daysUntilDue = Math.ceil((deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if we should send a reminder based on reminderDays setting
        const shouldRemind = deadline.reminderDays.includes(daysUntilDue) || 
                            (daysUntilDue <= 1); // Always remind if due tomorrow or overdue

        if (shouldRemind) {
          // Check if notification already exists for this deadline and date
          const existingNotification = await prisma.notification.findFirst({
            where: {
              type: 'DEADLINE_REMINDER',
              relatedId: deadline.id,
              relatedType: 'deadline',
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today
              }
            }
          });

          if (!existingNotification) {
            const targetUserId = userId || deadline.assignedTo;
            if (targetUserId) {
              notifications.push({
                type: 'DEADLINE_REMINDER',
                title: `Deadline Reminder: ${deadline.title}`,
                message: `Deadline "${deadline.title}" for case ${deadline.case.caseNumber} is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}`,
                userId: targetUserId,
                relatedId: deadline.id,
                relatedType: 'deadline',
                actionUrl: `/cases/${deadline.case.id}/deadlines/${deadline.id}`,
                priority: daysUntilDue <= 1 ? 'URGENT' : deadline.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
                actionData: {
                  caseId: deadline.case.id,
                  caseNumber: deadline.case.caseNumber,
                  dueDate: deadline.dueDate,
                  daysUntilDue
                }
              });
            }
          }
        }
      }
    }

    // Generate court date reminders
    if (types.includes('COURT_DATE')) {
      // Get upcoming court dates in the next 14 days
      const upcomingCourtDates = await prisma.courtDate.findMany({
        where: {
          organizationId,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: now,
            lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
          }
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              assigneeId: true
            }
          }
        }
      });

      for (const courtDate of upcomingCourtDates) {
        const daysUntilDate = Math.ceil((courtDate.scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send reminders based on reminderDays setting or default schedule
        const defaultReminderDays = [7, 3, 1]; // 1 week, 3 days, 1 day before
        const reminderDays = courtDate.reminderDays.length > 0 ? courtDate.reminderDays : defaultReminderDays;
        
        const shouldRemind = reminderDays.includes(daysUntilDate) || 
                            (daysUntilDate <= 0); // Always remind if due today or overdue

        if (shouldRemind) {
          // Check if notification already exists
          const existingNotification = await prisma.notification.findFirst({
            where: {
              type: 'COURT_DATE',
              relatedId: courtDate.id,
              relatedType: 'courtDate',
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
              }
            }
          });

          if (!existingNotification) {
            const targetUserId = userId || courtDate.case.assigneeId;
            if (targetUserId) {
              notifications.push({
                type: 'COURT_DATE',
                title: `Court Date Reminder: ${courtDate.title}`,
                message: `Court hearing "${courtDate.title}" for case ${courtDate.case.caseNumber} is scheduled ${daysUntilDate === 0 ? 'today' : daysUntilDate === 1 ? 'tomorrow' : `in ${daysUntilDate} days`} at ${courtDate.courtName}`,
                userId: targetUserId,
                relatedId: courtDate.id,
                relatedType: 'courtDate',
                actionUrl: `/cases/${courtDate.case.id}/court-dates/${courtDate.id}`,
                priority: daysUntilDate <= 1 ? 'URGENT' : 'HIGH',
                actionData: {
                  caseId: courtDate.case.id,
                  caseNumber: courtDate.case.caseNumber,
                  scheduledDate: courtDate.scheduledDate,
                  courtName: courtDate.courtName,
                  daysUntilDate
                }
              });
            }
          }
        }
      }
    }

    // Generate case update notifications for assigned users
    if (types.includes('CASE_UPDATE') && userId) {
      // Get recently updated cases assigned to the user
      const recentlyUpdatedCases = await prisma.case.findMany({
        where: {
          organizationId,
          assigneeId: userId,
          updatedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          updatedAt: true
        }
      });

      for (const caseData of recentlyUpdatedCases) {
        // Check if we already sent an update notification today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'CASE_UPDATE',
            relatedId: caseData.id,
            relatedType: 'case',
            userId,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        });

        if (!existingNotification) {
          notifications.push({
            type: 'CASE_UPDATE',
            title: `Case Updated: ${caseData.caseNumber}`,
            message: `Case "${caseData.title}" has been updated recently`,
            userId,
            relatedId: caseData.id,
            relatedType: 'case',
            actionUrl: `/cases/${caseData.id}`,
            priority: 'MEDIUM',
            actionData: {
              caseNumber: caseData.caseNumber,
              status: caseData.status,
              lastUpdated: caseData.updatedAt
            }
          });
        }
      }
    }

    // Create all notifications in database
    const createdNotifications = [];
    for (const notificationData of notifications) {
      try {
        const notification = await prisma.notification.create({
          data: notificationData as any,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        createdNotifications.push(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        // Continue with other notifications even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        generatedCount: createdNotifications.length,
        notifications: createdNotifications
      },
      message: `Generated ${createdNotifications.length} notifications`
    });

  } catch (error) {
    console.error('Error generating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/generate/preview - Preview notifications that would be generated
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const preview = {
      deadlineReminders: [],
      courtDateReminders: [],
      caseUpdates: []
    };

    // Preview deadline reminders
    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        case: {
          organizationId
        },
        status: 'PENDING',
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            title: true
          }
        },
        assignee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 10
    });

    (preview as any).deadlineReminders = upcomingDeadlines.map((deadline: any) => {
      const daysUntilDue = Math.ceil((deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: deadline.id,
        title: deadline.title,
        dueDate: deadline.dueDate,
        daysUntilDue,
        case: deadline.case,
        assignee: deadline.assignee,
        priority: daysUntilDue <= 1 ? 'URGENT' : deadline.priority
      };
    });

    // Preview court date reminders
    const upcomingCourtDates = await prisma.courtDate.findMany({
      where: {
        organizationId,
        status: 'SCHEDULED',
        scheduledDate: {
          gte: now,
          lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        case: {
          select: {
            caseNumber: true,
            title: true
          }
        }
      },
      take: 10
    });

    (preview as any).courtDateReminders = upcomingCourtDates.map((courtDate: any) => {
      const daysUntilDate = Math.ceil((courtDate.scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: courtDate.id,
        title: courtDate.title,
        scheduledDate: courtDate.scheduledDate,
        daysUntilDate,
        courtName: courtDate.courtName,
        case: courtDate.case,
        priority: daysUntilDate <= 1 ? 'URGENT' : 'HIGH'
      };
    });

    return NextResponse.json({
      success: true,
      data: preview,
      summary: {
        totalDeadlines: preview.deadlineReminders.length,
        totalCourtDates: preview.courtDateReminders.length,
        urgentItems: [
          ...preview.deadlineReminders.filter(d => d.priority === 'URGENT'),
          ...preview.courtDateReminders.filter(c => c.priority === 'URGENT')
        ].length
      }
    });

  } catch (error) {
    console.error('Error previewing notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}