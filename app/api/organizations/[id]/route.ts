import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/organizations/[id] - Get organization by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            title: true,
            isActive: true
          },
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        cases: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            users: true,
            cases: true,
            documents: true,
            timelines: true,
            billingEntries: true,
            courtDates: true,
            evidence: true,
            notes: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id }
    });

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const {
      name,
      type,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      country,
      taxId,
      barAssociation,
      license,
      subscriptionTier,
      billingEmail,
      settings,
      isActive
    } = body;

    // Check if email is being changed and if it already exists
    if (email && email !== existingOrg.email) {
      const emailExists = await prisma.organization.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (country !== undefined) updateData.country = country;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (barAssociation !== undefined) updateData.barAssociation = barAssociation;
    if (license !== undefined) updateData.license = license;
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
    if (billingEmail !== undefined) updateData.billingEmail = billingEmail;
    if (settings !== undefined) updateData.settings = settings;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
            documents: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedOrganization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id }
    });

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.organization.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Organization deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}