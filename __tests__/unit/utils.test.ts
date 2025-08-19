import {
  cn,
  formatDate,
  formatCurrency,
  generateId,
  debounce,
  throttle,
  sleep,
  isValidEmail,
  isValidPhone,
  capitalizeWords,
  truncate,
  removeHtmlTags,
  getInitials,
  calculatePercentage,
  randomBetween,
  arrayToChunks,
  uniqueBy,
  sortBy,
  omit,
  pick,
} from '../../lib/utils'

describe('Utils', () => {
  describe('cn (classname utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('class1', false && 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).not.toContain('class2')
      expect(result).toContain('class3')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2')
    })
  })

  describe('formatDate', () => {
    it('should format valid dates correctly', () => {
      const date = new Date('2023-12-25')
      const result = formatDate(date)
      expect(result).toBe('December 25, 2023')
    })

    it('should handle string dates', () => {
      const result = formatDate('2023-12-25')
      expect(result).toBe('December 25, 2023')
    })

    it('should handle timestamp numbers', () => {
      const timestamp = new Date('2023-12-25').getTime()
      const result = formatDate(timestamp)
      expect(result).toBe('December 25, 2023')
    })

    it('should return "Invalid date" for invalid inputs', () => {
      expect(formatDate('invalid')).toBe('Invalid date')
      expect(formatDate(NaN)).toBe('Invalid date')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      expect(formatCurrency(1000)).toBe('$10.00')
      expect(formatCurrency(2550)).toBe('$25.50')
    })

    it('should format currency with specified currency', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€10.00')
    })

    it('should handle zero amounts', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000)).toBe('-$10.00')
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('should generate IDs with consistent format', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should prevent execution during throttle period', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should allow execution after throttle period', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      jest.advanceTimersByTime(100)
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return a promise that resolves after specified time', async () => {
      const promise = sleep(100)
      
      jest.advanceTimersByTime(100)
      
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@example')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true)
      expect(isValidPhone('+1234567890')).toBe(true)
      expect(isValidPhone('123-456-7890')).toBe(true)
      expect(isValidPhone('(123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('abc')).toBe(false)
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone('0123456789')).toBe(false) // starts with 0
    })
  })

  describe('capitalizeWords', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
      expect(capitalizeWords('the quick brown fox')).toBe('The Quick Brown Fox')
    })

    it('should handle single words', () => {
      expect(capitalizeWords('hello')).toBe('Hello')
    })

    it('should handle empty strings', () => {
      expect(capitalizeWords('')).toBe('')
    })

    it('should handle already capitalized text', () => {
      expect(capitalizeWords('Hello World')).toBe('Hello World')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is a ...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('should handle exact length', () => {
      expect(truncate('Exact', 5)).toBe('Exact')
    })
  })

  describe('removeHtmlTags', () => {
    it('should remove HTML tags', () => {
      expect(removeHtmlTags('<p>Hello <strong>world</strong></p>'))
        .toBe('Hello world')
    })

    it('should handle self-closing tags', () => {
      expect(removeHtmlTags('Hello<br/>world')).toBe('Helloworld')
    })

    it('should handle no tags', () => {
      expect(removeHtmlTags('Plain text')).toBe('Plain text')
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
    })

    it('should handle single names', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle empty strings', () => {
      expect(getInitials('')).toBe('')
    })

    it('should limit to two initials', () => {
      expect(getInitials('John Michael David Smith')).toBe('JM')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate correct percentages', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(1, 3)).toBe(33)
      expect(calculatePercentage(2, 3)).toBe(67)
    })

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0)
    })
  })

  describe('randomBetween', () => {
    it('should generate numbers within range', () => {
      const result = randomBetween(1, 10)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(10)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('should handle single number range', () => {
      expect(randomBetween(5, 5)).toBe(5)
    })
  })

  describe('arrayToChunks', () => {
    it('should split array into chunks', () => {
      const result = arrayToChunks([1, 2, 3, 4, 5], 2)
      expect(result).toEqual([[1, 2], [3, 4], [5]])
    })

    it('should handle empty arrays', () => {
      expect(arrayToChunks([], 2)).toEqual([])
    })

    it('should handle chunk size larger than array', () => {
      expect(arrayToChunks([1, 2], 5)).toEqual([[1, 2]])
    })
  })

  describe('uniqueBy', () => {
    const testData = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'John Duplicate' },
    ]

    it('should remove duplicates by key', () => {
      const result = uniqueBy(testData, 'id')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('John')
      expect(result[1].name).toBe('Jane')
    })

    it('should handle empty arrays', () => {
      expect(uniqueBy([], 'id')).toEqual([])
    })
  })

  describe('sortBy', () => {
    const testData = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ]

    it('should sort ascending by default', () => {
      const result = sortBy(testData, 'name')
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
      expect(result[2].name).toBe('Charlie')
    })

    it('should sort descending when specified', () => {
      const result = sortBy(testData, 'age', 'desc')
      expect(result[0].age).toBe(35)
      expect(result[1].age).toBe(30)
      expect(result[2].age).toBe(25)
    })

    it('should not mutate original array', () => {
      const original = [...testData]
      sortBy(testData, 'name')
      expect(testData).toEqual(original)
    })
  })

  describe('omit', () => {
    const testObj = { a: 1, b: 2, c: 3, d: 4 }

    it('should omit specified keys', () => {
      const result = omit(testObj, ['b', 'd'])
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should handle empty key array', () => {
      const result = omit(testObj, [])
      expect(result).toEqual(testObj)
    })

    it('should not mutate original object', () => {
      omit(testObj, ['b'])
      expect(testObj).toHaveProperty('b')
    })
  })

  describe('pick', () => {
    const testObj = { a: 1, b: 2, c: 3, d: 4 }

    it('should pick specified keys', () => {
      const result = pick(testObj, ['a', 'c'])
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should handle non-existent keys', () => {
      const result = pick(testObj, ['a', 'nonexistent' as keyof typeof testObj])
      expect(result).toEqual({ a: 1 })
    })

    it('should handle empty key array', () => {
      const result = pick(testObj, [])
      expect(result).toEqual({})
    })
  })
})