import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/notifications - Get user notifications with pagination
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
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

    // SECURITY: User can only access their own notifications
    const userAuthId = user.userId;

    // SECURITY: Verify user can only see their own notifications
    if (userId && userId !== userAuthId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to other users\' notifications' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = { userId: userAuthId };
    
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
      where: { userId: userAuthId, isArchived: false },
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
});

// POST /api/notifications - Create new notification (Admin only)
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // SECURITY: Only admins and system can create notifications for other users
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can create notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      title,
      message,
      userId: targetUserId,
      relatedId,
      relatedType,
      actionUrl,
      actionData,
      priority = 'MEDIUM',
      scheduledFor
    } = body;

    // Validate required fields
    if (!type || !title || !message || !targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Type, title, message, and userId are required' },
        { status: 400 }
      );
    }

    // Validate target user exists and belongs to same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, organizationId: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify target user belongs to same organization
    if (targetUser.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create notifications for users in other organizations' },
        { status: 403 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId: targetUserId,
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
});

// PUT /api/notifications/mark-read - Mark multiple notifications as read
export const PUT = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const { notificationIds, userId: requestedUserId, markAll = false } = body;

    // SECURITY: User can only mark their own notifications as read
    const userAuthId = user.userId;

    // SECURITY: Verify user can only modify their own notifications
    if (requestedUserId && requestedUserId !== userAuthId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to other users\' notifications' },
        { status: 403 }
      );
    }

    let where: any = { userId: userAuthId, isRead: false };

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
});