# LexChronos Testing Suite Documentation

## 📋 Overview

LexChronos uses a comprehensive testing strategy that includes unit tests, integration tests, end-to-end tests, component tests, security testing, performance testing, accessibility testing, cross-browser testing, and mobile testing. This ensures high code quality, reliability, and user experience.

## 🧪 Testing Stack

### Core Testing Tools
- **Jest** - Unit and integration testing framework
- **React Testing Library** - React component testing utilities
- **Cypress** - End-to-end testing framework
- **Playwright** - Cross-browser testing framework
- **jest-axe** - Accessibility testing
- **Lighthouse CI** - Performance testing
- **Appium** - Mobile native app testing (optional)

### Coverage and Reporting
- **NYC/Istanbul** - Code coverage analysis
- **Codecov** - Coverage reporting and tracking
- **GitHub Actions** - Continuous integration testing
- **HTML Reports** - Detailed coverage visualization

## 🗂️ Test Structure

```
lexchrono/
├── __tests__/                     # Unit and integration tests
│   ├── unit/                      # Unit tests
│   │   ├── utils.test.ts          # Utility function tests
│   │   └── validation.test.ts     # Validation logic tests
│   ├── integration/               # Integration tests
│   │   └── auth.test.ts          # API integration tests
│   ├── components/                # Component tests
│   │   ├── Button.test.tsx       # Button component tests
│   │   └── TimerWidget.test.tsx  # Timer widget tests
│   ├── security/                  # Security tests
│   │   ├── authentication.test.ts # Auth security tests
│   │   ├── validation.test.ts     # Input validation tests
│   │   └── api.test.ts           # API security tests
│   ├── accessibility/             # Accessibility tests
│   │   ├── axe.test.tsx          # Axe accessibility tests
│   │   └── keyboard-navigation.test.tsx # Keyboard tests
│   └── performance/               # Performance tests
│       ├── lighthouse.test.js     # Lighthouse tests
│       └── load.test.js          # Load testing
├── cypress/                       # Cypress E2E tests
│   ├── e2e/                      # E2E test specs
│   │   ├── auth.cy.ts            # Authentication flows
│   │   └── dashboard.cy.ts       # Dashboard functionality
│   ├── support/                   # Cypress support files
│   └── fixtures/                  # Test data fixtures
├── tests/                         # Additional test configurations
│   ├── playwright/                # Cross-browser tests
│   │   ├── cross-browser.spec.ts # Browser compatibility
│   │   └── mobile.spec.ts        # Mobile-specific tests
│   └── mobile/                    # Native mobile tests
└── coverage/                      # Generated coverage reports
```

## 🚀 Getting Started

### Installation

All testing dependencies should already be installed if you've run:

```bash
npm install
```

If not, install testing dependencies:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe cypress playwright @lhci/cli --legacy-peer-deps
```

### Running Tests

#### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- utils.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Button"
```

#### Integration Tests
```bash
# Run integration tests
npm test -- __tests__/integration

# Run API tests specifically
npm test -- auth.test.ts
```

#### Component Tests
```bash
# Run all component tests
npm test -- __tests__/components

# Run specific component test
npm test -- Button.test.tsx
```

#### End-to-End Tests
```bash
# Run Cypress tests in headless mode
npm run test:e2e

# Open Cypress Test Runner
npm run test:e2e:dev

# Run specific Cypress test
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

#### Cross-Browser Tests
```bash
# Run Playwright tests
npx playwright test

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
```

#### Security Tests
```bash
# Run security test suite
npm test -- __tests__/security

# Run specific security tests
npm test -- authentication.test.ts
npm test -- validation.test.ts
```

#### Accessibility Tests
```bash
# Run accessibility tests
npm test -- __tests__/accessibility

# Run axe accessibility tests
npm test -- axe.test.tsx

# Run keyboard navigation tests
npm test -- keyboard-navigation.test.tsx
```

#### Performance Tests
```bash
# Run Lighthouse tests
npm run test:lighthouse

# Run load tests
npm test -- load.test.js
```

#### Coverage Reports
```bash
# Generate comprehensive coverage report
node scripts/test-coverage.js

# Run coverage in watch mode
node scripts/test-coverage.js --watch

