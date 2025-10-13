import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/timelines/generate - Generate timeline for a case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, userId } = body;

    if (!caseId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Case ID and User ID are required' },
        { status: 400 }
      );
    }

    // Validate case exists
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        organization: true,
        deadlines: {
          orderBy: { dueDate: 'asc' }
        },
        courtDates: {
          orderBy: { scheduledDate: 'asc' }
        },
        documents: {
          orderBy: { createdAt: 'asc' }
        },
        billingEntries: {
          where: { type: 'TIME' },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Generate timeline events from case data
    const timelineEvents = [];

    // 1. Case creation event
    timelineEvents.push({
      title: 'Case Created',
      description: `Case ${caseData.caseNumber} was created`,
      eventType: 'GENERAL',
      eventDate: caseData.createdAt,
      importance: 'HIGH',
      isVerified: true,
      source: 'System'
    });

    // 2. Filing date event (if exists)
    if (caseData.filingDate) {
      timelineEvents.push({
        title: 'Case Filed',
        description: `Case ${caseData.caseNumber} was filed in court`,
        eventType: 'FILING',
        eventDate: caseData.filingDate,
        importance: 'HIGH',
        isVerified: true,
        location: caseData.court || undefined,
        source: 'Court Records'
      });
    }

    // 3. Events from deadlines
    for (const deadline of caseData.deadlines) {
      timelineEvents.push({
        title: `Deadline: ${deadline.title}`,
        description: deadline.description || `${deadline.type} deadline`,
        eventType: 'DEADLINE',
        eventDate: deadline.dueDate,
        importance: deadline.priority === 'URGENT' ? 'CRITICAL' : 
                   deadline.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
        isVerified: deadline.status === 'COMPLETED',
        source: 'Deadlines'
      });
    }

    // 4. Events from court dates
    for (const courtDate of caseData.courtDates) {
      timelineEvents.push({
        title: courtDate.title,
        description: courtDate.description || `${courtDate.type} at ${courtDate.courtName}`,
        eventType: 'HEARING',
        eventDate: courtDate.scheduledDate,
        endDate: courtDate.estimatedDuration ? 
          new Date(courtDate.scheduledDate.getTime() + courtDate.estimatedDuration * 60000) : 
          undefined,
        location: `${courtDate.courtName}${courtDate.courtroom ? ', ' + courtDate.courtroom : ''}`,
        importance: 'HIGH',
        isVerified: courtDate.status === 'COMPLETED',
        source: 'Court Schedule'
      });
    }

    // 5. Events from important documents
    const importantDocTypes = ['PLEADING', 'MOTION', 'BRIEF', 'EXHIBIT'];
    for (const doc of caseData.documents) {
      if (importantDocTypes.includes(doc.category)) {
        timelineEvents.push({
          title: `Document Filed: ${doc.title}`,
          description: `${doc.category} document uploaded`,
          eventType: 'FILING',
          eventDate: doc.createdAt,
          importance: 'NORMAL',
          isVerified: true,
          source: 'Document Management'
        });
      }
    }

    // 6. Major billing milestones (large time entries might indicate significant work)
    const significantBillingEntries = caseData.billingEntries.filter(
      entry => entry.hours && entry.hours >= 8 // 8+ hour days
    );

    for (const entry of significantBillingEntries) {
      timelineEvents.push({
        title: `Major Work Session: ${entry.task}`,
        description: `${entry.hours} hours of ${entry.task.toLowerCase()} work`,
        eventType: 'GENERAL',
        eventDate: entry.date,
        importance: 'LOW',
        isVerified: true,
        source: 'Billing Records'
      });
    }

    // 7. Case status changes (simulate from close date)
    if (caseData.closeDate) {
      timelineEvents.push({
        title: 'Case Closed',
        description: `Case ${caseData.caseNumber} was closed with status: ${caseData.status}`,
        eventType: 'GENERAL',
        eventDate: caseData.closeDate,
        importance: 'HIGH',
        isVerified: true,
        source: 'Case Management'
      });
    }

    // Sort events by date
    timelineEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Create timeline events in database
    const createdEvents = [];
    for (const event of timelineEvents) {
      try {
        const createdEvent = await prisma.timeline.create({
          data: {
            ...event,
            organizationId: caseData.organizationId,
            caseId: caseData.id,
            createdById: userId
          },
          include: {
            case: {
              select: {
                caseNumber: true,
                title: true
              }
            },
            createdBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });
        createdEvents.push(createdEvent);
      } catch (error) {
        console.error('Error creating timeline event:', error);
        // Continue with other events even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        caseId: caseData.id,
        caseNumber: caseData.caseNumber,
        eventsGenerated: createdEvents.length,
        events: createdEvents
      },
      message: `Generated ${createdEvents.length} timeline events for case ${caseData.caseNumber}`
    });

  } catch (error) {
    console.error('Error generating timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/timelines/generate/[caseId] - Get generated timeline for case
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const caseId = pathname.split('/').pop();

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Get all timeline events for the case, sorted by date
    const timelineEvents = await prisma.timeline.findMany({
      where: { caseId },
      include: {
        case: {
          select: {
            caseNumber: true,
            title: true,
            status: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { eventDate: 'asc' }
    });

    // Group events by date for better visualization
    const groupedEvents = timelineEvents.reduce((acc, event) => {
      const date = event.eventDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate timeline statistics
    const stats = {
      totalEvents: timelineEvents.length,
      eventTypes: timelineEvents.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      importanceLevels: timelineEvents.reduce((acc, event) => {
        acc[event.importance] = (acc[event.importance] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      verifiedEvents: timelineEvents.filter(e => e.isVerified).length,
      dateRange: {
        start: timelineEvents.length > 0 ? timelineEvents[0].eventDate : null,
        end: timelineEvents.length > 0 ? timelineEvents[timelineEvents.length - 1].eventDate : null
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        caseId,
        events: timelineEvents,
        groupedEvents,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error fetching generated timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}