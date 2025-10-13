import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';

// GET /api/notifications - Get user notifications with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const isArchived = searchParams.get('isArchived');
    const priority = searchParams.get('priority');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { userId };
    
    if (type) {
      where.type = type;
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    if (isArchived !== null) {
      where.isArchived = isArchived === 'true';
    }

    if (priority) {
      where.priority = priority;
    }

    const result = await paginate(prisma.notification, {
      page,
      limit,
      sortBy,
      sortOrder,
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get notification counts
    const counts = await prisma.notification.groupBy({
      by: ['isRead'],
      where: { userId, isArchived: false },
      _count: { _all: true }
    });

    const unreadCount = counts.find(c => !c.isRead)?._count._all || 0;
    const readCount = counts.find(c => c.isRead)?._count._all || 0;

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      counts: {
        unread: unreadCount,
        read: readCount,
        total: unreadCount + readCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      message,
      userId,
      relatedId,
      relatedType,
      actionUrl,
      actionData,
      priority = 'MEDIUM',
      scheduledFor
    } = body;

    // Validate required fields
    if (!type || !title || !message || !userId) {
      return NextResponse.json(
        { success: false, error: 'Type, title, message, and userId are required' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
        relatedId,
        relatedType,
        actionUrl,
        actionData,
        priority,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isRead: false,
        isArchived: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // TODO: Send real-time notification via WebSocket
    // TODO: Send email notification if user preferences allow
    // TODO: Send push notification if enabled

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/mark-read - Mark multiple notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, userId, markAll = false } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    let where: any = { userId, isRead: false };

    if (markAll) {
      // Mark all unread notifications as read
    } else if (notificationIds && notificationIds.length > 0) {
      where.id = { in: notificationIds };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either notificationIds or markAll must be provided' },
        { status: 400 }
      );
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}