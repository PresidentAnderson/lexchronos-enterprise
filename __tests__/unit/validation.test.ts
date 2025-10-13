import {
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  sanitizeHtml,
  isStrongPassword,
  calculatePasswordStrength,
  emailSchema,
  passwordSchema,
  phoneSchema,
  userSchema,
  loginSchema,
  timeEntrySchema,
  projectSchema,
  clientSchema,
  invoiceSchema,
} from '../../lib/validation'

describe('Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true })
      expect(validateEmail('user.name@domain.co.uk')).toEqual({ isValid: true })
    })

    it('should reject invalid email addresses', () => {
      const result = validateEmail('invalid-email')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid email format')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123')).toEqual({ isValid: true })
    })

    it('should reject weak passwords', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should require minimum length', () => {
      const result = validatePassword('Aa1')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 8 characters')
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('1234567890')).toEqual({ isValid: true })
      expect(validatePhone('+1234567890')).toEqual({ isValid: true })
    })

    it('should reject invalid phone numbers', () => {
      const result = validatePhone('123')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 10 digits')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('scriptalert("xss")/script')
      
      expect(sanitizeInput('javascript:alert("xss")'))
        .toBe('alert("xss")')
      
      expect(sanitizeInput('onclick="alert()"'))
        .toBe('alert()')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    it('should handle normal text', () => {
      expect(sanitizeInput('Normal text input')).toBe('Normal text input')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div>Safe content</div><script>alert("xss")</script>'
      const result = sanitizeHtml(html)
      
      expect(result).toContain('<div>Safe content</div>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove iframe tags', () => {
      const html = '<div>Content</div><iframe src="malicious.com"></iframe>'
      const result = sanitizeHtml(html)
      
      expect(result).toContain('<div>Content</div>')
      expect(result).not.toContain('<iframe>')
    })

    it('should remove event handlers', () => {
      const html = '<div onclick="alert()">Click me</div>'
      const result = sanitizeHtml(html)
      
      expect(result).toContain('<div>Click me</div>')
      expect(result).not.toContain('onclick')
    })
  })

  describe('isStrongPassword', () => {
    it('should identify strong passwords', () => {
      expect(isStrongPassword('StrongPass123!')).toBe(true)
      expect(isStrongPassword('MySecure@Pass1')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false) // No uppercase, numbers, special
      expect(isStrongPassword('PASSWORD')).toBe(false) // No lowercase, numbers, special
      expect(isStrongPassword('Password')).toBe(false) // No numbers, special
      expect(isStrongPassword('Password1')).toBe(false) // No special characters
      expect(isStrongPassword('Pass1!')).toBe(false) // Too short
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should calculate correct strength for strong password', () => {
      const result = calculatePasswordStrength('VeryStrongPass123!')
      expect(result.score).toBeGreaterThanOrEqual(5)
      expect(result.feedback).toHaveLength(0)
    })

    it('should provide feedback for weak passwords', () => {
      const result = calculatePasswordStrength('weak')
      expect(result.score).toBeLessThan(3)
      expect(result.feedback.length).toBeGreaterThan(0)
      expect(result.feedback).toContain('Use at least 8 characters')
      expect(result.feedback).toContain('Add uppercase letters')
      expect(result.feedback).toContain('Add numbers')
      expect(result.feedback).toContain('Add special characters')
    })

    it('should give extra points for longer passwords', () => {
      const short = calculatePasswordStrength('Pass123!')
      const long = calculatePasswordStrength('VeryLongPassword123!')
      
      expect(long.score).toBeGreaterThan(short.score)
    })
  })

  describe('Schema Validations', () => {
    describe('emailSchema', () => {
      it('should validate correct emails', () => {
        expect(() => emailSchema.parse('test@example.com')).not.toThrow()
      })

      it('should reject invalid emails', () => {
        expect(() => emailSchema.parse('invalid')).toThrow()
      })
    })

    describe('userSchema', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'StrongPass123',
        firstName: 'John',
        lastName: 'Doe',
      }

      it('should validate complete user data', () => {
        expect(() => userSchema.parse(validUser)).not.toThrow()
      })

      it('should validate user with optional fields', () => {
        const userWithOptionals = {
          ...validUser,
          phone: '1234567890',
          dateOfBirth: new Date('1990-01-01'),
        }
        expect(() => userSchema.parse(userWithOptionals)).not.toThrow()
      })

      it('should reject user with missing required fields', () => {
        const { email, ...incompleteUser } = validUser
        expect(() => userSchema.parse(incompleteUser)).toThrow()
      })
    })

    describe('timeEntrySchema', () => {
      const validTimeEntry = {
        projectId: 'project-123',
        description: 'Working on feature',
        startTime: new Date('2023-01-01T09:00:00Z'),
        endTime: new Date('2023-01-01T17:00:00Z'),
        billableHours: 8,
        hourlyRate: 100,
      }

      it('should validate correct time entry', () => {
        expect(() => timeEntrySchema.parse(validTimeEntry)).not.toThrow()
      })

      it('should reject time entry with end time before start time', () => {
        const invalidEntry = {
          ...validTimeEntry,
          startTime: new Date('2023-01-01T17:00:00Z'),
          endTime: new Date('2023-01-01T09:00:00Z'),
        }
        expect(() => timeEntrySchema.parse(invalidEntry)).toThrow()
      })

      it('should reject negative billable hours', () => {
        const invalidEntry = { ...validTimeEntry, billableHours: -1 }
        expect(() => timeEntrySchema.parse(invalidEntry)).toThrow()
      })
    })

    describe('projectSchema', () => {
      const validProject = {
        name: 'Test Project',
        description: 'A test project',
        clientId: 'client-123',
        hourlyRate: 100,
        isActive: true,
        startDate: new Date('2023-01-01'),
      }

      it('should validate correct project', () => {
        expect(() => projectSchema.parse(validProject)).not.toThrow()
      })

      it('should validate project with end date', () => {
        const projectWithEndDate = {
          ...validProject,
          endDate: new Date('2023-12-31'),
        }
        expect(() => projectSchema.parse(projectWithEndDate)).not.toThrow()
      })

      it('should reject project with end date before start date', () => {
        const invalidProject = {
          ...validProject,
          startDate: new Date('2023-12-31'),
          endDate: new Date('2023-01-01'),
        }
        expect(() => projectSchema.parse(invalidProject)).toThrow()
      })
    })

    describe('invoiceSchema', () => {
      const validInvoice = {
        clientId: 'client-123',
        projectId: 'project-123',
        invoiceNumber: 'INV-001',
        issueDate: new Date('2023-01-01'),
        dueDate: new Date('2023-01-31'),
        items: [{
          description: 'Development work',
          quantity: 40,
          rate: 100,
          amount: 4000,
        }],
        subtotal: 4000,
        tax: 400,
        total: 4400,
      }

      it('should validate correct invoice', () => {
        expect(() => invoiceSchema.parse(validInvoice)).not.toThrow()
      })

      it('should reject invoice with due date before issue date', () => {
        const invalidInvoice = {
          ...validInvoice,
          issueDate: new Date('2023-01-31'),
          dueDate: new Date('2023-01-01'),
        }
        expect(() => invoiceSchema.parse(invalidInvoice)).toThrow()
      })

      it('should reject invoice with no items', () => {
        const invalidInvoice = { ...validInvoice, items: [] }
        expect(() => invoiceSchema.parse(invalidInvoice)).toThrow()
      })
    })
  })
})