# Generate HTML-only coverage report
node scripts/test-coverage.js --html-only
```

## 📊 Coverage Goals

### Coverage Thresholds
- **Overall Coverage**: 80%+
- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

### Directory-Specific Goals
- **lib/ (utilities)**: 90%+
- **components/**: 75%+
- **app/api/**: 85%+
- **utils/**: 85%+

### Coverage Reports
Coverage reports are generated in multiple formats:
- **HTML**: `coverage/index.html` - Interactive coverage report
- **LCOV**: `coverage/lcov.info` - For external tools
- **JSON**: `coverage/coverage-final.json` - Machine-readable format
- **Text**: Console output during test runs

## 🔧 Configuration Files

### Jest Configuration
- `jest.config.js` - Main Jest configuration
- `jest.config.coverage.js` - Coverage-specific configuration  
- `jest.setup.js` - Global test setup
- `jest.coverage.setup.js` - Coverage-specific setup

### Cypress Configuration
- `cypress.config.ts` - Cypress configuration
- `cypress/support/e2e.ts` - E2E support file
- `cypress/support/commands.ts` - Custom commands

### Playwright Configuration
- `playwright.config.ts` - Cross-browser test configuration

### Performance Testing
- `lighthouserc.js` - Lighthouse CI configuration

## 🧩 Writing Tests

### Unit Tests Example
```typescript
import { formatDate, calculatePercentage } from '../../lib/utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25')
      expect(formatDate(date)).toBe('December 25, 2023')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid date')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(1, 3)).toBe(33)
    })

    it('should handle division by zero', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })
  })
})
```

### Component Tests Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../components/ui/Button'

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()

    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### E2E Tests Example
```typescript
describe('Authentication Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login')
    
    cy.getByTestId('email-input').type('user@example.com')
    cy.getByTestId('password-input').type('password123')
    cy.getByTestId('login-button').click()
    
    cy.url().should('include', '/dashboard')
    cy.getByTestId('user-menu').should('contain', 'John Doe')
  })
})
```

### Accessibility Tests Example
```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## 🔍 Test Debugging

### Jest Debugging
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand Button.test.tsx
```

### Cypress Debugging
```bash
# Open Cypress with debugging
npx cypress open --env DEBUG=true

# Run Cypress with debug output
DEBUG=cypress:* npx cypress run
```

### Coverage Debugging
```bash
# Generate detailed coverage report
node scripts/test-coverage.js

# Check coverage for specific file
npx jest --coverage --collectCoverageFrom="lib/utils.ts"
```

## 📈 Performance Considerations

### Test Performance Tips
1. **Use `screen` queries** instead of `container.querySelector`
2. **Mock heavy dependencies** to speed up tests
3. **Use `userEvent` setup()** for better performance
4. **Avoid unnecessary `waitFor`** calls
5. **Use `beforeAll` for expensive setup**

### Parallel Testing
```bash
# Run Jest tests in parallel
npm test -- --maxWorkers=4

# Run Playwright tests in parallel
npx playwright test --workers=3
```

## 🔄 Continuous Integration

### GitHub Actions
The project includes comprehensive CI workflows:
- **test-coverage.yml** - Main test and coverage pipeline
- Runs on push to main/develop branches
- Runs on pull requests
- Daily scheduled runs
- Multi-node version testing

### CI Test Commands
```bash
# Full CI test suite
npm run test:all

# Individual CI test suites
npm run test:ci          # Unit tests with coverage
npm run test:e2e         # E2E tests
npm run test:lighthouse  # Performance tests
```

## 🎯 Best Practices

### Test Writing Guidelines
1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Use proper test data and fixtures**

### Coverage Best Practices
1. **Aim for meaningful coverage, not just high numbers**
2. **Focus on critical business logic**
3. **Test error handling paths**
4. **Include integration test coverage**
5. **Review coverage reports regularly**

### Maintenance Guidelines
1. **Keep tests fast and reliable**
2. **Refactor tests when refactoring code**
3. **Update test data regularly**
4. **Monitor test flakiness**
5. **Document complex test scenarios**

## 🚨 Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Cypress tests failing
```bash
# Clear Cypress cache
npx cypress cache clear

# Verify Cypress installation
npx cypress verify
```

#### Coverage not generating
```bash
# Check Jest configuration
node -e "console.log(require('./jest.config.js'))"

# Run with verbose coverage
npx jest --coverage --verbose
```

#### Accessibility tests failing
```bash
# Check jest-axe configuration
npm test -- --testNamePattern="accessibility" --verbose
```

### Getting Help
1. Check test logs and error messages
2. Review configuration files
3. Consult Jest/Cypress documentation
4. Check GitHub Issues for known problems
5. Run tests in isolation to identify issues

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Playwright Documentation](https://playwright.dev/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## 🎉 Contributing

When contributing to LexChronos:
1. **Write tests for new features**
2. **Maintain or improve coverage**
3. **Update test documentation**
4. **Follow existing test patterns**
5. **Ensure all tests pass before submitting**

Happy testing! 🧪✨