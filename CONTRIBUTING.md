# Contributing to LexChronos

Thank you for your interest in contributing to LexChronos! This guide will help you get started with contributing to our legal case management platform.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Guidelines](#documentation-guidelines)
9. [Legal Considerations](#legal-considerations)

## 📜 Code of Conduct

### Our Pledge

We are committed to making participation in LexChronos a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, discriminatory language, or personal attacks
- Publishing others' private information without permission
- Trolling, insulting/derogatory comments
- Other conduct inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team at conduct@lexchronos.com. All complaints will be reviewed and investigated promptly and fairly.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Node.js 18+** installed
- **Git** for version control
- **PostgreSQL 14+** for database
- **Redis 6+** for caching
- A **GitHub account**

### Areas of Contribution

We welcome contributions in:
- **Code**: Bug fixes, new features, performance improvements
- **Documentation**: User guides, API documentation, tutorials
- **Testing**: Writing tests, improving test coverage
- **Design**: UI/UX improvements, accessibility enhancements
- **Legal**: Legal industry insights, compliance guidance
- **Translation**: Internationalization and localization

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/lexchrono.git
cd lexchrono

# Add upstream remote
git remote add upstream https://github.com/lexchronos/lexchrono.git
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis (or use Docker)
docker-compose up -d postgres redis

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:3000
```

### 5. Verify Setup

```bash
# Run tests to ensure everything works
npm test

# Run linting
npm run lint

# Check TypeScript
npm run type-check
```

## 🤝 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or videos if applicable
   - Environment details (browser, OS, etc.)

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: [Chrome 120.0]
- OS: [Windows 11]
- LexChronos Version: [1.0.0]

## Additional Context
Any other relevant information
```

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Explain the legal use case** and business value
4. **Consider implementation complexity**

**Feature Request Template:**
```markdown
## Feature Summary
Brief description of the proposed feature

## Legal Use Case
Explain how this feature would benefit legal professionals

## Current Workaround
How do users currently handle this need?

## Proposed Solution
Detailed description of the feature

## Alternative Solutions
Other approaches considered

## Additional Context
Mockups, legal requirements, etc.
```

### Making Code Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow our coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run test:e2e
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add case timeline filtering
   
   - Add filter options for timeline events
   - Implement date range selection
   - Add event type filtering
   - Update UI with filter controls
   
   Closes #123"
   ```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure your branch is up-to-date**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run the full test suite**
   ```bash
   npm run test:all
   ```

3. **Update documentation** if needed

4. **Add or update tests** for your changes

### Pull Request Guidelines

**PR Title Format:**
```
type(scope): brief description

Examples:
feat(cases): add timeline filtering
fix(auth): resolve token refresh issue
docs(api): update authentication guide
test(billing): add time tracking tests
```

**PR Description Template:**
```markdown
## Summary
Brief description of changes

## Related Issue
Closes #issue_number

## Changes Made
- List of specific changes
- Use bullet points
- Be descriptive

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Legal Considerations
- [ ] Attorney-client privilege protected
- [ ] Compliance requirements met
- [ ] Data security maintained

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User documentation updated

## Screenshots
(If applicable)
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by maintainers
3. **Legal review** for changes affecting client data or legal workflows
4. **Final approval** and merge

### Review Criteria

**Code Quality:**
- Follows established patterns
- Includes appropriate tests
- Has clear documentation
- Handles errors gracefully

**Legal Compliance:**
- Maintains data security
- Protects attorney-client privilege
- Follows legal industry standards
- Includes audit trails where needed

**User Experience:**
- Intuitive interface design
- Accessible to all users
- Mobile-friendly
- Performance optimized

## 🎨 Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types
interface CaseData {
  id: string
  title: string
  status: CaseStatus
  createdAt: Date
}

// Prefer interfaces over types for object shapes
interface Props {
  case: CaseData
  onUpdate: (case: CaseData) => void
}

// Use enums for constants
enum CaseStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}
```

### React Component Guidelines

```typescript
// Use function components with hooks
export function CaseCard({ case, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  
  const handleUpdate = useCallback((data: CaseData) => {
    onUpdate(data)
    setIsEditing(false)
  }, [onUpdate])
  
  return (
    <Card className="case-card">
      {/* Component content */}
    </Card>
  )
}

// Use proper prop types and defaults
CaseCard.defaultProps = {
  onUpdate: () => {}
}
```

### API Route Guidelines

```typescript
// app/api/cases/route.ts
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const user = await validateAuth(request)
    
    // Validate permissions
    await requirePermission(user.id, 'READ_CASES')
    
    // Business logic
    const cases = await caseService.findByOrganization(user.organizationId)
    
    return NextResponse.json({
      success: true,
      data: { cases }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Database Guidelines

```typescript
// Use Prisma for type-safe database access
async function createCase(data: CreateCaseData, userId: string): Promise<Case> {
  return await prisma.case.create({
    data: {
      ...data,
      assigneeId: userId,
      organizationId: await getUserOrganization(userId)
    },
    include: {
      assignee: true,
      organization: true
    }
  })
}
```

## 🧪 Testing Requirements

### Test Categories

1. **Unit Tests** (required for all functions)
   ```typescript
   describe('CaseService', () => {
     it('should create a case with valid data', async () => {
       const caseData = { title: 'Test Case', type: 'CIVIL' }
       const result = await caseService.create(caseData, userId)
       
       expect(result).toBeDefined()
       expect(result.title).toBe('Test Case')
     })
   })
   ```

2. **Integration Tests** (required for API endpoints)
   ```typescript
   describe('Cases API', () => {
     it('POST /api/cases should create a case', async () => {
       const response = await request(app)
         .post('/api/cases')
         .set('Authorization', `Bearer ${token}`)
         .send({ title: 'Test Case', type: 'CIVIL' })
         .expect(201)
       
       expect(response.body.success).toBe(true)
     })
   })
   ```

3. **End-to-End Tests** (required for user workflows)
   ```typescript
   describe('Case Management', () => {
     it('should allow creating and viewing a case', () => {
       cy.login('lawyer@firm.com', 'password')
       cy.visit('/cases')
       cy.get('[data-testid=new-case-button]').click()
       cy.get('[data-testid=case-title]').type('Test Case')
       cy.get('[data-testid=save-button]').click()
       cy.contains('Test Case').should('be.visible')
     })
   })
   ```

### Test Coverage Requirements

- **Minimum 80% coverage** for new code
- **100% coverage** for critical security functions
- **All API endpoints** must have integration tests
- **Key user workflows** must have E2E tests

## 📚 Documentation Guidelines

### Code Documentation

```typescript
/**
 * Creates a new legal case with proper authorization and audit logging
 * 
 * @param data - Case creation data
 * @param userId - ID of the user creating the case
 * @returns Promise<Case> - The created case with related data
 * 
 * @throws {ValidationError} When case data is invalid
 * @throws {PermissionError} When user lacks CREATE_CASE permission
 * 
 * @example
 * ```typescript
 * const case = await createCase({
 *   title: 'Smith v. Jones',
 *   type: 'CIVIL',
 *   clientName: 'John Smith'
 * }, 'user_123')
 * ```
 */
export async function createCase(data: CreateCaseData, userId: string): Promise<Case> {
  // Implementation
}
```

### API Documentation

- Update OpenAPI specs for new endpoints
- Include request/response examples
- Document error codes and responses
- Explain legal context and use cases

### User Documentation

- Write clear, step-by-step guides
- Include screenshots for complex workflows
- Explain legal implications of features
- Provide troubleshooting information

## ⚖️ Legal Considerations

### Data Security

All contributions must maintain:
- **Encryption** of sensitive data
- **Access controls** for client information
- **Audit trails** for data access
- **Backup and recovery** capabilities

### Attorney-Client Privilege

- Mark privileged content appropriately
- Implement proper access restrictions
- Provide clear user guidance
- Maintain confidentiality safeguards

### Compliance Requirements

Consider these legal requirements:
- **GDPR** - Data protection and privacy
- **HIPAA** - Healthcare information (when applicable)
- **SOX** - Financial controls for public companies
- **State Bar Rules** - Professional conduct requirements

### Legal Industry Standards

- Follow legal naming conventions
- Use proper legal terminology
- Respect workflow patterns familiar to lawyers
- Maintain professional appearance and functionality

## 🏆 Recognition

Contributors will be recognized through:
- **GitHub Contributors** page
- **Release notes** acknowledgments
- **Community highlights** in newsletters
- **Conference speaking** opportunities for major contributors

## 💬 Getting Help

### Communication Channels

- **GitHub Discussions** - Questions and general discussion
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time chat with the community
- **Email** - contribute@lexchronos.com for private matters

### Mentorship Program

New contributors can get help from experienced maintainers:
- **Pair programming** sessions
- **Code review** guidance
- **Legal industry** context and education
- **Career development** in legal technology

## 📝 Legal Agreement

By contributing to LexChronos, you agree that:
- Your contributions will be licensed under the same license as the project
- You have the right to contribute the code/content
- Your contributions do not violate any third-party rights
- You understand the legal sensitivity of the project domain

---

Thank you for contributing to LexChronos! Your efforts help improve legal practice management for attorneys worldwide. 🚀⚖️