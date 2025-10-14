/**
 * Advanced Evidence Search API
 * Combines full-text search with semantic search using OpenAI embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { openAIClient } from '@/lib/ai/openai-client';

interface SearchFilters {
  organizationId: string;
  caseIds?: string[];
  categories?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  confidentialityLevels?: string[];
  uploadedBy?: string;
  hasAISummary?: boolean;
}

interface SearchResult {
  document: any;
  relevanceScore: number;
  matchType: 'semantic' | 'full_text' | 'hybrid';
  highlights?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || '';
    const organizationId = searchParams.get('organizationId');
    const searchType = searchParams.get('type') as 'semantic' | 'full_text' | 'hybrid' || 'hybrid';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    // Extract filters
    const filters: SearchFilters = {
      organizationId: organizationId!,
      caseIds: searchParams.get('caseIds')?.split(',').filter(Boolean),
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      confidentialityLevels: searchParams.get('confidentialityLevels')?.split(',').filter(Boolean),
      uploadedBy: searchParams.get('uploadedBy') || undefined,
      hasAISummary: searchParams.get('hasAISummary') === 'true' || undefined,
    };

    // Parse date range
    if (searchParams.get('dateStart') || searchParams.get('dateEnd')) {
      filters.dateRange = {
        start: searchParams.get('dateStart') || undefined,
        end: searchParams.get('dateEnd') || undefined,
      };
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    let results: SearchResult[] = [];

    if (query.trim()) {
      // Perform search based on type
      switch (searchType) {
        case 'semantic':
          results = await performSemanticSearch(query, filters, page, limit);
          break;
        case 'full_text':
          results = await performFullTextSearch(query, filters, page, limit);
          break;
        case 'hybrid':
        default:
          results = await performHybridSearch(query, filters, page, limit);
          break;
      }
    } else {
      // No query - return filtered results only
      results = await getFilteredDocuments(filters, page, limit);
    }

    // Get total count for pagination
    const totalCount = await getTotalCount(query, filters, searchType);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        searchInfo: {
          query,
          searchType,
          resultCount: results.length,
          filters: Object.keys(filters).filter(key => filters[key as keyof SearchFilters])
        }
      }
    });

  } catch (error) {
    console.error('Error in evidence search:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Perform semantic search using OpenAI embeddings
 */
async function performSemanticSearch(
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number
): Promise<SearchResult[]> {
  try {
    // Generate embeddings for the search query
    const queryEmbeddings = await openAIClient.generateEmbeddings(query);
    
    // Use PostgreSQL's vector similarity search (requires pgvector extension)
    const whereClause = buildWhereClause(filters);
    
    const documents = await prisma.$queryRaw`
      SELECT 
        d.*,
        c.case_number,
        c.title as case_title,
        u.first_name,
        u.last_name,
        -- Calculate cosine similarity
        1 - (d.embeddings <=> ${JSON.stringify(queryEmbeddings)}::vector) as relevance_score
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN user_profiles u ON d.uploaded_by_id = u.id
      WHERE ${whereClause}
        AND d.embeddings IS NOT NULL
        AND array_length(d.embeddings, 1) > 0
      ORDER BY relevance_score DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `;

    return (documents as any[]).map(doc => ({
      document: formatDocumentResult(doc),
      relevanceScore: doc.relevance_score,
      matchType: 'semantic' as const,
    }));
  } catch (error) {
    console.error('Semantic search error:', error);
    // Fallback to full-text search
    return performFullTextSearch(query, filters, page, limit);
  }
}

/**
 * Perform full-text search using PostgreSQL's built-in capabilities
 */
async function performFullTextSearch(
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number
): Promise<SearchResult[]> {
  const whereClause = buildWhereClause(filters);
  
  // Build full-text search query
  const searchVector = `
    to_tsvector('english', 
      COALESCE(d.title, '') || ' ' || 
      COALESCE(d.description, '') || ' ' || 
      COALESCE(d.extracted_text, '') || ' ' ||
      COALESCE(d.ai_summary, '')
    )
  `;
  
  const searchQuery = `plainto_tsquery('english', $1)`;
  
  const documents = await prisma.$queryRaw`
    SELECT 
      d.*,
      c.case_number,
      c.title as case_title,
      u.first_name,
      u.last_name,
      ts_rank(${searchVector}, ${searchQuery}) as relevance_score,
      ts_headline('english', 
        COALESCE(d.extracted_text, d.description, ''), 
        ${searchQuery},
        'MaxWords=50, MinWords=10, MaxFragments=3'
      ) as highlights
    FROM documents d
    LEFT JOIN cases c ON d.case_id = c.id
    LEFT JOIN user_profiles u ON d.uploaded_by_id = u.id
    WHERE ${whereClause}
      AND ${searchVector} @@ ${searchQuery}
    ORDER BY relevance_score DESC
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}
  `;

  return (documents as any[]).map(doc => ({
    document: formatDocumentResult(doc),
    relevanceScore: doc.relevance_score,
    matchType: 'full_text' as const,
    highlights: doc.highlights ? [doc.highlights] : undefined,
  }));
}

/**
 * Perform hybrid search combining semantic and full-text results
 */
