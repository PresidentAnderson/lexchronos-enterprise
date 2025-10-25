import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';
import { TrustAccountSchema } from '@/lib/validation/schemas';

// GET /api/trust/accounts - Get all trust accounts for organization
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const accounts = await prisma.trustAccount.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: includeInactive ? undefined : true,
      },
      include: {
        _count: {
          select: {
            transactions: true,
            balances: true,
            reconciliations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get current balances for each account
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const latestBalance = await prisma.trustBalance.findFirst({
          where: { trustAccountId: account.id },
          orderBy: { snapshotDate: 'desc' },
        });

        const pendingTransactions = await prisma.trustTransaction.count({
          where: {
            trustAccountId: account.id,
            status: { in: ['PENDING', 'AUTHORIZED'] },
          },
        });

        return {
          ...account,
          currentBalance: latestBalance?.totalBalance || 0,
          reconciledBalance: latestBalance?.reconciledBalance,
          pendingTransactions,
          lastReconciliation: latestBalance?.snapshotDate,
        };
      })
    );

    return NextResponse.json({ accounts: accountsWithBalances });
  } catch (error) {
    console.error('Error fetching trust accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust accounts' },
      { status: 500 }
    );
  }
});

// POST /api/trust/accounts - Create new trust account
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {

    const body = await request.json();
    const validatedData = TrustAccountSchema.parse(body);

    // Check if account number already exists
    const existingAccount = await prisma.trustAccount.findUnique({
      where: { accountNumber: validatedData.accountNumber },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account number already exists' },
        { status: 409 }
      );
    }

    const account = await prisma.trustAccount.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        primarySignatory: validatedData.primarySignatory || user.id,
        signatories: validatedData.signatories || [user.id],
      },
    });

    // Create initial balance entry
    await prisma.trustBalance.create({
      data: {
        trustAccountId: account.id,
        organizationId: user.organizationId,
        snapshotDate: new Date(),
        totalBalance: 0,
        clearedBalance: 0,
        clientBalances: {},
        calculatedBy: user.id,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Error creating trust account:', error);
    return NextResponse.json(
      { error: 'Failed to create trust account' },
      { status: 500 }
    );
  }
});