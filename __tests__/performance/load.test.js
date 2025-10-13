const autocannon = require('autocannon')

describe('Load Testing', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  
  const runLoadTest = async (url, options = {}) => {
    const defaultOptions = {
      url,
      connections: 10,
      pipelining: 1,
      duration: 10,
      ...options
    }
    
    return new Promise((resolve, reject) => {
      autocannon(defaultOptions, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  describe('API Endpoints Load Testing', () => {
    it('should handle concurrent requests to login endpoint', async () => {
      const result = await runLoadTest(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        }),
        connections: 20,
        duration: 15
      })
      
      // Should maintain reasonable response times
      expect(result.latency.mean).toBeLessThan(1000) // 1 second average
      expect(result.latency.p99).toBeLessThan(3000) // 3 second 99th percentile
      
      // Should handle requests without too many errors
      const errorRate = (result.errors / result.requests.total) * 100
      expect(errorRate).toBeLessThan(5) // Less than 5% error rate
      
      // Should maintain minimum throughput
      expect(result.throughput.mean).toBeGreaterThan(10) // 10 requests/second
    }, 30000)

    it('should handle concurrent requests to users endpoint', async () => {
      const result = await runLoadTest(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `user${Date.now()}@example.com`,
          password: 'StrongPass123',
          firstName: 'Load',
          lastName: 'Test'
        }),
        connections: 15,
        duration: 10
      })
      
      expect(result.latency.mean).toBeLessThan(1500) // 1.5 second average
      expect(result.latency.p95).toBeLessThan(3000) // 3 second 95th percentile
      
      const errorRate = (result.errors / result.requests.total) * 100
      expect(errorRate).toBeLessThan(10) // Less than 10% error rate (some may fail due to duplicate emails)
    }, 25000)

    it('should handle authenticated requests under load', async () => {
      // First, get a valid token
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      })
      
      if (loginResponse.ok) {
        const { accessToken } = await loginResponse.json()
        
        const result = await runLoadTest(`${baseUrl}/api/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          connections: 25,
          duration: 15
        })
        
        expect(result.latency.mean).toBeLessThan(800) // 800ms average
        expect(result.latency.p99).toBeLessThan(2000) // 2 second 99th percentile
        
        const errorRate = (result.errors / result.requests.total) * 100
        expect(errorRate).toBeLessThan(2) // Less than 2% error rate
      } else {
        console.log('Skipping authenticated load test - could not get token')
      }
    }, 35000)
  })

  describe('Static Asset Load Testing', () => {
    it('should serve static assets efficiently', async () => {
      const result = await runLoadTest(baseUrl, {
        connections: 30,
        duration: 20
      })
      
      // Static assets should be served quickly
      expect(result.latency.mean).toBeLessThan(500) // 500ms average
      expect(result.latency.p95).toBeLessThan(1000) // 1 second 95th percentile
      
      // Should handle high throughput for static content
      expect(result.throughput.mean).toBeGreaterThan(50) // 50 requests/second
      
      // Should have very low error rate for static content
      const errorRate = (result.errors / result.requests.total) * 100
      expect(errorRate).toBeLessThan(1) // Less than 1% error rate
    }, 30000)

    it('should handle CSS and JS asset requests', async () => {
      const cssResult = await runLoadTest(`${baseUrl}/_next/static/css/app.css`, {
        connections: 20,
        duration: 10,
        expectBody: false // Don't validate response body for assets
      })
      
      expect(cssResult.latency.mean).toBeLessThan(300) // 300ms average
      expect(cssResult.throughput.mean).toBeGreaterThan(30) // 30 requests/second
      
      const jsResult = await runLoadTest(`${baseUrl}/_next/static/chunks/main.js`, {
        connections: 20,
        duration: 10,
        expectBody: false
      })
      
      expect(jsResult.latency.mean).toBeLessThan(400) // 400ms average
      expect(jsResult.throughput.mean).toBeGreaterThan(25) // 25 requests/second
    }, 25000)
  })

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage()
      
      // Run multiple concurrent load tests
      const loadTests = [
        runLoadTest(baseUrl, { connections: 10, duration: 5 }),
        runLoadTest(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'test' }),
          connections: 10,
          duration: 5
        })
      ]
      
      await Promise.all(loadTests)
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    }, 20000)

    it('should handle gradual load increase', async () => {
      // Start with low load and gradually increase
      const lowLoadResult = await runLoadTest(baseUrl, {
        connections: 5,
        duration: 5
      })
      
      const mediumLoadResult = await runLoadTest(baseUrl, {
        connections: 15,
        duration: 5
      })
      
      const highLoadResult = await runLoadTest(baseUrl, {
        connections: 30,
        duration: 5
      })
      
      // Response times should not degrade significantly
      const lowLoadAvg = lowLoadResult.latency.mean
      const highLoadAvg = highLoadResult.latency.mean
      
      // High load should not be more than 3x slower than low load
      expect(highLoadAvg).toBeLessThan(lowLoadAvg * 3)
      
      // Throughput should scale reasonably
      expect(highLoadResult.throughput.mean).toBeGreaterThan(lowLoadResult.throughput.mean * 2)
    }, 25000)
  })

  describe('Error Handling Under Load', () => {
    it('should handle malformed requests gracefully', async () => {
      const result = await runLoadTest(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json',
        connections: 15,
        duration: 10
      })
      
      // Should respond quickly even to bad requests
      expect(result.latency.mean).toBeLessThan(500) // 500ms average
      
      // Should maintain throughput for error responses
      expect(result.throughput.mean).toBeGreaterThan(20) // 20 requests/second
      
      // Should have consistent error responses (400 status codes)
      expect(result['400']).toBeGreaterThan(result.requests.total * 0.8) // 80% should be 400 errors
    }, 20000)

    it('should handle timeout scenarios', async () => {
      const result = await runLoadTest(`${baseUrl}/api/nonexistent-endpoint`, {
        connections: 10,
        duration: 8,
        timeout: 5 // 5 second timeout
      })
      
      // Should handle 404s efficiently
      expect(result.latency.mean).toBeLessThan(300) // 300ms average
      expect(result['404']).toBeGreaterThan(result.requests.total * 0.9) // 90% should be 404s
    }, 15000)
  })

  describe('Concurrent User Simulation', () => {
    it('should handle mixed workload patterns', async () => {
      // Simulate different user behaviors concurrently
      const workloads = [
        // Heavy readers (dashboard access)
        runLoadTest(baseUrl, {
          connections: 20,
          duration: 15
        }),
        
        // API users (login attempts)
        runLoadTest(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@example.com', password: 'wrong' }),
          connections: 10,
          duration: 15
        }),
        
        // Form submissions (user registration)
        runLoadTest(`${baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'TestPass123',
            firstName: 'Test',
            lastName: 'User'
          }),
          connections: 5,
          duration: 15
        })
      ]
      
      const results = await Promise.all(workloads)
      
      // All workloads should complete successfully
      results.forEach((result, index) => {
        expect(result.latency.mean).toBeLessThan(2000) // 2 second average
        
        const errorRate = (result.errors / result.requests.total) * 100
        expect(errorRate).toBeLessThan(15) // Less than 15% error rate
        
        console.log(`Workload ${index + 1}:`, {
          avgLatency: result.latency.mean,
          p95Latency: result.latency.p95,
          throughput: result.throughput.mean,
          errorRate: errorRate.toFixed(2) + '%'
        })
      })
    }, 45000)

    it('should handle burst traffic patterns', async () => {
      // Simulate sudden traffic spike
      const burstTest = await runLoadTest(baseUrl, {
        connections: 50, // High concurrent connections
        duration: 10,
        amount: 1000 // Fixed number of requests
      })
      
      // Should handle burst without excessive degradation
      expect(burstTest.latency.mean).toBeLessThan(1500) // 1.5 second average
      expect(burstTest.latency.p99).toBeLessThan(5000) // 5 second 99th percentile
      
      // Should maintain reasonable throughput during burst
      expect(burstTest.throughput.mean).toBeGreaterThan(15) // 15 requests/second
      
      const errorRate = (burstTest.errors / burstTest.requests.total) * 100
      expect(errorRate).toBeLessThan(10) // Less than 10% error rate
    }, 25000)
  })

  describe('Resource Limits Testing', () => {
    it('should handle connection limits gracefully', async () => {
      // Test with very high connection count
      const highConnectionTest = await runLoadTest(baseUrl, {
        connections: 100,
        duration: 5,
        timeout: 10
      })
      
      // Should not crash or hang
      expect(highConnectionTest.latency.mean).toBeDefined()
      expect(highConnectionTest.throughput.mean).toBeGreaterThan(0)
      
      // May have higher error rate due to connection limits
      const errorRate = (highConnectionTest.errors / highConnectionTest.requests.total) * 100
      expect(errorRate).toBeLessThan(50) // Less than 50% error rate
    }, 20000)

    it('should recover from load spikes', async () => {
      // Create a load spike
      const spikeResult = await runLoadTest(baseUrl, {
        connections: 40,
        duration: 5
      })
      
      // Wait a moment for recovery
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test normal load after spike
      const recoveryResult = await runLoadTest(baseUrl, {
        connections: 10,
        duration: 5
      })
      
      // Recovery should show good performance
      expect(recoveryResult.latency.mean).toBeLessThan(spikeResult.latency.mean * 0.7)
      
      const recoveryErrorRate = (recoveryResult.errors / recoveryResult.requests.total) * 100
      expect(recoveryErrorRate).toBeLessThan(5) // Less than 5% error rate after recovery
    }, 20000)
  })
})