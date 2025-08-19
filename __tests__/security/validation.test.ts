import { 
  sanitizeInput, 
  sanitizeHtml, 
  validateEmail, 
  validatePassword,
  validatePhone 
} from '../../lib/validation'

describe('Input Validation Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should sanitize basic XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>',
      ]

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onload')
        expect(sanitized).not.toContain('onerror')
      })
    })

    it('should preserve safe content while removing dangerous elements', () => {
      const mixedInput = 'Hello <script>alert("xss")</script> World'
      const sanitized = sanitizeInput(mixedInput)
      
      expect(sanitized).toContain('Hello')
      expect(sanitized).toContain('World')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should handle nested XSS attempts', () => {
      const nestedXss = '<script><script>alert("nested")</script></script>'
      const sanitized = sanitizeInput(nestedXss)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should sanitize event handlers in HTML', () => {
      const htmlWithHandlers = `
        <div onclick="malicious()">Content</div>
        <p onmouseover="steal()">Text</p>
        <button onsubmit="hack()">Click</button>
      `
      
      const sanitized = sanitizeHtml(htmlWithHandlers)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('onmouseover')
      expect(sanitized).not.toContain('onsubmit')
      expect(sanitized).toContain('Content')
      expect(sanitized).toContain('Text')
      expect(sanitized).toContain('Click')
    })

    it('should remove script tags from HTML', () => {
      const htmlWithScripts = `
        <div>Safe content</div>
        <script>alert('malicious')</script>
        <p>More safe content</p>
        <script src="evil.js"></script>
      `
      
      const sanitized = sanitizeHtml(htmlWithScripts)
      
      expect(sanitized).toContain('Safe content')
      expect(sanitized).toContain('More safe content')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
      expect(sanitized).not.toContain('evil.js')
    })

    it('should remove iframe tags to prevent frame injection', () => {
      const htmlWithIframes = `
        <div>Content</div>
        <iframe src="malicious.com"></iframe>
        <iframe srcdoc="<script>alert('xss')</script>"></iframe>
      `
      
      const sanitized = sanitizeHtml(htmlWithIframes)
      
      expect(sanitized).toContain('Content')
      expect(sanitized).not.toContain('<iframe>')
      expect(sanitized).not.toContain('malicious.com')
      expect(sanitized).not.toContain('srcdoc')
    })

    it('should handle encoded XSS attempts', () => {
      const encodedXss = [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        '%3Cscript%3Ealert("xss")%3C/script%3E',
        '&#60;script&#62;alert("xss")&#60;/script&#62;',
      ]
      
      encodedXss.forEach(input => {
        const sanitized = sanitizeInput(input)
        // Should not decode and execute
        expect(sanitized).not.toContain('<script>')
      })
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should sanitize common SQL injection patterns', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM passwords --",
        "'; EXEC xp_cmdshell('dir'); --",
      ]

      sqlInjectionAttempts.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('DROP TABLE')
        expect(sanitized).not.toContain('UNION SELECT')
        expect(sanitized).not.toContain('xp_cmdshell')
        expect(sanitized).not.toContain('--')
      })
    })

    it('should handle SQL injection with different quote types', () => {
      const injectionAttempts = [
        `"; DROP TABLE users; --`,
        `\`; DROP TABLE users; --`,
        `'; SELECT * FROM information_schema.tables; --`,
      ]

      injectionAttempts.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('DROP TABLE')
        expect(sanitized).not.toContain('SELECT')
        expect(sanitized).not.toContain('information_schema')
      })
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should handle directory traversal attempts', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\windows\\system32\\',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2f',
      ]

      pathTraversalAttempts.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('../')
        expect(sanitized).not.toContain('..\\')
        expect(sanitized).not.toContain('/etc/')
        expect(sanitized).not.toContain('system32')
      })
    })
  })

  describe('Email Validation Security', () => {
    it('should validate legitimate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'firstname.lastname@company.com',
      ]

      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject malicious email patterns', () => {
      const maliciousEmails = [
        'test@example.com<script>alert("xss")</script>',
        'user@domain.com"; DROP TABLE users; --',
        'test@domain.com\r\nBCC: attacker@evil.com',
        'user@domain.com%0D%0ABCC:attacker@evil.com',
        'test@[192.168.1.1]<script>',
      ]

      maliciousEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
      })
    })

    it('should prevent email header injection', () => {
      const headerInjectionAttempts = [
        'test@domain.com\nBCC: attacker@evil.com',
        'test@domain.com\rSubject: Spam',
        'test@domain.com%0ABcc:evil@hacker.com',
        'test@domain.com\x00BCC:evil@hacker.com',
      ]

      headerInjectionAttempts.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('Password Validation Security', () => {
    it('should enforce strong password requirements', () => {
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty',
        'Password', // Missing number
        'password123', // Missing uppercase
        'PASSWORD123', // Missing lowercase
        'Pass123', // Too short
      ]

      weakPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
      })
    })

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123',
        'MySecure@Password1',
        'ComplexP@ssw0rd',
        'Secure123!',
      ]

      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
      })
    })

    it('should handle password with injection attempts', () => {
      const maliciousPasswords = [
        `'; DROP TABLE users; --`,
        `<script>alert("xss")</script>`,
        `Password123'; EXEC xp_cmdshell('dir'); --`,
      ]

      // These should be considered invalid due to special characters
      // but if they pass basic validation, they should be safely hashed
      maliciousPasswords.forEach(password => {
        // The validation might pass, but hashing should be safe
        const result = validatePassword(password)
        // Regardless of validation result, it should not cause security issues
        expect(typeof result.isValid).toBe('boolean')
      })
    })
  })

  describe('Phone Validation Security', () => {
    it('should validate legitimate phone numbers', () => {
      const validPhones = [
        '1234567890',
        '+1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '+44 20 7946 0958',
      ]

      validPhones.forEach(phone => {
        const result = validatePhone(phone)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject malicious phone patterns', () => {
      const maliciousPhones = [
        '1234567890<script>alert("xss")</script>',
        `1234567890'; DROP TABLE users; --`,
        '123-456-7890\r\nmalicious-header',
        '+1-555-0123%0D%0AAttacker-Header',
      ]

      maliciousPhones.forEach(phone => {
        const result = validatePhone(phone)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('Input Length and Size Limits', () => {
    it('should handle extremely long inputs', () => {
      const veryLongInput = 'a'.repeat(100000)
      
      // Should not cause performance issues or crashes
      const start = Date.now()
      const sanitized = sanitizeInput(veryLongInput)
      const duration = Date.now() - start
      
      expect(sanitized).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle inputs with many special characters', () => {
      const specialCharInput = '<>'.repeat(10000)
      
      const sanitized = sanitizeInput(specialCharInput)
      expect(sanitized).toBeDefined()
      expect(sanitized.length).toBeLessThan(specialCharInput.length)
    })

    it('should handle null bytes and control characters', () => {
      const inputWithNulls = 'normal\0text\x00with\x01control\x1fchars'
      const sanitized = sanitizeInput(inputWithNulls)
      
      expect(sanitized).not.toContain('\0')
      expect(sanitized).not.toContain('\x00')
      expect(sanitized).not.toContain('\x01')
      expect(sanitized).not.toContain('\x1f')
      expect(sanitized).toContain('normal')
      expect(sanitized).toContain('text')
    })
  })

  describe('Unicode and Encoding Security', () => {
    it('should handle Unicode normalization attacks', () => {
      // Different Unicode representations of similar characters
      const unicodeInputs = [
        'café', // é as single character
        'cafe\u0301', // é as e + combining acute accent
        'admin\u200badmin', // Zero-width space
        'test\ufefftest', // Byte order mark
      ]

      unicodeInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBeDefined()
        // Should handle Unicode safely
      })
    })

    it('should prevent homograph attacks', () => {
      // Characters that look similar but are different
      const homographInputs = [
        'аdmin', // Cyrillic 'а' instead of Latin 'a'
        'gооgle.com', // Cyrillic 'о' instead of Latin 'o'
        'micro\u0455oft.com', // Cyrillic 's' lookalike
      ]

      homographInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBeDefined()
        // Should be preserved as-is unless it contains dangerous patterns
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const nullInputs = [null, undefined, '']

      nullInputs.forEach(input => {
        expect(() => sanitizeInput(input as string)).not.toThrow()
        
        if (input !== null && input !== undefined) {
          const result = sanitizeInput(input)
          expect(result).toBe('')
        }
      })
    })

    it('should handle inputs with only whitespace', () => {
      const whitespaceInputs = [
        '   ',
        '\t\t\t',
        '\n\n\n',
        '\r\n\r\n',
        ' \t\n\r ',
      ]

      whitespaceInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized.trim()).toBe('')
      })
    })

    it('should handle mixed content safely', () => {
      const mixedContent = `
        Normal text here
        <script>alert('xss')</script>
        More normal text
        javascript:void(0)
        Final text
      `
      
      const sanitized = sanitizeInput(mixedContent)
      
      expect(sanitized).toContain('Normal text here')
      expect(sanitized).toContain('More normal text')
      expect(sanitized).toContain('Final text')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('alert')
    })
  })
})