async function performHybridSearch(
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number
): Promise<SearchResult[]> {
  // Get results from both methods
  const [semanticResults, fullTextResults] = await Promise.all([
    performSemanticSearch(query, filters, 1, limit * 2), // Get more results for merging
    performFullTextSearch(query, filters, 1, limit * 2)
  ]);

  // Merge and deduplicate results
  const combinedResults = new Map<string, SearchResult>();

  // Add semantic results with weight
  semanticResults.forEach(result => {
    combinedResults.set(result.document.id, {
      ...result,
      relevanceScore: result.relevanceScore * 0.6, // Weight semantic results
      matchType: 'semantic'
    });
  });

  // Add full-text results with weight, merging if already exists
  fullTextResults.forEach(result => {
    const existing = combinedResults.get(result.document.id);
    if (existing) {
      // Combine scores for documents found in both searches
      combinedResults.set(result.document.id, {
        ...existing,
        relevanceScore: existing.relevanceScore + (result.relevanceScore * 0.4),
        matchType: 'hybrid',
        highlights: result.highlights || existing.highlights
      });
    } else {
      combinedResults.set(result.document.id, {
        ...result,
        relevanceScore: result.relevanceScore * 0.4, // Weight full-text results
        matchType: 'full_text'
      });
    }
  });

  // Sort by combined relevance score and paginate
  const sortedResults = Array.from(combinedResults.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice((page - 1) * limit, page * limit);

  return sortedResults;
}

/**
 * Get filtered documents without search query
 */
async function getFilteredDocuments(
  filters: SearchFilters,
  page: number,
  limit: number
): Promise<SearchResult[]> {
  const whereClause = buildPrismaWhere(filters);
  
  const documents = await prisma.document.findMany({
    where: whereClause,
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip: (page - 1) * limit,
    take: limit
  });

  return documents.map(doc => ({
    document: formatDocumentResult(doc),
    relevanceScore: 1.0,
    matchType: 'full_text' as const
  }));
}

/**
 * Get total count for pagination
 */
async function getTotalCount(
  query: string,
  filters: SearchFilters,
  searchType: string
): Promise<number> {
  const whereClause = buildPrismaWhere(filters);
  
  if (!query.trim()) {
    return prisma.document.count({ where: whereClause });
  }

  // For search queries, estimate count (exact count would be expensive)
  return prisma.document.count({
    where: {
      ...whereClause,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { extractedText: { contains: query, mode: 'insensitive' } },
        { aiSummary: { contains: query, mode: 'insensitive' } }
      ]
    }
  });
}

/**
 * Build WHERE clause for raw SQL queries
 */
function buildWhereClause(filters: SearchFilters): string {
  const conditions = [`d.organization_id = '${filters.organizationId}'`];
  
  if (filters.caseIds?.length) {
    conditions.push(`d.case_id IN (${filters.caseIds.map(id => `'${id}'`).join(', ')})`);
  }
  
  if (filters.categories?.length) {
    conditions.push(`d.category IN (${filters.categories.map(c => `'${c}'`).join(', ')})`);
  }
  
  if (filters.confidentialityLevels?.length) {
    conditions.push(`d.confidentiality_level IN (${filters.confidentialityLevels.map(l => `'${l}'`).join(', ')})`);
  }
  
  if (filters.uploadedBy) {
    conditions.push(`d.uploaded_by_id = '${filters.uploadedBy}'`);
  }
  
  if (filters.hasAISummary !== undefined) {
    conditions.push(`d.ai_summary IS ${filters.hasAISummary ? 'NOT NULL' : 'NULL'}`);
  }
  
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      conditions.push(`d.created_at >= '${filters.dateRange.start}'`);
    }
    if (filters.dateRange.end) {
      conditions.push(`d.created_at <= '${filters.dateRange.end}'`);
    }
  }
  
  return conditions.join(' AND ');
}

/**
 * Build Prisma WHERE clause
 */
function buildPrismaWhere(filters: SearchFilters) {
  const where: any = {
    organizationId: filters.organizationId
  };
  
  if (filters.caseIds?.length) {
    where.caseId = { in: filters.caseIds };
  }
  
  if (filters.categories?.length) {
    where.category = { in: filters.categories };
  }
  
  if (filters.confidentialityLevels?.length) {
    where.confidentialityLevel = { in: filters.confidentialityLevels };
  }
  
  if (filters.uploadedBy) {
    where.uploadedById = filters.uploadedBy;
  }
  
  if (filters.hasAISummary !== undefined) {
    where.aiSummary = filters.hasAISummary ? { not: null } : null;
  }
  
  if (filters.dateRange) {
    where.createdAt = {};
    if (filters.dateRange.start) {
      where.createdAt.gte = new Date(filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      where.createdAt.lte = new Date(filters.dateRange.end);
    }
  }
  
  return where;
}

/**
 * Format document result for API response
 */
function formatDocumentResult(doc: any) {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    fileName: doc.file_name || doc.fileName,
    originalName: doc.original_name || doc.originalName,
    fileSize: doc.file_size || doc.fileSize,
    mimeType: doc.mime_type || doc.mimeType,
    category: doc.category,
    type: doc.type,
    confidentialityLevel: doc.confidentiality_level || doc.confidentialityLevel,
    aiSummary: doc.ai_summary || doc.aiSummary,
    keyPoints: doc.key_points || doc.keyPoints,
    confidentialityFlags: doc.confidentiality_flags || doc.confidentialityFlags,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
    case: doc.case ? {
      id: doc.case.id,
      caseNumber: doc.case.caseNumber || doc.case_number,
      title: doc.case.title || doc.case_title
    } : null,
    uploadedBy: {
      id: doc.uploadedBy?.id || doc.uploaded_by_id,
      firstName: doc.uploadedBy?.firstName || doc.first_name,
      lastName: doc.uploadedBy?.lastName || doc.last_name
    }
  };
}