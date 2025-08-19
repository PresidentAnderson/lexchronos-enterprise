#!/usr/bin/env node

/**
 * LexChronos Analytics Verification Script
 * Verifies that all analytics services are properly configured and working
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bright}${colors.cyan}🔍 ${msg}${colors.reset}`),
};

// Configuration
const PROJECT_ROOT = process.cwd();
const ENV_FILE = path.join(PROJECT_ROOT, '.env.local');
const ENV_EXAMPLE = path.join(PROJECT_ROOT, '.env.example');

let analyticsConfig = {};
let errors = [];
let warnings = [];

// Load environment variables
function loadEnvFile() {
  log.header('Loading Environment Configuration...');
  
  if (!fs.existsSync(ENV_FILE)) {
    if (fs.existsSync(ENV_EXAMPLE)) {
      log.warning('.env.local not found. Using .env.example as reference.');
      return loadEnvFromFile(ENV_EXAMPLE);
    } else {
      log.error('.env.local and .env.example not found.');
      return false;
    }
  }
  
  return loadEnvFromFile(ENV_FILE);
}

function loadEnvFromFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key.includes('ANALYTICS') || key.includes('GA_') || key.includes('GTM_') || 
            key.includes('FB_PIXEL') || key.includes('CLARITY')) {
          analyticsConfig[key.trim()] = value;
        }
      }
    });
    
    log.success(`Loaded ${Object.keys(analyticsConfig).length} analytics configuration variables`);
    return true;
  } catch (error) {
    log.error(`Failed to load ${filePath}: ${error.message}`);
    return false;
  }
}

// Verify analytics configuration
function verifyAnalyticsConfig() {
  log.header('Verifying Analytics Configuration...');
  
  const requiredConfigs = [
    { key: 'NEXT_PUBLIC_GA_TRACKING_ID', name: 'Google Analytics 4', pattern: /^G-[A-Z0-9]+$/ },
    { key: 'NEXT_PUBLIC_GTM_ID', name: 'Google Tag Manager', pattern: /^GTM-[A-Z0-9]+$/ },
    { key: 'NEXT_PUBLIC_FB_PIXEL_ID', name: 'Facebook Pixel', pattern: /^[0-9]+$/ },
    { key: 'NEXT_PUBLIC_CLARITY_PROJECT_ID', name: 'Microsoft Clarity', pattern: /^[a-z0-9]+$/ }
  ];
  
  requiredConfigs.forEach(config => {
    const value = analyticsConfig[config.key];
    
    if (!value || value === 'your-id-here' || value.includes('XXXXXXX') || value.includes('000000')) {
      errors.push(`${config.name} (${config.key}) is not configured`);
    } else if (!config.pattern.test(value)) {
      errors.push(`${config.name} (${config.key}) has invalid format: ${value}`);
    } else {
      log.success(`${config.name} configured: ${value.substring(0, 8)}...`);
    }
  });
  
  const optionalConfigs = [
    'NEXT_PUBLIC_ANALYTICS_ENV',
    'GOOGLE_ANALYTICS_API_KEY',
    'FACEBOOK_CONVERSIONS_API_TOKEN',
    'NEXT_PUBLIC_FIRM_NAME',
    'NEXT_PUBLIC_FIRM_ID'
  ];
  
  optionalConfigs.forEach(key => {
    if (analyticsConfig[key] && !analyticsConfig[key].includes('your-')) {
      log.success(`Optional config ${key} is set`);
    } else {
      warnings.push(`Optional config ${key} is not set`);
    }
  });
}

// Check if analytics files exist
function verifyAnalyticsFiles() {
  log.header('Verifying Analytics Implementation Files...');
  
  const requiredFiles = [
    'lib/analytics/google-analytics.ts',
    'lib/analytics/google-tag-manager.ts',
    'lib/analytics/facebook-pixel.ts',
    'lib/analytics/microsoft-clarity.ts',
    'lib/analytics/legal-analytics.ts',
    'components/analytics/analytics-provider.tsx',
    'components/analytics/analytics-dashboard.tsx',
    'hooks/use-analytics.ts'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      log.success(`Found ${file}`);
    } else {
      errors.push(`Missing analytics file: ${file}`);
    }
  });
}

// Verify package.json dependencies
function verifyDependencies() {
  log.header('Verifying Analytics Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      'recharts', // For analytics dashboard
      'lucide-react' // For icons
    ];
    
    const recommendedDeps = [
      'gtag',
      '@types/gtag'
    ];
    
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        log.success(`Required dependency ${dep} is installed: ${dependencies[dep]}`);
      } else {
        errors.push(`Missing required dependency: ${dep}`);
      }
    });
    
    recommendedDeps.forEach(dep => {
      if (dependencies[dep]) {
        log.success(`Recommended dependency ${dep} is installed: ${dependencies[dep]}`);
      } else {
        warnings.push(`Recommended dependency ${dep} is not installed`);
      }
    });
    
  } catch (error) {
    log.error(`Failed to read package.json: ${error.message}`);
  }
}

// Test network connectivity to analytics services
async function testNetworkConnectivity() {
  log.header('Testing Network Connectivity to Analytics Services...');
  
  const services = [
    { name: 'Google Analytics', host: 'www.google-analytics.com', port: 443 },
    { name: 'Google Tag Manager', host: 'www.googletagmanager.com', port: 443 },
    { name: 'Facebook Pixel', host: 'connect.facebook.net', port: 443 },
    { name: 'Microsoft Clarity', host: 'www.clarity.ms', port: 443 }
  ];
  
  const testConnection = (service) => {
    return new Promise((resolve) => {
      const options = {
        hostname: service.host,
        port: service.port,
        method: 'HEAD',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode < 400) {
          log.success(`${service.name} is reachable`);
        } else {
          warnings.push(`${service.name} returned status ${res.statusCode}`);
        }
        resolve();
      });
      
      req.on('error', () => {
        warnings.push(`Cannot reach ${service.name} (${service.host})`);
        resolve();
      });
      
      req.on('timeout', () => {
        warnings.push(`Timeout connecting to ${service.name}`);
        resolve();
      });
      
      req.end();
    });
  };
  
  await Promise.all(services.map(testConnection));
}

// Check TypeScript compilation
function verifyTypeScript() {
  log.header('Verifying TypeScript Compilation...');
  
  try {
    // Check if TypeScript files compile without errors
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      log.success('TypeScript compilation successful');
    } else {
      warnings.push('tsconfig.json not found - skipping TypeScript check');
    }
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    if (errorOutput.includes('analytics')) {
      errors.push(`TypeScript compilation errors in analytics files:\n${errorOutput}`);
    } else {
      warnings.push('TypeScript compilation has issues, but not in analytics files');
    }
  }
}

// Verify layout integration
function verifyLayoutIntegration() {
  log.header('Verifying Layout Integration...');
  
  const layoutPath = path.join(PROJECT_ROOT, 'app/layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    if (layoutContent.includes('AnalyticsProvider')) {
      log.success('AnalyticsProvider is integrated in layout.tsx');
    } else {
      errors.push('AnalyticsProvider is not integrated in layout.tsx');
    }
    
    if (layoutContent.includes('import AnalyticsProvider')) {
      log.success('AnalyticsProvider is properly imported');
    } else {
      errors.push('AnalyticsProvider import is missing from layout.tsx');
    }
  } else {
    errors.push('app/layout.tsx not found');
  }
}

// Generate analytics setup instructions
function generateSetupInstructions() {
  if (errors.length === 0 && warnings.length === 0) {
    return;
  }
  
  log.header('Analytics Setup Instructions');
  
  console.log(`
${colors.bright}${colors.yellow}SETUP INSTRUCTIONS${colors.reset}

To complete your LexChronos analytics setup:

1. ${colors.bright}Create Analytics Accounts:${colors.reset}
   - Google Analytics 4: https://analytics.google.com/
   - Google Tag Manager: https://tagmanager.google.com/
   - Facebook Business Manager: https://business.facebook.com/
   - Microsoft Clarity: https://clarity.microsoft.com/

2. ${colors.bright}Update Environment Variables:${colors.reset}
   Copy .env.example to .env.local and update these values:
   ${errors.filter(e => e.includes('not configured')).map(e => `   - ${e}`).join('\n')}

3. ${colors.bright}Install Missing Dependencies:${colors.reset}
   ${errors.filter(e => e.includes('dependency')).length > 0 ? 
     'npm install ' + errors.filter(e => e.includes('dependency')).map(e => e.split(': ')[1]).join(' ') : 'No missing dependencies'}

4. ${colors.bright}Legal Practice Configuration:${colors.reset}
   Set your firm-specific variables:
   - NEXT_PUBLIC_FIRM_NAME="Your Law Firm Name"
   - NEXT_PUBLIC_FIRM_ID="your-firm-id"
   - NEXT_PUBLIC_PRACTICE_AREAS="Corporate Law,Employment Law,Litigation"

5. ${colors.bright}Privacy Compliance:${colors.reset}
   Configure privacy settings:
   - GDPR_COMPLIANCE_MODE=true (if serving EU clients)
   - CCPA_COMPLIANCE_MODE=true (if serving CA clients)
   - COOKIE_CONSENT_REQUIRED=true (recommended)

6. ${colors.bright}Test Your Setup:${colors.reset}
   Run this script again: npm run verify-analytics
`);
}

// Generate comprehensive report
function generateReport() {
  log.header('Analytics Verification Report');
  
  console.log(`
${colors.bright}${colors.cyan}LEXCHRONOS ANALYTICS VERIFICATION REPORT${colors.reset}
Generated: ${new Date().toISOString()}
Project: ${path.basename(PROJECT_ROOT)}

${colors.bright}SUMMARY:${colors.reset}
✅ Successful Checks: ${Object.keys(analyticsConfig).length > 0 ? 'Configuration loaded' : '0'}
❌ Errors: ${errors.length}
⚠️  Warnings: ${warnings.length}

${colors.bright}CONFIGURATION STATUS:${colors.reset}
${Object.entries(analyticsConfig).map(([key, value]) => 
  `${colors.green}✓${colors.reset} ${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`
).join('\n')}

${errors.length > 0 ? `
${colors.bright}${colors.red}ERRORS (Must Fix):${colors.reset}
${errors.map(error => `${colors.red}❌ ${error}${colors.reset}`).join('\n')}
` : ''}

${warnings.length > 0 ? `
${colors.bright}${colors.yellow}WARNINGS (Should Fix):${colors.reset}
${warnings.map(warning => `${colors.yellow}⚠️  ${warning}${colors.reset}`).join('\n')}
` : ''}

${colors.bright}RECOMMENDATIONS:${colors.reset}
• Set up Google Analytics 4 enhanced ecommerce for billing tracking
• Configure Facebook Conversions API for iOS 14.5+ tracking
• Implement server-side tracking for better data accuracy
• Set up custom dimensions for legal practice areas
• Configure goal tracking for case outcomes
• Enable demographic and interest reports (where legally compliant)

${colors.bright}NEXT STEPS:${colors.reset}
1. Fix all errors listed above
2. Review and address warnings
3. Test analytics in browser developer tools
4. Verify data appears in analytics dashboards
5. Set up automated alerts for analytics failures

${errors.length === 0 ? 
  `${colors.green}${colors.bright}🎉 ANALYTICS SETUP COMPLETE!${colors.reset}
Your LexChronos analytics implementation is ready for production.` : 
  `${colors.red}${colors.bright}⚠️  SETUP INCOMPLETE${colors.reset}
Please fix the errors above before deploying to production.`}
`);
}

// Main execution function
async function main() {
  console.log(`${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════╗
║                    LEXCHRONOS ANALYTICS                       ║
║                  VERIFICATION & SETUP TOOL                   ║
║                                                               ║
║  Comprehensive verification of analytics implementation       ║
║  for legal case management system                            ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  try {
    const envLoaded = loadEnvFile();
    if (!envLoaded) {
      errors.push('Failed to load environment configuration');
    }
    
    verifyAnalyticsConfig();
    verifyAnalyticsFiles();
    verifyDependencies();
    verifyLayoutIntegration();
    await testNetworkConnectivity();
    verifyTypeScript();
    
    generateReport();
    
    if (errors.length > 0) {
      generateSetupInstructions();
      process.exit(1);
    } else if (warnings.length > 0) {
      log.warning('Analytics setup has warnings but is functional');
      process.exit(0);
    } else {
      log.success('Analytics verification completed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, verifyAnalyticsConfig, verifyAnalyticsFiles };