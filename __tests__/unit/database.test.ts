/**
 * Database Unit Tests
 * Tests database utilities, operations, and health checks
 */

import { 
  prisma,
  upsertOrganization,
  getOrganizationWithDetails,
  createBillingEntry,
  getBillingEntriesForOrganization,
  paginate,
  healthCheck
} from '@/lib/db';

describe('Database Unit Tests', () => {
  let testOrganizationId: string;
  let testUserId: string;
  let testCaseId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.billingEntry.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        email: 'test@example.com',
        type: 'LAW_FIRM'
      }
    });
    testOrganizationId = testOrg.id;

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        role: 'LAWYER',
        organizationId: testOrganizationId
      }
    });
    testUserId = testUser.id;

    // Create test case
    const testCase = await prisma.case.create({
      data: {
        caseNumber: 'TEST-001',
        title: 'Test Case',
        clientName: 'Test Client',
        type: 'CIVIL',
        organizationId: testOrganizationId,
        assigneeId: testUserId
      }
    });
    testCaseId = testCase.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.billingEntry.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
  });

  describe('Organization Operations', () => {
    it('should create new organization', async () => {
      const orgData = {
        name: 'New Law Firm',
        email: 'new@lawfirm.com',
        phone: '+1-555-123-4567',
        address: '123 Legal St',
        city: 'Legal City',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      };

      const organization = await upsertOrganization(orgData);

      expect(organization).toBeDefined();
      expect(organization.name).toBe(orgData.name);
      expect(organization.email).toBe(orgData.email);
      expect(organization.phone).toBe(orgData.phone);
      expect(organization.address).toBe(orgData.address);
      expect(organization.country).toBe('US');
    });

    it('should update existing organization', async () => {
      const initialData = {
        name: 'Initial Name',
        email: 'initial@example.com'
      };

      // Create initial organization
      const initial = await upsertOrganization(initialData);

      // Update the organization
      const updatedData = {
        id: initial.id,
        name: 'Updated Name',
        email: 'initial@example.com',
        phone: '+1-555-999-8888'
      };

      const updated = await upsertOrganization(updatedData);

      expect(updated.id).toBe(initial.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.phone).toBe('+1-555-999-8888');
    });

    it('should get organization with details', async () => {
      const orgWithDetails = await getOrganizationWithDetails(testOrganizationId);

      expect(orgWithDetails).toBeDefined();
      expect(orgWithDetails?.users).toBeDefined();
      expect(orgWithDetails?.cases).toBeDefined();
      expect(orgWithDetails?.documents).toBeDefined();
      expect(orgWithDetails?.users.length).toBe(1);
      expect(orgWithDetails?.cases.length).toBe(1);
    });

    it('should return null for non-existent organization', async () => {
      const nonExistent = await getOrganizationWithDetails('non-existent-id');
      expect(nonExistent).toBeNull();
    });
  });

  describe('Billing Entry Operations', () => {
    it('should create time billing entry', async () => {
      const billingData = {
        description: 'Legal research on contract law',
        type: 'TIME' as const,
        hours: 2.5,
        minutes: 30,
        hourlyRate: 350,
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
        organizationId: testOrganizationId,
        caseId: testCaseId,
        userId: testUserId,
        isBillable: true,
        task: 'RESEARCH' as const,
        category: 'Legal Research',
        notes: 'Researched applicable contract law precedents'
      };

      const billingEntry = await createBillingEntry(billingData);

      expect(billingEntry).toBeDefined();
      expect(billingEntry.description).toBe(billingData.description);
      expect(billingEntry.type).toBe('TIME');
      expect(billingEntry.hours).toBe(2.5);
      expect(billingEntry.hourlyRate).toBe(350);
      expect(billingEntry.isBillable).toBe(true);
      expect(billingEntry.case).toBeDefined();
      expect(billingEntry.user).toBeDefined();
    });

    it('should create expense billing entry', async () => {
      const billingData = {
        description: 'Court filing fee',
        type: 'EXPENSE' as const,
        amount: 150,
        currency: 'USD',
        date: new Date(),
        organizationId: testOrganizationId,
        caseId: testCaseId,
        userId: testUserId,
        isBillable: true,
        task: 'ADMINISTRATIVE' as const,
        category: 'Court Fees'
      };

      const billingEntry = await createBillingEntry(billingData);

      expect(billingEntry).toBeDefined();
      expect(billingEntry.description).toBe(billingData.description);
      expect(billingEntry.type).toBe('EXPENSE');
      expect(billingEntry.amount).toBe(150);
      expect(billingEntry.currency).toBe('USD');
    });

    it('should get billing entries for organization', async () => {
      // Create multiple billing entries
      const entries = [
        {
          description: 'Research task 1',
          type: 'TIME' as const,
          hours: 1,
          hourlyRate: 300,
          organizationId: testOrganizationId,
          caseId: testCaseId,
          userId: testUserId
        },
        {
          description: 'Research task 2',
          type: 'TIME' as const,
          hours: 2,
          hourlyRate: 300,
          organizationId: testOrganizationId,
          caseId: testCaseId,
          userId: testUserId
        }
      ];

      for (const entryData of entries) {
        await createBillingEntry(entryData);
      }

      const retrievedEntries = await getBillingEntriesForOrganization(testOrganizationId);

      expect(retrievedEntries).toHaveLength(2);
      expect(retrievedEntries[0].description).toContain('Research task');
      expect(retrievedEntries[0].case).toBeDefined();
      expect(retrievedEntries[0].user).toBeDefined();
      expect(retrievedEntries[0].organization).toBeDefined();
    });

    it('should filter billing entries by options', async () => {
      // Create billing entries with different properties
      const billableEntry = await createBillingEntry({
        description: 'Billable work',
        type: 'TIME' as const,
        hours: 1,
        hourlyRate: 300,
        organizationId: testOrganizationId,
        caseId: testCaseId,
        userId: testUserId,
        isBillable: true
      });

      const nonBillableEntry = await createBillingEntry({
        description: 'Non-billable work',
        type: 'TIME' as const,
        hours: 1,
        hourlyRate: 300,
        organizationId: testOrganizationId,
        caseId: testCaseId,
        userId: testUserId,
        isBillable: false
      });

      // Get only billable entries
      const billableEntries = await getBillingEntriesForOrganization(
        testOrganizationId,
        { isBillable: true }
      );

      expect(billableEntries).toHaveLength(1);
      expect(billableEntries[0].isBillable).toBe(true);

      // Get only non-billable entries
      const nonBillableEntries = await getBillingEntriesForOrganization(
        testOrganizationId,
        { isBillable: false }
      );

      expect(nonBillableEntries).toHaveLength(1);
      expect(nonBillableEntries[0].isBillable).toBe(false);
    });

    it('should limit and offset billing entries', async () => {
      // Create 5 billing entries
      for (let i = 1; i <= 5; i++) {
        await createBillingEntry({
          description: `Entry ${i}`,
          type: 'TIME' as const,
          hours: 1,
          hourlyRate: 300,
          organizationId: testOrganizationId,
          caseId: testCaseId,
          userId: testUserId
        });
      }

      // Get first 3 entries
      const firstBatch = await getBillingEntriesForOrganization(
        testOrganizationId,
        { limit: 3, offset: 0 }
      );

      expect(firstBatch).toHaveLength(3);

      // Get next 2 entries
      const secondBatch = await getBillingEntriesForOrganization(
        testOrganizationId,
        { limit: 3, offset: 3 }
      );

      expect(secondBatch).toHaveLength(2);
    });
  });

  describe('Pagination Utility', () => {
    beforeEach(async () => {
      // Create 15 test cases for pagination
      for (let i = 1; i <= 15; i++) {
        await prisma.case.create({
          data: {
            caseNumber: `TEST-${i.toString().padStart(3, '0')}`,
            title: `Test Case ${i}`,
            clientName: `Test Client ${i}`,
            type: 'CIVIL',
            organizationId: testOrganizationId,
            assigneeId: testUserId
          }
        });
      }
    });

    it('should paginate results correctly', async () => {
      const result = await paginate(
        prisma.case,
        {
          page: 1,
          limit: 5,
          where: { organizationId: testOrganizationId },
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      );

      expect(result.data).toHaveLength(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(15); // 15 created + 1 from beforeEach
      expect(result.pagination.totalPages).toBe(4); // Math.ceil(16/5)
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle second page correctly', async () => {
      const result = await paginate(
        prisma.case,
        {
          page: 2,
          limit: 5,
          where: { organizationId: testOrganizationId }
        }
      );

      expect(result.data).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle last page correctly', async () => {
      const result = await paginate(
        prisma.case,
        {
          page: 4,
          limit: 5,
          where: { organizationId: testOrganizationId }
        }
      );

      expect(result.data).toHaveLength(1); // Only 1 remaining record on last page
      expect(result.pagination.page).toBe(4);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should enforce maximum page limit', async () => {
      const result = await paginate(
        prisma.case,
        {
          page: 1,
          limit: 150, // Requesting more than max limit
          where: { organizationId: testOrganizationId }
        }
      );

      expect(result.pagination.limit).toBe(100); // Should be capped at 100
    });

    it('should handle invalid page numbers', async () => {
      const result = await paginate(
        prisma.case,
        {
          page: -1, // Invalid page
          limit: 5,
          where: { organizationId: testOrganizationId }
        }
      );

      expect(result.pagination.page).toBe(1); // Should default to 1
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when database is accessible', async () => {
      const health = await healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.database.connected).toBe(true);
      expect(typeof health.database.responseTime).toBe('number');
      expect(health.database.responseTime).toBeGreaterThan(0);
      expect(health.timestamp).toBeDefined();
    });

    it('should measure response time accurately', async () => {
      const startTime = Date.now();
      const health = await healthCheck();
      const endTime = Date.now();

      expect(health.database.responseTime).toBeLessThanOrEqual(endTime - startTime);
      expect(health.database.responseTime).toBeGreaterThan(0);
    });
  });

  describe('Database Connection', () => {
    it('should successfully connect to database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });

    it('should handle transactions correctly', async () => {
      await expect(prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: 'Transaction Test',
            email: 'transaction@test.com',
            type: 'LAW_FIRM'
          }
        });

        const user = await tx.user.create({
          data: {
            email: 'transactionuser@test.com',
            firstName: 'Transaction',
            lastName: 'User',
            fullName: 'Transaction User',
            role: 'LAWYER',
            organizationId: org.id
          }
        });

        return { org, user };
      })).resolves.toBeDefined();
    });

    it('should rollback transactions on error', async () => {
      await expect(prisma.$transaction(async (tx) => {
        await tx.organization.create({
          data: {
            name: 'Rollback Test',
            email: 'rollback@test.com',
            type: 'LAW_FIRM'
          }
        });

        // This should cause a rollback
        throw new Error('Intentional error for rollback test');
      })).rejects.toThrow('Intentional error for rollback test');

      // Verify that the organization was not created
      const org = await prisma.organization.findUnique({
        where: { email: 'rollback@test.com' }
      });
      expect(org).toBeNull();
    });
  });
});