import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth/jwt';
import { TrustTransactionSchema } from '@/lib/validation/schemas';

const prisma = new PrismaClient();

// GET /api/trust/transactions - Get trust transactions
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      organizationId: user.organizationId,
    };

    if (accountId) where.trustAccountId = accountId;
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.trustTransaction.findMany({
        where,
        include: {
          trustAccount: {
            select: {
              accountName: true,
              accountNumber: true,
            },
          },
          case: {
            select: {
              caseNumber: true,
              title: true,
              clientName: true,
            },
          },
          ledgerEntries: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.trustTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching trust transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust transactions' },
      { status: 500 }
    );
  }
}

// POST /api/trust/transactions - Create new trust transaction
export async function POST(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = TrustTransactionSchema.parse(body);

    // Get the trust account to verify access
    const trustAccount = await prisma.trustAccount.findFirst({
      where: {
        id: validatedData.trustAccountId,
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (!trustAccount) {
      return NextResponse.json(
        { error: 'Trust account not found or inactive' },
        { status: 404 }
      );
    }

    // Generate transaction number
    const lastTransaction = await prisma.trustTransaction.findFirst({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const transactionNumber = generateTransactionNumber(lastTransaction?.transactionNumber);

    // Create the transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const newTransaction = await tx.trustTransaction.create({
        data: {
          ...validatedData,
          transactionNumber,
          organizationId: user.organizationId,
          authorizedBy: user.id,
          auditTrail: [
            {
              action: 'CREATED',
              userId: user.id,
              timestamp: new Date(),
              details: 'Transaction created',
            },
          ],
        },
        include: {
          trustAccount: {
            select: {
              accountName: true,
              accountNumber: true,
            },
          },
          case: {
            select: {
              caseNumber: true,
              title: true,
              clientName: true,
            },
          },
        },
      });

      // Create corresponding ledger entries
      await createLedgerEntries(tx, newTransaction, user.id);

      // Update trust account balance if transaction is cleared
      if (validatedData.status === 'CLEARED') {
        await updateAccountBalance(tx, trustAccount.id, user.organizationId);
      }

      return newTransaction;
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating trust transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create trust transaction' },
      { status: 500 }
    );
  }
}

// Helper function to generate sequential transaction numbers
function generateTransactionNumber(lastNumber?: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const prefix = `TR-${year}-`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSequence = parseInt(lastNumber.split('-')[2]);
  const nextSequence = (lastSequence + 1).toString().padStart(4, '0');
  return `${prefix}${nextSequence}`;
}

// Helper function to create ledger entries
async function createLedgerEntries(
  tx: any,
  transaction: any,
  userId: string
) {
  const entryType = transaction.type === 'DEPOSIT' ? 'DEPOSIT' : 
                   transaction.type === 'WITHDRAWAL' ? 'WITHDRAWAL' :
                   transaction.type === 'TRANSFER' ? 
                     (transaction.amount > 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT') :
                   transaction.type;

  // Get last entry number
  const lastEntry = await tx.trustLedgerEntry.findFirst({
    where: { organizationId: transaction.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const entryNumber = generateEntryNumber(lastEntry?.entryNumber);

  // Get current balance for the account
  const currentBalance = await getCurrentAccountBalance(tx, transaction.trustAccountId);
  const newBalance = currentBalance + transaction.amount;

  // Get client name from case or use provided clientId
  const clientName = transaction.case?.clientName || 'Unknown Client';

  await tx.trustLedgerEntry.create({
    data: {
      entryNumber,
      entryType,
      amount: transaction.amount,
      runningBalance: newBalance,
      trustAccountId: transaction.trustAccountId,
      transactionId: transaction.id,
      caseId: transaction.caseId,
      clientName,
      clientBalance: newBalance, // This would need more complex calculation for multiple clients
      description: transaction.description,
      entryDate: transaction.transactionDate,
      effectiveDate: transaction.effectiveDate,
      organizationId: transaction.organizationId,
      createdBy: userId,
    },
  });
}

// Helper function to generate entry numbers
function generateEntryNumber(lastNumber?: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const prefix = `LE-${year}-`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSequence = parseInt(lastNumber.split('-')[2]);
  const nextSequence = (lastSequence + 1).toString().padStart(4, '0');
  return `${prefix}${nextSequence}`;
}

// Helper function to get current account balance
async function getCurrentAccountBalance(tx: any, accountId: string): Promise<number> {
  const lastBalance = await tx.trustBalance.findFirst({
    where: { trustAccountId: accountId },
    orderBy: { snapshotDate: 'desc' },
  });

  return lastBalance?.totalBalance || 0;
}

// Helper function to update account balance
async function updateAccountBalance(
  tx: any,
  accountId: string,
  organizationId: string
) {
  // Calculate new balance from all cleared transactions
  const transactions = await tx.trustTransaction.findMany({
    where: {
      trustAccountId: accountId,
      status: 'CLEARED',
    },
  });

  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Create or update balance snapshot
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await tx.trustBalance.upsert({
    where: {
      trustAccountId_snapshotDate: {
        trustAccountId: accountId,
        snapshotDate: today,
      },
    },
    update: {
      totalBalance,
      clearedBalance: totalBalance,
    },
    create: {
      trustAccountId: accountId,
      organizationId,
      snapshotDate: today,
      totalBalance,
      clearedBalance: totalBalance,
      clientBalances: {}, // Would need complex calculation
      calculatedBy: 'system',
    },
  });
}