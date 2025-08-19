#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue')
  try {
    const result = execSync(command, { stdio: 'inherit', encoding: 'utf8' })
    log(`✅ ${description} completed`, 'green')
    return result
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red')
    throw error
  }
}

function generateCoverageReport() {
  log('\n📊 LexChronos Test Coverage Report Generator', 'cyan')
  log('============================================', 'cyan')
  
  try {
    // Clean previous coverage data
    log('\n🧹 Cleaning previous coverage data...', 'yellow')
    if (fs.existsSync('coverage')) {
      execSync('rm -rf coverage', { stdio: 'inherit' })
    }
    
    // Run Jest tests with coverage
    runCommand(
      'npx jest --config jest.config.coverage.js --coverage --verbose --detectOpenHandles',
      'Running Jest tests with coverage'
    )
    
    // Run Cypress tests (if configured for coverage)
    try {
      log('\n🔄 Attempting to run Cypress tests with coverage...', 'blue')
      execSync('npx cypress run --env coverage=true', { stdio: 'inherit' })
      log('✅ Cypress tests completed', 'green')
    } catch (error) {
      log('⚠️ Cypress tests not available or failed', 'yellow')
    }
    
    // Generate coverage reports
    log('\n📋 Generating detailed coverage reports...', 'blue')
    
    // Check if coverage files exist
    const coverageDir = path.join(process.cwd(), 'coverage')
    if (!fs.existsSync(coverageDir)) {
      throw new Error('No coverage data generated')
    }
    
    // Generate additional reports
    if (fs.existsSync(path.join(coverageDir, 'lcov.info'))) {
      log('📄 LCOV report generated', 'green')
    }
    
    if (fs.existsSync(path.join(coverageDir, 'index.html'))) {
      log('🌐 HTML report generated', 'green')
    }
    
    if (fs.existsSync(path.join(coverageDir, 'coverage-final.json'))) {
      log('📊 JSON report generated', 'green')
    }
    
    // Parse and display coverage summary
    const summaryPath = path.join(coverageDir, 'coverage-summary.json')
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
      displayCoverageSummary(summary)
    }
    
    // Generate badge
    generateCoverageBadge(summaryPath)
    
    // Generate detailed report
    generateDetailedReport(coverageDir)
    
    log('\n✅ Coverage report generation completed!', 'green')
    log('\n📂 Reports generated in:', 'cyan')
    log(`   • HTML Report: ${path.join(coverageDir, 'index.html')}`, 'blue')
    log(`   • LCOV Report: ${path.join(coverageDir, 'lcov.info')}`, 'blue')
    log(`   • JSON Report: ${path.join(coverageDir, 'coverage-final.json')}`, 'blue')
    
  } catch (error) {
    log(`\n❌ Coverage report generation failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

function displayCoverageSummary(summary) {
  log('\n📈 Coverage Summary', 'cyan')
  log('==================', 'cyan')
  
  const total = summary.total
  const metrics = ['statements', 'branches', 'functions', 'lines']
  
  metrics.forEach(metric => {
    const coverage = total[metric]
    const percentage = coverage.pct
    const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red'
    const icon = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌'
    
    log(`${icon} ${metric.padEnd(12)}: ${percentage}% (${coverage.covered}/${coverage.total})`, color)
  })
  
  // Overall grade
  const averageCoverage = metrics.reduce((sum, metric) => sum + total[metric].pct, 0) / metrics.length
  const grade = averageCoverage >= 90 ? 'A' : averageCoverage >= 80 ? 'B' : averageCoverage >= 70 ? 'C' : averageCoverage >= 60 ? 'D' : 'F'
  const gradeColor = averageCoverage >= 80 ? 'green' : averageCoverage >= 60 ? 'yellow' : 'red'
  
  log(`\n🎯 Overall Grade: ${grade} (${averageCoverage.toFixed(1)}%)`, gradeColor)
}

function generateCoverageBadge(summaryPath) {
  if (!fs.existsSync(summaryPath)) return
  
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
    const coverage = summary.total.statements.pct
    
    const badgeColor = coverage >= 80 ? 'brightgreen' : coverage >= 60 ? 'yellow' : 'red'
    const badgeUrl = `https://img.shields.io/badge/coverage-${coverage}%25-${badgeColor}`
    
    const badgeMarkdown = `[![Coverage](${badgeUrl})](./coverage/index.html)`
    
    // Write badge to file
    fs.writeFileSync('coverage-badge.md', badgeMarkdown)
    log('🏷️ Coverage badge generated: coverage-badge.md', 'green')
    
  } catch (error) {
    log(`⚠️ Could not generate coverage badge: ${error.message}`, 'yellow')
  }
}

