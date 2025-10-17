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

  // Seed priority offence modules and related resources
  const priorityOffenceModules = [
    {
      sectionCode: 'G1',
      title: 'Aggravated Homicide',
      subtitle: 'Intentional killing with qualifying aggravators',
      description:
        'Covers premeditated killings with aggravating circumstances including torture, multiple victims, or killing of protected persons.',
      category: 'VIOLENT',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G1.01',
      tags: ['homicide', 'violent-crime', 'capital'],
      elements: [
        {
          label: 'Unlawful Killing',
          description: 'Defendant caused the death of another human being.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 5,
          statuteReference: 'Lex.G1.01(a)',
          baselineScore: 0.85
        },
        {
          label: 'Malice Aforethought',
          description: 'Killing was intentional, knowing, or with extreme recklessness.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 5,
          statuteReference: 'Lex.G1.01(b)',
          baselineScore: 0.8
        },
        {
          label: 'Aggravating Factor',
          description: 'At least one statutory aggravator is proven beyond a reasonable doubt.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G1.01(c)',
          baselineScore: 0.75
        }
      ],
      witnesses: [
        {
          name: 'Detective Maria Alvarez',
          role: 'Lead Investigator',
          witnessType: 'LAW_ENFORCEMENT',
          contact: { email: 'malvarez@lexpd.gov', phone: '+1-555-870-1122' },
          notes: 'Primary case agent responsible for evidence collection.'
        },
        {
          name: 'Dr. Samuel Rhee',
          role: 'Chief Medical Examiner',
          witnessType: 'EXPERT',
          contact: { email: 'srhee@medexaminer.org' },
          notes: 'Performs autopsy and cause-of-death analysis.'
        }
      ],
      exhibits: [
        {
          label: 'Crime Scene Composite',
          description: 'Annotated composite diagram of the homicide scene.',
          exhibitType: 'diagram',
          storagePath: 's3://lexchronos-demo/offences/g1/composite.pdf',
          authenticityStatus: 'VERIFIED',
          chainOfCustody: { createdBy: 'Detective Alvarez', securedAt: '2025-01-05T02:15:00Z' }
        },
        {
          label: 'Forensic Report',
          description: 'Full autopsy and toxicology report.',
          exhibitType: 'report',
          storagePath: 's3://lexchronos-demo/offences/g1/autopsy.pdf',
          authenticityStatus: 'VERIFIED',
          chainOfCustody: { deliveredBy: 'Medical Examiner', receivedBy: 'Evidence Clerk' }
        }
      ],
      automationHooks: [
        {
          trigger: 'ELEMENT_STATUS_CHANGED',
          action: 'UPDATE_HEATMAP',
          payload: { escalateWhen: 'AT_RISK', module: 'G1' }
        },
        {
          trigger: 'EVIDENCE_ADDED',
          action: 'GENERATE_REPORT',
          payload: { template: 'homicide-evidence-digest' }
        }
      ]
    },
    {
      sectionCode: 'G2',
      title: 'Felony Murder',
      subtitle: 'Homicide committed during enumerated felonies',
      description:
        'Establishes liability for deaths occurring during inherently dangerous felonies regardless of intent to kill.',
      category: 'VIOLENT',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G2.04',
      tags: ['felony-murder', 'violent-crime'],
      elements: [
        {
          label: 'Commission of Predicate Felony',
          description: 'Defendant committed or attempted an enumerated felony.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G2.04(a)',
          baselineScore: 0.78
        },
        {
          label: 'Death Occurred',
          description: 'A death occurred during the commission or flight from the felony.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G2.04(b)',
          baselineScore: 0.7
        },
        {
          label: 'Causation Nexus',
          description: 'The death was a foreseeable consequence of the felony.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G2.04(c)',
          baselineScore: 0.65
        }
      ],
      witnesses: [
        {
          name: 'Officer Daniel Cho',
          role: 'First Responding Officer',
          witnessType: 'LAW_ENFORCEMENT'
        }
      ],
      exhibits: [
        {
          label: 'Predicate Felony Charging Docs',
          description: 'Charging instruments for the underlying felony.',
          exhibitType: 'legal',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'HEATMAP_THRESHOLD',
          action: 'SEND_ALERT',
          payload: { threshold: 0.6, channel: 'slack:#major-crimes' }
        }
      ]
    },
    {
      sectionCode: 'G3',
      title: 'Vehicular Homicide',
      subtitle: 'Fatalities resulting from negligent or intoxicated driving',
      description:
        'Addresses deaths caused by reckless, negligent, or intoxicated operation of a vehicle.',
      category: 'VIOLENT',
      severity: 'SERIOUS',
      statuteReference: 'Lex.G3.12',
      tags: ['traffic', 'dui', 'fatality'],
      elements: [
        {
          label: 'Operation of Vehicle',
          description: 'Defendant operated or controlled a motor vehicle.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G3.12(a)',
          baselineScore: 0.7
        },
        {
          label: 'Criminal Negligence or Intoxication',
          description: 'Driving conduct met statutory threshold for negligence or intoxication.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G3.12(b)',
          baselineScore: 0.68
        },
        {
          label: 'Causation of Death',
          description: 'Conduct directly caused another’s death.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G3.12(c)',
          baselineScore: 0.65
        }
      ],
      witnesses: [
        {
          name: 'Officer Priya Desai',
          role: 'Accident Reconstruction Specialist',
          witnessType: 'EXPERT'
        }
      ],
      exhibits: [
        {
          label: 'Event Data Recorder Export',
          description: 'Download from vehicle black box showing speed and braking.',
          exhibitType: 'digital',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'WITNESS_LINKED',
          action: 'CREATE_TASK',
          payload: { taskTemplate: 'schedule-expert-prep' }
        }
      ]
    },
    {
      sectionCode: 'G4',
      title: 'Domestic Violence Assault',
      subtitle: 'Felony-level assault in intimate partner contexts',
      description:
        'Captures high-risk domestic assaults requiring expedited intervention and victim safety planning.',
      category: 'VIOLENT',
      severity: 'SERIOUS',
      statuteReference: 'Lex.G4.21',
      tags: ['domestic-violence', 'protective-order'],
      elements: [
        {
          label: 'Domestic Relationship',
          description: 'Victim qualifies under statutory domestic relationship definitions.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G4.21(a)',
          baselineScore: 0.72
        },
        {
          label: 'Assaultive Conduct',
          description: 'Defendant intentionally caused bodily injury or fear of imminent injury.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G4.21(b)',
          baselineScore: 0.7
        },
        {
          label: 'Enhancement Factor',
          description: 'Aggravators such as strangulation, weapons, or prior orders present.',
          elementType: 'CIRCUMSTANCE',
          essential: false,
          weight: 2,
          statuteReference: 'Lex.G4.21(c)',
          baselineScore: 0.6
        }
      ],
      witnesses: [
        {
          name: 'Nurse Carla Jennings',
          role: 'Forensic Nurse Examiner',
          witnessType: 'EXPERT'
        }
      ],
      exhibits: [
        {
          label: 'Emergency Room Photos',
          description: 'Photographs documenting injuries and bruising patterns.',
          exhibitType: 'photo',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'BREACH_DETECTED',
          action: 'SEND_ALERT',
          payload: { alert: 'protective-order-breach', notify: ['advocacy-team'] }
        }
      ]
    },
    {
      sectionCode: 'G5',
      title: 'Child Abuse – Serious Physical Injury',
      subtitle: 'Intentional or reckless infliction of serious bodily injury on a child',
      description:
        'Prioritizes rapid intervention for cases involving child victims with life-altering or fatal injuries.',
      category: 'VIOLENT',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G5.02',
      tags: ['child-protection', 'mandatory-reporting'],
      elements: [
        {
          label: 'Victim is a Minor',
          description: 'Victim was under statutory age at time of offence.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G5.02(a)',
          baselineScore: 0.8
        },
        {
          label: 'Serious Bodily Injury',
          description: 'Victim suffered serious or life-threatening injuries.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G5.02(b)',
          baselineScore: 0.76
        },
        {
          label: 'Intentional or Reckless Conduct',
          description: 'Defendant intentionally or recklessly caused injury.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G5.02(c)',
          baselineScore: 0.74
        }
      ],
      witnesses: [
        {
          name: 'Dr. Aisha Robinson',
          role: 'Pediatric Trauma Surgeon',
          witnessType: 'EXPERT'
        }
      ],
      exhibits: [
        {
          label: 'Child Protective Services File',
          description: 'Compiled investigative history and safety assessments.',
          exhibitType: 'report',
          authenticityStatus: 'PENDING'
        }
      ],
      automationHooks: [
        {
          trigger: 'ELEMENT_STATUS_CHANGED',
          action: 'DISPATCH_WEBHOOK',
          payload: { endpoint: 'https://hooks.lexchronos.local/child-protection' }
        }
      ]
    },
    {
      sectionCode: 'G6',
      title: 'Human Trafficking',
      subtitle: 'Commercial exploitation through force, fraud, or coercion',
      description:
        'High-priority trafficking cases requiring multidisciplinary coordination and victim services.',
      category: 'REGULATORY',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G6.30',
      tags: ['trafficking', 'victim-services', 'multi-jurisdictional'],
      elements: [
        {
          label: 'Recruitment or Harboring',
          description: 'Defendant recruited, transported, or harbored persons.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G6.30(a)',
          baselineScore: 0.7
        },
        {
          label: 'Means Employed',
          description: 'Force, fraud, or coercion used, or victim is a minor.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G6.30(b)',
          baselineScore: 0.68
        },
        {
          label: 'Purpose of Exploitation',
          description: 'Activities were for commercial sex acts or labor exploitation.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G6.30(c)',
          baselineScore: 0.66
        }
      ],
      witnesses: [
        {
          name: 'Special Agent Victor Chang',
          role: 'Task Force Lead',
          witnessType: 'LAW_ENFORCEMENT'
        }
      ],
      exhibits: [
        {
          label: 'Financial Flow Analysis',
          description: 'Follow-the-money analysis linking shell companies to trafficking proceeds.',
          exhibitType: 'financial',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'EVIDENCE_ADDED',
          action: 'CREATE_TASK',
          payload: { taskTemplate: 'notify-victim-advocate' }
        }
      ]
    },
    {
      sectionCode: 'G7',
      title: 'Kidnapping with Ransom Demand',
      subtitle: 'Abduction cases involving ransom or hostage leverage',
      description:
        'Focuses on rapid response to ransom kidnappings, integrating negotiation and tactical workflows.',
      category: 'VIOLENT',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G7.17',
      tags: ['kidnapping', 'hostage'],
      elements: [
        {
          label: 'Unlawful Seizure',
          description: 'Victim was unlawfully seized, confined, or carried away.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G7.17(a)',
          baselineScore: 0.7
        },
        {
          label: 'Lack of Consent',
          description: 'Victim did not consent to confinement or movement.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G7.17(b)',
          baselineScore: 0.68
        },
        {
          label: 'Ransom or Hostage Intent',
          description: 'Demanded ransom or used victim as shield/hostage.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G7.17(c)',
          baselineScore: 0.7
        }
      ],
      witnesses: [
        {
          name: 'Negotiator Elise Murphy',
          role: 'Lead Crisis Negotiator',
          witnessType: 'LAW_ENFORCEMENT'
        }
      ],
      exhibits: [
        {
          label: 'Ransom Communication Packet',
          description: 'Aggregated ransom messages and call transcripts.',
          exhibitType: 'digital',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'HEATMAP_THRESHOLD',
          action: 'DISPATCH_WEBHOOK',
          payload: { endpoint: 'https://hooks.lexchronos.local/notify-command', severity: 'critical' }
        }
      ]
    },
    {
      sectionCode: 'G8',
      title: 'Armed Robbery with Serious Bodily Injury',
      subtitle: 'Robberies causing substantial injury with deadly weapons',
      description:
        'Prioritizes high-harm robbery cases where victims sustain serious injuries or lasting trauma.',
      category: 'VIOLENT',
      severity: 'SERIOUS',
      statuteReference: 'Lex.G8.09',
      tags: ['robbery', 'weapons'],
      elements: [
        {
          label: 'Taking of Property',
          description: 'Property was taken from another person or presence.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G8.09(a)',
          baselineScore: 0.68
        },
        {
          label: 'Use of Deadly Weapon',
          description: 'Deadly weapon was used, displayed, or threatened.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G8.09(b)',
          baselineScore: 0.7
        },
        {
          label: 'Serious Bodily Injury',
          description: 'Victim sustained serious bodily injury during offence.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G8.09(c)',
          baselineScore: 0.65
        }
      ],
      witnesses: [
        {
          name: 'Officer Lauren Hicks',
          role: 'Ballistics Expert',
          witnessType: 'EXPERT'
        }
      ],
      exhibits: [
        {
          label: 'Surveillance Compilation',
          description: 'Video extracts from multiple cameras synchronized by timestamp.',
          exhibitType: 'video',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'ELEMENT_STATUS_CHANGED',
          action: 'CREATE_TASK',
          payload: { taskTemplate: 'victim-impact-statement' }
        }
      ]
    },
    {
      sectionCode: 'G9',
      title: 'Securities and Investment Fraud',
      subtitle: 'Material misstatements causing investor loss',
      description:
        'Covers complex financial fraud with systemic investor impact and regulatory exposure.',
      category: 'FRAUD',
      severity: 'SERIOUS',
      statuteReference: 'Lex.G9.14',
      tags: ['financial-crime', 'investor-protection'],
      elements: [
        {
          label: 'Material Misrepresentation',
          description: 'Made materially false or misleading statements or omissions.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G9.14(a)',
          baselineScore: 0.62
        },
        {
          label: 'Scienter',
          description: 'Acted knowingly or with reckless disregard for truth.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G9.14(b)',
          baselineScore: 0.6
        },
        {
          label: 'Investor Reliance and Loss',
          description: 'Investors relied on statements and suffered losses.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G9.14(c)',
          baselineScore: 0.58
        }
      ],
      witnesses: [
        {
          name: 'Analyst Martin Osei',
          role: 'Forensic Accountant',
          witnessType: 'EXPERT'
        }
      ],
      exhibits: [
        {
          label: 'Investor Loss Schedule',
          description: 'Spreadsheet quantifying losses per investor class.',
          exhibitType: 'financial',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'HEATMAP_THRESHOLD',
          action: 'GENERATE_REPORT',
          payload: { template: 'securities-case-brief', audience: 'executive' }
        }
      ]
    },
    {
      sectionCode: 'G10',
      title: 'Public Corruption – Bribery',
      subtitle: 'Quid pro quo corruption of public officials',
      description:
        'Targets corruption schemes involving public officials trading official acts for value.',
      category: 'REGULATORY',
      severity: 'SERIOUS',
      statuteReference: 'Lex.G10.08',
      tags: ['public-integrity', 'ethics'],
      elements: [
        {
          label: 'Public Official',
          description: 'Defendant was a public official or aided such official.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G10.08(a)',
          baselineScore: 0.6
        },
        {
          label: 'Thing of Value',
          description: 'Something of value was solicited, received, or offered.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G10.08(b)',
          baselineScore: 0.58
        },
        {
          label: 'Quid Pro Quo Intent',
          description: 'Exchange for official act was intended or agreed.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G10.08(c)',
          baselineScore: 0.56
        }
      ],
      witnesses: [
        {
          name: 'Inspector Helena Ruiz',
          role: 'Internal Affairs Lead',
          witnessType: 'LAW_ENFORCEMENT'
        }
      ],
      exhibits: [
        {
          label: 'Cooperating Witness Transcript',
          description: 'Recorded conversation detailing corrupt agreement.',
          exhibitType: 'audio',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'ELEMENT_STATUS_CHANGED',
          action: 'SEND_ALERT',
          payload: { notify: ['integrity-taskforce'], status: 'READY' }
        }
      ]
    },
    {
      sectionCode: 'G11',
      title: 'Cyber Intrusion – Critical Infrastructure',
      subtitle: 'Unauthorized access causing critical infrastructure disruption',
      description:
        'Handles cyber incidents with potential or actual disruption to essential services.',
      category: 'CYBER',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G11.18',
      tags: ['cybercrime', 'critical-infrastructure'],
      elements: [
        {
          label: 'Unauthorized Access',
          description: 'Accessed protected computer or network without authorization.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G11.18(a)',
          baselineScore: 0.66
        },
        {
          label: 'Critical Infrastructure System',
          description: 'Target system qualifies as critical infrastructure.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G11.18(b)',
          baselineScore: 0.64
        },
        {
          label: 'Disruption or Risk',
          description: 'Caused or risked substantial disruption or damage.',
          elementType: 'RESULT',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G11.18(c)',
          baselineScore: 0.62
        }
      ],
      witnesses: [
        {
          name: 'Engineer Lila Petrov',
          role: 'SCADA Systems Expert',
          witnessType: 'TECHNICAL'
        }
      ],
      exhibits: [
        {
          label: 'Network Forensic Capture',
          description: 'PCAP files showing intrusion path and payloads.',
          exhibitType: 'digital',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'BREACH_DETECTED',
          action: 'DISPATCH_WEBHOOK',
          payload: { endpoint: 'https://hooks.lexchronos.local/cisa', method: 'POST' }
        }
      ]
    },
    {
      sectionCode: 'G12',
      title: 'Terroristic Threat or Act',
      subtitle: 'Threats or acts intended to intimidate civilian populations',
      description:
        'Caters to terroristic threats, hoaxes, and acts requiring joint intelligence coordination.',
      category: 'PUBLIC_ORDER',
      severity: 'CRITICAL',
      statuteReference: 'Lex.G12.03',
      tags: ['terrorism', 'public-safety'],
      elements: [
        {
          label: 'Threat or Violent Act',
          description: 'Issued threat or committed act involving violence or weapons of mass destruction.',
          elementType: 'ACTUS_REUS',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G12.03(a)',
          baselineScore: 0.7
        },
        {
          label: 'Intent to Intimidate',
          description: 'Intended to intimidate or coerce civilian population or government.',
          elementType: 'MENS_REA',
          essential: true,
          weight: 4,
          statuteReference: 'Lex.G12.03(b)',
          baselineScore: 0.66
        },
        {
          label: 'Capability or Apparent Capability',
          description: 'Possessed capability or led victims to reasonably believe capability existed.',
          elementType: 'CIRCUMSTANCE',
          essential: true,
          weight: 3,
          statuteReference: 'Lex.G12.03(c)',
          baselineScore: 0.64
        }
      ],
      witnesses: [
        {
          name: 'Agent Noah Wallace',
          role: 'Counterterrorism Analyst',
          witnessType: 'LAW_ENFORCEMENT'
        }
      ],
      exhibits: [
        {
          label: 'Threat Assessment Packet',
          description: 'Joint intelligence bulletin and risk scoring.',
          exhibitType: 'report',
          authenticityStatus: 'VERIFIED'
        }
      ],
      automationHooks: [
        {
          trigger: 'HEATMAP_THRESHOLD',
          action: 'SEND_ALERT',
          payload: { threshold: 0.5, severity: 'critical', notify: ['fusion-center'] }
        }
      ]
    }
  ];

  for (const module of priorityOffenceModules) {
    const { elements = [], witnesses = [], exhibits = [], automationHooks = [], ...moduleData } = module;

    const existingModule = await prisma.priorityOffenceModule.findUnique({
      where: {
        sectionCode_organizationId: {
          sectionCode: module.sectionCode,
          organizationId: organization.id
        }
      }
    });

    if (existingModule) {
      console.log(`ℹ️ Priority offence module ${module.sectionCode} already exists, skipping.`);
      continue;
    }

    await prisma.priorityOffenceModule.create({
      data: {
        ...moduleData,
        organizationId: organization.id,
        elements: {
          create: elements
        },
        witnesses: {
          create: witnesses
        },
        exhibits: {
          create: exhibits
        },
        automationHooks: {
          create: automationHooks
        }
      }
    });

    console.log(`✅ Seeded priority offence module ${module.sectionCode}`);
  }

  // Create sample heatmap coverage and linkage
  const homicideModule = await prisma.priorityOffenceModule.findUnique({
    where: {
      sectionCode_organizationId: {
        sectionCode: 'G1',
        organizationId: organization.id
      }
    },
    include: { elements: true, witnesses: true, exhibits: true }
  });

  if (homicideModule) {
    await Promise.all(
      homicideModule.elements.map((element, index) =>
        prisma.offenceElementHeatmap.upsert({
          where: {
            elementId_caseId: {
              elementId: element.id,
              caseId: sampleCase1.id
            }
          },
          update: {
            coverageScore: index === 0 ? 0.68 : 0.42,
            status: index === 0 ? 'IN_PROGRESS' : 'AT_RISK',
            riskLevel: index === 0 ? 'MEDIUM' : 'HIGH',
            variance: 0.12
          },
          create: {
            elementId: element.id,
            caseId: sampleCase1.id,
            coverageScore: index === 0 ? 0.68 : 0.42,
            status: index === 0 ? 'IN_PROGRESS' : 'AT_RISK',
            riskLevel: index === 0 ? 'MEDIUM' : 'HIGH',
            variance: 0.12,
            notes: index === 0 ? 'Awaiting lab confirmation.' : 'Need corroborating witness statement.'
          }
        })
      )
    );

    const leadWitness = homicideModule.witnesses[0];
    const forensicReport = homicideModule.exhibits.find((ex) => ex.label === 'Forensic Report');

    if (leadWitness) {
      await prisma.offenceWitnessLink.upsert({
        where: {
          witnessId_elementId: {
            witnessId: leadWitness.id,
            elementId: homicideModule.elements[0]?.id || ''
          }
        },
        update: {
          testimonySummary: 'Describes crime scene layout and evidence collection.',
          credibilityScore: 0.92
        },
        create: {
          witnessId: leadWitness.id,
          elementId: homicideModule.elements[0].id,
          testimonySummary: 'Describes crime scene layout and evidence collection.',
          credibilityScore: 0.92
        }
      });
    }

    if (forensicReport) {
      await prisma.offenceExhibitLink.upsert({
        where: {
          exhibitId_elementId: {
            exhibitId: forensicReport.id,
            elementId: homicideModule.elements[1]?.id || ''
          }
        },
        update: {
          probativeValue: 0.88,
          notes: 'Autopsy supports malice aforethought with wound pattern analysis.'
        },
        create: {
          exhibitId: forensicReport.id,
          elementId: homicideModule.elements[1].id,
          probativeValue: 0.88,
          notes: 'Autopsy supports malice aforethought with wound pattern analysis.'
        }
      });
    }
  }

  const robberyModule = await prisma.priorityOffenceModule.findUnique({
    where: {
      sectionCode_organizationId: {
        sectionCode: 'G8',
        organizationId: organization.id
      }
    },
    include: { elements: true }
  });

  if (robberyModule) {
    await Promise.all(
      robberyModule.elements.map((element, index) =>
        prisma.offenceElementHeatmap.upsert({
          where: {
            elementId_caseId: {
              elementId: element.id,
              caseId: sampleCase2.id
            }
          },
          update: {
            coverageScore: index === 2 ? 0.55 : 0.75,
            status: index === 2 ? 'AT_RISK' : 'READY',
            riskLevel: index === 2 ? 'HIGH' : 'LOW',
            variance: index === 2 ? -0.1 : 0.05
          },
          create: {
            elementId: element.id,
            caseId: sampleCase2.id,
            coverageScore: index === 2 ? 0.55 : 0.75,
            status: index === 2 ? 'AT_RISK' : 'READY',
            riskLevel: index === 2 ? 'HIGH' : 'LOW',
            variance: index === 2 ? -0.1 : 0.05,
            notes: index === 2 ? 'Need medical expert for permanent injury proof.' : 'Element satisfied with current evidence.'
          }
        })
      )
    );
  }

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