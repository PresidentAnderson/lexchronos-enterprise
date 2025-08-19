import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/search/filters - Get available filter options for search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // cases, documents, etc.

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const filters = {
      organizationId,
      type,
      options: {} as Record<string, any[]>
    };

    // Get case-related filters
    if (!type || type === 'cases') {
      const [caseStatuses, caseTypes, casePriorities, assignees] = await Promise.all([
        // Get unique case statuses
        prisma.case.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),
        // Get unique case types
        prisma.case.groupBy({
          by: ['type'],
          where: { organizationId },
          _count: { type: true }
        }),
        // Get unique case priorities
        prisma.case.groupBy({
          by: ['priority'],
          where: { organizationId },
          _count: { priority: true }
        }),
        // Get assignees
        prisma.user.findMany({
          where: { 
            organizationId,
            isActive: true,
            assignedCases: {
              some: {}
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            _count: {
              select: {
                assignedCases: true
              }
            }
          }
        })
      ]);

      filters.options.caseStatuses = caseStatuses.map(s => ({
        value: s.status,
        label: s.status.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: s._count.status
      }));

      filters.options.caseTypes = caseTypes.map(t => ({
        value: t.type,
        label: t.type.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: t._count.type
      }));

      filters.options.casePriorities = casePriorities.map(p => ({
        value: p.priority,
        label: p.priority.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: p._count.priority
      }));

      filters.options.assignees = assignees.map(a => ({
        value: a.id,
        label: `${a.firstName} ${a.lastName}`,
        count: a._count.assignedCases
      }));
    }

    // Get document-related filters
    if (!type || type === 'documents') {
      const [docCategories, docTypes, uploaders] = await Promise.all([
        // Get unique document categories
        prisma.document.groupBy({
          by: ['category'],
          where: { organizationId },
          _count: { category: true }
        }),
        // Get unique document types
        prisma.document.groupBy({
          by: ['type'],
          where: { organizationId },
          _count: { type: true }
        }),
        // Get document uploaders
        prisma.user.findMany({
          where: { 
            organizationId,
            isActive: true,
            documents: {
              some: {}
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            _count: {
              select: {
                documents: true
              }
            }
          }
        })
      ]);

      filters.options.documentCategories = docCategories.map(c => ({
        value: c.category,
        label: c.category.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: c._count.category
      }));

      filters.options.documentTypes = docTypes.map(t => ({
        value: t.type,
        label: t.type.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: t._count.type
      }));

      filters.options.uploaders = uploaders.map(u => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}`,
        count: u._count.documents
      }));
    }

    // Get user-related filters
    if (!type || type === 'users') {
      const [userRoles, userTitles] = await Promise.all([
        // Get unique user roles
        prisma.user.groupBy({
          by: ['role'],
          where: { organizationId, isActive: true },
          _count: { role: true }
        }),
        // Get unique user titles (non-null only)
        prisma.user.groupBy({
          by: ['title'],
          where: { 
            organizationId, 
            isActive: true,
            title: { not: null }
          },
          _count: { title: true }
        })
      ]);

      filters.options.userRoles = userRoles.map(r => ({
        value: r.role,
        label: r.role.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: r._count.role
      }));

      filters.options.userTitles = userTitles
        .filter(t => t.title) // Extra safety check
        .map(t => ({
          value: t.title,
          label: t.title!,
          count: t._count.title
        }));
    }

    // Get timeline-related filters
    if (!type || type === 'timelines') {
      const [eventTypes, importanceLevels] = await Promise.all([
        // Get unique event types
        prisma.timeline.groupBy({
          by: ['eventType'],
          where: { organizationId },
          _count: { eventType: true }
        }),
        // Get unique importance levels
        prisma.timeline.groupBy({
          by: ['importance'],
          where: { organizationId },
          _count: { importance: true }
        })
      ]);

      filters.options.eventTypes = eventTypes.map(e => ({
        value: e.eventType,
        label: e.eventType.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: e._count.eventType
      }));

      filters.options.importanceLevels = importanceLevels.map(i => ({
        value: i.importance,
        label: i.importance.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: i._count.importance
      }));
    }

    // Get evidence-related filters
    if (!type || type === 'evidence') {
      const [evidenceTypes, relevanceLevels] = await Promise.all([
        // Get unique evidence types
        prisma.evidence.groupBy({
          by: ['type'],
          where: { organizationId },
          _count: { type: true }
        }),
        // Get unique relevance levels
        prisma.evidence.groupBy({
          by: ['relevance'],
          where: { organizationId },
          _count: { relevance: true }
        })
      ]);

      filters.options.evidenceTypes = evidenceTypes.map(e => ({
        value: e.type,
        label: e.type.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: e._count.type
      }));

      filters.options.relevanceLevels = relevanceLevels.map(r => ({
        value: r.relevance,
        label: r.relevance.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: r._count.relevance
      }));
    }

    // Get deadline-related filters
    if (!type || type === 'deadlines') {
      const [deadlineTypes, deadlineStatuses, deadlinePriorities] = await Promise.all([
        // Get unique deadline types
        prisma.deadline.groupBy({
          by: ['type'],
          where: { 
            case: { organizationId }
          },
          _count: { type: true }
        }),
        // Get unique deadline statuses
        prisma.deadline.groupBy({
          by: ['status'],
          where: { 
            case: { organizationId }
          },
          _count: { status: true }
        }),
        // Get unique deadline priorities
        prisma.deadline.groupBy({
          by: ['priority'],
          where: { 
            case: { organizationId }
          },
          _count: { priority: true }
        })
      ]);

      filters.options.deadlineTypes = deadlineTypes.map(d => ({
        value: d.type,
        label: d.type.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: d._count.type
      }));

      filters.options.deadlineStatuses = deadlineStatuses.map(s => ({
        value: s.status,
        label: s.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: s._count.status
      }));

      filters.options.deadlinePriorities = deadlinePriorities.map(p => ({
        value: p.priority,
        label: p.priority.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        count: p._count.priority
      }));
    }

    // Add date range options
    const now = new Date();
    filters.options.dateRanges = [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'quarter', label: 'This Quarter' },
      { value: 'year', label: 'This Year' },
      { value: 'custom', label: 'Custom Range' }
    ];

    // Add common cases for quick filtering
    const recentCases = await prisma.case.findMany({
      where: { organizationId },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    filters.options.recentCases = recentCases.map(c => ({
      value: c.id,
      label: `${c.caseNumber} - ${c.title}`,
      status: c.status
    }));

    return NextResponse.json({
      success: true,
      data: filters
    });

  } catch (error) {
    console.error('Error getting search filters:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}