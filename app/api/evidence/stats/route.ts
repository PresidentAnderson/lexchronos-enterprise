/**
 * Evidence Statistics API
 * Provides aggregated statistics for evidence management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Build base where clause
    const baseWhere: any = { organizationId };

    // Apply filters
    const caseIds = searchParams.get('caseIds')?.split(',').filter(Boolean);
    if (caseIds?.length) {
      baseWhere.caseId = { in: caseIds };
    }

    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    if (categories?.length) {
      baseWhere.category = { in: categories };
    }

    const confidentialityLevels = searchParams.get('confidentialityLevels')?.split(',').filter(Boolean);
    if (confidentialityLevels?.length) {
      baseWhere.confidentialityLevel = { in: confidentialityLevels };
    }

    const uploadedBy = searchParams.get('uploadedBy');
    if (uploadedBy) {
      baseWhere.uploadedById = uploadedBy;
    }

    const hasAISummary = searchParams.get('hasAISummary');
    if (hasAISummary !== null) {
      if (hasAISummary === 'true') {
        baseWhere.aiSummary = { not: null };
      } else if (hasAISummary === 'false') {
        baseWhere.aiSummary = null;
      }
    }

    // Date range filter
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');
    if (dateStart || dateEnd) {
      baseWhere.createdAt = {};
      if (dateStart) {
        baseWhere.createdAt.gte = new Date(dateStart);
      }
      if (dateEnd) {
        baseWhere.createdAt.lte = new Date(dateEnd + 'T23:59:59.999Z');
      }
    }

    // Get total count
    const total = await prisma.document.count({
      where: baseWhere
    });

    // Get counts by category
    const categoryStats = await prisma.document.groupBy({
      by: ['category'],
      where: baseWhere,
      _count: {
        category: true
      }
    });

    // Get counts by file type
    const typeStats = await prisma.document.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: {
        type: true
      }
    });

    // Get counts by confidentiality level
    const confidentialityStats = await prisma.document.groupBy({
      by: ['confidentialityLevel'],
      where: baseWhere,
      _count: {
        confidentialityLevel: true
      }
    });

    // Count AI processed documents
    const aiProcessed = await prisma.document.count({
      where: {
        ...baseWhere,
        aiSummary: { not: null }
      }
    });

    // Get total file size
    const sizeResult = await prisma.document.aggregate({
      where: baseWhere,
      _sum: {
        fileSize: true
      }
    });

    // Count recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await prisma.document.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Transform results
    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      if (stat.category) {
        byCategory[stat.category] = stat._count.category;
      }
    });

    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      if (stat.type) {
        byType[stat.type] = stat._count.type;
      }
    });

    const byConfidentiality: Record<string, number> = {};
    confidentialityStats.forEach(stat => {
      if (stat.confidentialityLevel) {
        byConfidentiality[stat.confidentialityLevel] = stat._count.confidentialityLevel;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        byCategory,
        byType,
        byConfidentiality,
        aiProcessed,
        totalSize: sizeResult._sum.fileSize || 0,
        recentUploads
      }
    });

  } catch (error) {
    console.error('Error fetching evidence statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}