import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/cases/[id] - Get case by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            title: true
          }
        },
        documents: {
          select: {
            id: true,
            title: true,
            fileName: true,
            category: true,
            type: true,
            createdAt: true,
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        timelines: {
          select: {
            id: true,
            title: true,
            eventType: true,
            eventDate: true,
            importance: true
          },
          orderBy: { eventDate: 'desc' },
          take: 5
        },
        deadlines: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            type: true,
            priority: true,
            status: true
          },
          orderBy: { dueDate: 'asc' },
          take: 5
        },
        courtDates: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            type: true,
            status: true,
            courtName: true
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5
        },
        evidence: {
          select: {
            id: true,
            title: true,
            type: true,
            relevance: true,
            isAuthenticated: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            documents: true,
            timelines: true,
            deadlines: true,
            billingEntries: true,
            courtDates: true,
            evidence: true,
            notes: true
          }
        }
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: caseData
    });

  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/cases/[id] - Update case
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const {
      caseNumber,
      title,
      description,
      type,
      status,
      priority,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      court,
      judge,
      opposingParty,
      opposingCounsel,
      filingDate,
      startDate,
      closeDate,
      statuteOfLimitations,
      estimatedValue,
      contingencyFee,
      hourlyRate,
      assigneeId,
      tags,
      customFields
    } = body;

    // Check if case number is being changed and if it already exists
    if (caseNumber && caseNumber !== existingCase.caseNumber) {
      const caseNumberExists = await prisma.case.findUnique({
        where: { caseNumber }
      });

      if (caseNumberExists) {
        return NextResponse.json(
          { success: false, error: 'Case number already exists' },
          { status: 409 }
        );
      }
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Assignee not found' },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (caseNumber !== undefined) updateData.caseNumber = caseNumber;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (clientAddress !== undefined) updateData.clientAddress = clientAddress;
    if (court !== undefined) updateData.court = court;
    if (judge !== undefined) updateData.judge = judge;
    if (opposingParty !== undefined) updateData.opposingParty = opposingParty;
    if (opposingCounsel !== undefined) updateData.opposingCounsel = opposingCounsel;
    if (filingDate !== undefined) updateData.filingDate = filingDate ? new Date(filingDate) : null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (closeDate !== undefined) updateData.closeDate = closeDate ? new Date(closeDate) : null;
    if (statuteOfLimitations !== undefined) updateData.statuteOfLimitations = statuteOfLimitations ? new Date(statuteOfLimitations) : null;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (contingencyFee !== undefined) updateData.contingencyFee = contingencyFee;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (tags !== undefined) updateData.tags = tags;
    if (customFields !== undefined) updateData.customFields = customFields;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCase
    });

  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete case
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Delete the case (this will cascade delete related records due to schema constraints)
    await prisma.case.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Case deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