function generateDetailedReport(coverageDir) {
  try {
    const coverageData = JSON.parse(
      fs.readFileSync(path.join(coverageDir, 'coverage-final.json'), 'utf8')
    )
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      files: [],
      lowCoverageFiles: [],
      highCoverageFiles: [],
      recommendations: [],
    }
    
    // Process each file
    Object.entries(coverageData).forEach(([filePath, fileData]) => {
      const relativePath = path.relative(process.cwd(), filePath)
      const coverage = {
        statements: (fileData.s && Object.keys(fileData.s).length > 0) 
          ? (Object.values(fileData.s).filter(v => v > 0).length / Object.keys(fileData.s).length) * 100 
          : 0,
        branches: (fileData.b && Object.keys(fileData.b).length > 0)
          ? (fileData.b.reduce((covered, branch) => covered + (branch.some(b => b > 0) ? 1 : 0), 0) / Object.keys(fileData.b).length) * 100
          : 0,
        functions: (fileData.f && Object.keys(fileData.f).length > 0)
          ? (Object.values(fileData.f).filter(v => v > 0).length / Object.keys(fileData.f).length) * 100
          : 0,
        lines: (fileData.l && Object.keys(fileData.l).length > 0)
          ? (Object.values(fileData.l).filter(v => v > 0).length / Object.keys(fileData.l).length) * 100
          : 0,
      }
      
      const avgCoverage = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4
      
      const fileReport = {
        path: relativePath,
        coverage,
        average: avgCoverage,
      }
      
      report.files.push(fileReport)
      
      if (avgCoverage < 60) {
        report.lowCoverageFiles.push(fileReport)
      } else if (avgCoverage > 90) {
        report.highCoverageFiles.push(fileReport)
      }
    })
    
    // Sort files by coverage
    report.files.sort((a, b) => a.average - b.average)
    
    // Generate recommendations
    if (report.lowCoverageFiles.length > 0) {
      report.recommendations.push({
        type: 'low_coverage',
        message: `${report.lowCoverageFiles.length} files have coverage below 60%. Consider adding tests for these files.`,
        files: report.lowCoverageFiles.slice(0, 5).map(f => f.path),
      })
    }
    
    // Write detailed report
    fs.writeFileSync(
      path.join(coverageDir, 'detailed-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    log('📋 Detailed coverage report generated', 'green')
    
  } catch (error) {
    log(`⚠️ Could not generate detailed report: ${error.message}`, 'yellow')
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    log('\nLexChronos Test Coverage Generator', 'cyan')
    log('Usage: node scripts/test-coverage.js [options]', 'blue')
    log('\nOptions:', 'yellow')
    log('  --help, -h     Show this help message', 'blue')
    log('  --watch, -w    Run in watch mode', 'blue')
    log('  --html-only    Generate only HTML report', 'blue')
    log('  --json-only    Generate only JSON report', 'blue')
    process.exit(0)
  }
  
  if (args.includes('--watch') || args.includes('-w')) {
    log('👀 Running in watch mode...', 'yellow')
    execSync('npx jest --config jest.config.coverage.js --coverage --watch', { stdio: 'inherit' })
  } else {
    generateCoverageReport()
  }
}

module.exports = {
  generateCoverageReport,
  displayCoverageSummary,
  generateCoverageBadge,
  generateDetailedReport,
}