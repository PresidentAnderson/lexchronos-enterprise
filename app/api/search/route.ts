import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/search - Global search across all entities
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // cases, documents, users, etc.
    const limit = parseInt(searchParams.get('limit') || '10');
    const categories = searchParams.get('categories')?.split(',') || ['cases', 'documents', 'users', 'timelines', 'notes'];

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // SECURITY: Verify user can only search within their own organization
    if (organizationId && organizationId !== userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'Cannot search data from other organizations' },
        { status: 403 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchResults = {
      query,
      organizationId: userOrganizationId,
      categories: categories,
      results: {} as Record<string, any[]>,
      totalResults: 0,
      searchTime: Date.now()
    };

    // Search Cases
    if (categories.includes('cases') && (!type || type === 'cases')) {
      const cases = await prisma.case.findMany({
        where: {
          organizationId: userOrganizationId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { caseNumber: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { clientName: { contains: query, mode: 'insensitive' } },
            { court: { contains: query, mode: 'insensitive' } },
            { judge: { contains: query, mode: 'insensitive' } },
            { opposingParty: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          description: true,
          status: true,
          type: true,
          priority: true,
          clientName: true,
          createdAt: true,
          assignee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      searchResults.results.cases = cases.map(c => ({
        ...c,
        resultType: 'case',
        url: `/cases/${c.id}`
      }));
      searchResults.totalResults += cases.length;
    }

    // Search Documents
    if (categories.includes('documents') && (!type || type === 'documents')) {
      const documents = await prisma.document.findMany({
        where: {
          organizationId: userOrganizationId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { fileName: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } },
            { ocrText: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          originalName: true,
          category: true,
          type: true,
          fileSize: true,
          createdAt: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true
            }
          },
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      searchResults.results.documents = documents.map(d => ({
        ...d,
        resultType: 'document',
        url: `/documents/${d.id}`
      }));
      searchResults.totalResults += documents.length;
    }

    // Search Users
    if (categories.includes('users') && (!type || type === 'users')) {
      const users = await prisma.user.findMany({
        where: {
          organizationId: userOrganizationId,
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { barNumber: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          role: true,
          barNumber: true,
          createdAt: true
        },
        take: limit,
        orderBy: { lastName: 'asc' }
      });

      searchResults.results.users = users.map(u => ({
        ...u,
        resultType: 'user',
        url: `/users/${u.id}`
      }));
      searchResults.totalResults += users.length;
    }

    // Search Timeline Events
    if (categories.includes('timelines') && (!type || type === 'timelines')) {
      const timelines = await prisma.timeline.findMany({
        where: {
          organizationId: userOrganizationId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { source: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          eventDate: true,
          importance: true,
          location: true,
          createdAt: true,
          case: {
            select: {
              id: true,
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
        },
        take: limit,
        orderBy: { eventDate: 'desc' }
      });

      searchResults.results.timelines = timelines.map(t => ({
        ...t,
        resultType: 'timeline',
        url: `/cases/${t.case.id}/timeline/${t.id}`
      }));
      searchResults.totalResults += timelines.length;
    }

    // Search Notes
    if (categories.includes('notes') && (!type || type === 'notes')) {
      const notes = await prisma.note.findMany({
        where: {
          organizationId: userOrganizationId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          isPrivate: true,
          isPinned: true,
          createdAt: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true
            }
          },
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      searchResults.results.notes = notes.map(n => ({
        ...n,
        resultType: 'note',
        url: n.case ? `/cases/${n.case.id}/notes/${n.id}` : `/notes/${n.id}`,
        // Truncate content for search results
        content: n.content.length > 200 ? n.content.substring(0, 200) + '...' : n.content
      }));
      searchResults.totalResults += notes.length;
    }

    // Search Evidence
    if (categories.includes('evidence') && (!type || type === 'evidence')) {
      const evidence = await prisma.evidence.findMany({
        where: {
          organizationId: userOrganizationId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { source: { contains: query, mode: 'insensitive' } },
            { custodian: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          relevance: true,
          isAuthenticated: true,
          isAdmissible: true,
          source: true,
          dateObtained: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true
            }
          }
        },
        take: limit,
        orderBy: { dateObtained: 'desc' }
      });

      searchResults.results.evidence = evidence.map(e => ({
        ...e,
        resultType: 'evidence',
        url: `/cases/${e.case.id}/evidence/${e.id}`
      }));
      searchResults.totalResults += evidence.length;
    }

    // Search Deadlines
    if (categories.includes('deadlines') && (!type || type === 'deadlines')) {
      const deadlines = await prisma.deadline.findMany({
        where: {
          case: {
            organizationId: userOrganizationId
          },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          type: true,
          priority: true,
          status: true,
          case: {
            select: {
              id: true,
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
        take: limit,
        orderBy: { dueDate: 'asc' }
      });

      searchResults.results.deadlines = deadlines.map(d => ({
        ...d,
        resultType: 'deadline',
        url: `/cases/${d.case.id}/deadlines/${d.id}`
      }));
      searchResults.totalResults += deadlines.length;
    }

    // Calculate search time
    searchResults.searchTime = Date.now() - searchResults.searchTime;

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/search/advanced - Advanced search with complex filters
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const {
      query,
      organizationId,
      filters = {},
      dateRange = {},
      sort = { field: 'relevance', order: 'desc' },
      limit = 20,
      offset = 0
    } = body;

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // SECURITY: Verify user can only search within their own organization
    if (organizationId && organizationId !== userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'Cannot search data from other organizations' },
        { status: 403 }
      );
    }

    // Advanced search would implement more complex filtering logic
    // For now, return a structured response indicating the feature
    const advancedSearchResults = {
      query,
      filters,
      dateRange,
      sort,
      results: [],
      totalCount: 0,
      searchTime: 0,
      facets: {
        types: {},
        dates: {},
        users: {},
        cases: {}
      }
    };

    // TODO: Implement advanced search with:
    // - Full-text search with scoring
    // - Date range filters
    // - Multi-field filtering
    // - Faceted search results
    // - Search analytics
    // - Saved searches

    return NextResponse.json({
      success: true,
      data: advancedSearchResults,
      message: 'Advanced search not fully implemented yet'
    });

  } catch (error) {
    console.error('Error performing advanced search:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});