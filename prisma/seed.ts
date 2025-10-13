import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default organization (law firm)
  const organization = await prisma.organization.upsert({
    where: { email: 'admin@lexchronos.com' },
    update: {},
    create: {
      name: 'LexChronos Demo Law Firm',
      type: 'LAW_FIRM',
      email: 'admin@lexchronos.com',
      phone: '+1-555-123-4567',
      address: '123 Legal Street',
      city: 'Legal City',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      subscriptionTier: 'PROFESSIONAL',
      billingEmail: 'billing@lexchronos.com',
      isActive: true,
      settings: {
        timeZone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        language: 'en'
      }
    }
  });

  console.log('✅ Created organization:', organization.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('LexChronos2025!', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lexchronos.com' },
    update: {},
    create: {
      email: 'admin@lexchronos.com',
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
      phone: '+1-555-123-4567',
      title: 'System Administrator',
      isActive: true,
      timezone: 'America/New_York',
      organizationId: organization.id
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample lawyer user
  const lawyerUser = await prisma.user.upsert({
    where: { email: 'lawyer@lexchronos.com' },
    update: {},
    create: {
      email: 'lawyer@lexchronos.com',
      firstName: 'John',
      lastName: 'Attorney',
      fullName: 'John Attorney',
      role: 'LAWYER',
      password: hashedPassword,
      phone: '+1-555-123-4568',
      title: 'Senior Partner',
      barNumber: 'NY12345',
      biography: 'Experienced attorney specializing in corporate law.',
      isActive: true,
      timezone: 'America/New_York',
      organizationId: organization.id
    }
  });

  console.log('✅ Created lawyer user:', lawyerUser.email);

  // Create sample paralegal user
  const paralegalUser = await prisma.user.upsert({
    where: { email: 'paralegal@lexchronos.com' },
    update: {},
    create: {
      email: 'paralegal@lexchronos.com',
      firstName: 'Sarah',
      lastName: 'Paralegal',
      fullName: 'Sarah Paralegal',
      role: 'PARALEGAL',
      password: hashedPassword,
      phone: '+1-555-123-4569',
      title: 'Senior Paralegal',
      isActive: true,
      timezone: 'America/New_York',
      organizationId: organization.id
    }
  });

  console.log('✅ Created paralegal user:', paralegalUser.email);

  // Create sample cases
  const sampleCase1 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2025-001',
      title: 'Corporate Merger Agreement',
      description: 'Legal review and documentation for corporate merger between TechCorp and InnovateInc.',
      type: 'CORPORATE',
      status: 'ACTIVE',
      priority: 'HIGH',
      clientName: 'TechCorp Industries',
      clientEmail: 'legal@techcorp.com',
      clientPhone: '+1-555-987-6543',
      court: 'Delaware Court of Chancery',
      filingDate: new Date('2025-01-15'),
      startDate: new Date('2025-01-10'),
      estimatedValue: 50000000,
      hourlyRate: 450,
      organizationId: organization.id,
      assigneeId: lawyerUser.id,
      tags: ['merger', 'corporate', 'high-value']
    }
  });

  const sampleCase2 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2025-002',
      title: 'Employment Discrimination Case',
      description: 'Representing client in employment discrimination lawsuit.',
      type: 'EMPLOYMENT',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      clientName: 'Jane Smith',
      clientEmail: 'jane.smith@email.com',
      clientPhone: '+1-555-456-7890',
      court: 'U.S. District Court for the Southern District of New York',
      filingDate: new Date('2025-01-20'),
      startDate: new Date('2025-01-18'),
      contingencyFee: 0.33,
      organizationId: organization.id,
      assigneeId: lawyerUser.id,
      tags: ['employment', 'discrimination', 'litigation']
    }
  });

  console.log('✅ Created sample cases');

  // Create sample deadlines
  await prisma.deadline.create({
    data: {
      title: 'File Motion to Dismiss',
      description: 'File motion to dismiss with supporting brief',
      dueDate: new Date('2025-02-15'),
      type: 'FILING',
      priority: 'HIGH',
      status: 'PENDING',
      reminderDays: [7, 3, 1],
      caseId: sampleCase1.id,
      assignedTo: lawyerUser.id
    }
  });

  await prisma.deadline.create({
    data: {
      title: 'Discovery Response Due',
      description: 'Respond to plaintiff discovery requests',
      dueDate: new Date('2025-02-28'),
      type: 'DISCOVERY',
      priority: 'MEDIUM',
      status: 'PENDING',
      reminderDays: [14, 7, 3],
      caseId: sampleCase2.id,
      assignedTo: paralegalUser.id
    }
  });

  console.log('✅ Created sample deadlines');

  // Create sample timeline events
  await prisma.timeline.create({
    data: {
      title: 'Initial Client Meeting',
      description: 'Met with client to discuss case details and strategy',
      eventType: 'MEETING',
      eventDate: new Date('2025-01-10'),
      location: 'Law Firm Conference Room',
      importance: 'HIGH',
      isVerified: true,
      organizationId: organization.id,
      caseId: sampleCase1.id,
      createdById: lawyerUser.id,
      participants: [
        { name: 'John Attorney', role: 'Attorney' },
        { name: 'TechCorp Legal Team', role: 'Client' }
      ]
    }
  });

  await prisma.timeline.create({
    data: {
      title: 'Complaint Filed',
      description: 'Filed complaint with the court',
      eventType: 'FILING',
      eventDate: new Date('2025-01-20'),
      location: 'U.S. District Court SDNY',
      importance: 'HIGH',
      isVerified: true,
      organizationId: organization.id,
      caseId: sampleCase2.id,
      createdById: lawyerUser.id
    }
  });

  console.log('✅ Created sample timeline events');

  // Create sample billing entries
  await prisma.billingEntry.create({
    data: {
      description: 'Legal research on merger regulations',
      type: 'TIME',
      hours: 3.5,
      hourlyRate: 450,
      date: new Date('2025-01-11'),
      startTime: new Date('2025-01-11T09:00:00Z'),
      endTime: new Date('2025-01-11T12:30:00Z'),
      organizationId: organization.id,
      caseId: sampleCase1.id,
      userId: lawyerUser.id,
      isBillable: true,
      task: 'RESEARCH',
      category: 'Legal Research',
      tags: ['merger', 'regulations']
    }
  });

  await prisma.billingEntry.create({
    data: {
      description: 'Document review and preparation',
      type: 'TIME',
      hours: 2.0,
      hourlyRate: 200,
      date: new Date('2025-01-19'),
      startTime: new Date('2025-01-19T14:00:00Z'),
      endTime: new Date('2025-01-19T16:00:00Z'),
      organizationId: organization.id,
      caseId: sampleCase2.id,
      userId: paralegalUser.id,
      isBillable: true,
      task: 'REVIEW',
      category: 'Document Preparation'
    }
  });

  console.log('✅ Created sample billing entries');

  // Create sample court dates
  await prisma.courtDate.create({
    data: {
      title: 'Motion Hearing',
      description: 'Hearing on motion to dismiss',
      courtName: 'Delaware Court of Chancery',
      courtroom: 'Courtroom 3',
      address: '34 The Circle, Georgetown, DE 19947',
      scheduledDate: new Date('2025-03-01'),
      scheduledTime: '10:00 AM',
      estimatedDuration: 60,
      type: 'MOTION',
      judge: 'Judge William Smith',
      caseId: sampleCase1.id,
      organizationId: organization.id,
      status: 'SCHEDULED',
      reminderSet: true,
      reminderDays: [7, 3, 1],
      attendees: [
        { name: 'John Attorney', role: 'Attorney' },
        { name: 'Opposing Counsel', role: 'Opposing Attorney' }
      ]
    }
  });

  console.log('✅ Created sample court dates');

  // Create sample notifications
  await prisma.notification.create({
    data: {
      type: 'DEADLINE_REMINDER',
      title: 'Deadline Approaching',
      message: 'Motion to dismiss is due in 7 days',
      userId: lawyerUser.id,
      priority: 'HIGH',
      relatedType: 'deadline',
      actionUrl: '/deadlines'
    }
  });

  console.log('✅ Created sample notifications');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Demo Accounts Created:');
  console.log('👤 Admin: admin@lexchronos.com / LexChronos2025!');
  console.log('⚖️  Lawyer: lawyer@lexchronos.com / LexChronos2025!');
  console.log('📄 Paralegal: paralegal@lexchronos.com / LexChronos2025!');
  console.log('');
  console.log('🏢 Organization: LexChronos Demo Law Firm');
  console.log('📊 Sample data: 2 cases, deadlines, timeline events, billing entries');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });