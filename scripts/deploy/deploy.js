#!/usr/bin/env node

/**
 * Universal Deployment Manager for LexChronos
 * @description Orchestrates deployments across different platforms with comprehensive checks
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DeploymentManager {
  constructor() {
    this.config = this.loadConfig();
    this.supportedPlatforms = ['vercel', 'railway', 'docker'];
  }

  loadConfig() {
    try {
      const config = require('../../config');
      return config;
    } catch (error) {
      console.warn('Configuration not available, using defaults');
      return {
        app: {
          name: 'LexChronos',
          environment: process.env.NODE_ENV || 'development'
        }
      };
    }
  }

  async deploy(platform, options = {}) {
    const {
      environment = 'production',
      force = false,
      skipTests = false,
      skipMigrations = false
    } = options;

    console.log(`🚀 Starting deployment to ${platform.toUpperCase()}`);
    console.log(`Environment: ${environment}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    try {
      // Pre-deployment validation
      await this.validateDeployment(platform, environment);

      // Platform-specific deployment
      switch (platform.toLowerCase()) {
        case 'vercel':
          return await this.deployToVercel(environment, options);
        
        case 'railway':
          return await this.deployToRailway(environment, options);
        
        case 'docker':
          return await this.deployToDocker(environment, options);
        
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

    } catch (error) {
      console.error(`❌ Deployment to ${platform} failed:`, error.message);
      await this.handleDeploymentFailure(platform, error);
      throw error;
    }
  }

  async validateDeployment(platform, environment) {
    console.log('🔍 Validating deployment prerequisites...');

    // Check if platform is supported
    if (!this.supportedPlatforms.includes(platform.toLowerCase())) {
      throw new Error(`Platform ${platform} is not supported. Supported: ${this.supportedPlatforms.join(', ')}`);
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      throw new Error(`Invalid environment: ${environment}. Valid: ${validEnvironments.join(', ')}`);
    }

    // Check git status
    const gitStatus = await this.checkGitStatus();
    if (!gitStatus.clean) {
      console.warn('⚠️ Working directory is not clean:');
      console.warn('Uncommitted files:', gitStatus.uncommittedFiles);
      console.warn('Untracked files:', gitStatus.untrackedFiles);
    }

    // Check required files
    const requiredFiles = [
      'package.json',
      '.env.example',
      'next.config.ts'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch (error) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Platform-specific validations
    await this.validatePlatformRequirements(platform);

    console.log('✅ Deployment validation passed');
  }

  async validatePlatformRequirements(platform) {
    switch (platform.toLowerCase()) {
      case 'vercel':
        // Check Vercel CLI
        try {
          await this.runCommand('vercel', ['--version']);
        } catch (error) {
          throw new Error('Vercel CLI not installed. Run: npm install -g vercel');
        }

        // Check Vercel login
        try {
          await this.runCommand('vercel', ['whoami']);
        } catch (error) {
          throw new Error('Not logged in to Vercel. Run: vercel login');
        }
        break;

      case 'railway':
        // Check Railway CLI
        try {
          await this.runCommand('railway', ['--version']);
        } catch (error) {
          throw new Error('Railway CLI not installed. Run: npm install -g @railway/cli');
        }

        // Check Railway login
        try {
          await this.runCommand('railway', ['whoami']);
        } catch (error) {
          throw new Error('Not logged in to Railway. Run: railway login');
        }
        break;

      case 'docker':
        // Check Docker
        try {
          await this.runCommand('docker', ['--version']);
        } catch (error) {
          throw new Error('Docker not installed or not running');
        }

        // Check if Dockerfile exists
        try {
          await fs.access('Dockerfile');
        } catch (error) {
          throw new Error('Dockerfile not found in project root');
        }
        break;
    }
  }

  async checkGitStatus() {
    try {
      const statusOutput = await this.runCommand('git', ['status', '--porcelain']);
      const lines = statusOutput.split('\n').filter(line => line.trim());
      
      const uncommittedFiles = [];
      const untrackedFiles = [];
      
      for (const line of lines) {
        if (line.startsWith('??')) {
          untrackedFiles.push(line.substring(3));
        } else {
          uncommittedFiles.push(line.substring(3));
        }
      }

      return {
        clean: lines.length === 0,
        uncommittedFiles,
        untrackedFiles
      };
    } catch (error) {
      console.warn('Could not check git status:', error.message);
      return { clean: true, uncommittedFiles: [], untrackedFiles: [] };
    }
  }

  async deployToVercel(environment, options) {
    console.log('📦 Deploying to Vercel...');

    const scriptPath = path.join(__dirname, 'vercel-deploy.sh');
    const args = ['--env', environment];

    if (options.force) args.push('--force');
    if (options.skipTests) args.push('--skip-tests');
    if (options.skipBuildVerification) args.push('--skip-build-verification');
    if (options.noAnalyticsCheck) args.push('--no-analytics-check');

    try {
      const result = await this.runScript(scriptPath, args);
      
      // Extract deployment URL from output
      const urlMatch = result.match(/Deployment URL: (https:\/\/[^\s]+)/);
      const deploymentUrl = urlMatch ? urlMatch[1] : null;

      return {
        success: true,
        platform: 'vercel',
        environment,
        url: deploymentUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async deployToRailway(environment, options) {
    console.log('🚂 Deploying to Railway...');

    const scriptPath = path.join(__dirname, 'railway-deploy.sh');
    const args = ['--env', environment];

    if (options.service) args.push('--service', options.service);
    if (options.force) args.push('--force');
    if (options.skipTests) args.push('--skip-tests');
    if (options.skipMigrations) args.push('--skip-migrations');
    if (options.skipBuildVerification) args.push('--skip-build-verification');

    try {
      const result = await this.runScript(scriptPath, args);
      
      // Extract deployment URL from output
      const urlMatch = result.match(/Deployment URL: (https:\/\/[^\s]+)/);
      const deploymentUrl = urlMatch ? urlMatch[1] : null;

      return {
        success: true,
        platform: 'railway',
        environment,
        url: deploymentUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Railway deployment failed: ${error.message}`);
    }
  }

  async deployToDocker(environment, options) {
    console.log('🐳 Building and deploying Docker container...');

    const imageName = `lexchronos:${environment}`;
    const taggedName = `lexchronos:latest`;

    try {
      // Build Docker image
      console.log('Building Docker image...');
      await this.runCommand('docker', [
        'build',
        '-t', imageName,
        '-t', taggedName,
        '--build-arg', `NODE_ENV=${environment}`,
        '.'
      ]);

      // Run container (for local testing)
      if (options.run) {
        console.log('Starting Docker container...');
        await this.runCommand('docker', [
          'run',
          '-d',
          '--name', `lexchronos-${environment}`,
          '-p', '3000:3000',
          '--env-file', `.env.${environment}`,
          imageName
        ]);

        console.log('Container started at http://localhost:3000');
      }

      // Push to registry if specified
      if (options.registry) {
        const registryImage = `${options.registry}/lexchronos:${environment}`;
        
        console.log(`Tagging for registry: ${registryImage}`);
        await this.runCommand('docker', ['tag', imageName, registryImage]);
        
        console.log(`Pushing to registry: ${registryImage}`);
        await this.runCommand('docker', ['push', registryImage]);
      }

      return {
        success: true,
        platform: 'docker',
        environment,
        image: imageName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Docker deployment failed: ${error.message}`);
    }
  }

  async runScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', [scriptPath, ...args], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        stdout += output;
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        process.stderr.write(output);
        stderr += output;
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Script execution error: ${error.message}`));
      });
    });
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`${command} failed: ${stderr.trim()}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Command execution error: ${error.message}`));
      });
    });
  }

  async handleDeploymentFailure(platform, error) {
    console.error(`🔥 Deployment failure on ${platform}:`, error.message);
    
    // Save failure log
    const failureLog = {
      timestamp: new Date().toISOString(),
      platform,
      error: error.message,
      stack: error.stack,
      environment: this.config.app.environment,
      gitCommit: await this.getGitCommit()
    };

    const logFile = path.join(__dirname, `../logs/deployment-failure-${Date.now()}.json`);
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.writeFile(logFile, JSON.stringify(failureLog, null, 2));

    console.log(`Failure log saved: ${logFile}`);
  }

  async getGitCommit() {
    try {
      return await this.runCommand('git', ['rev-parse', 'HEAD']);
    } catch (error) {
      return 'unknown';
    }
  }

  // Multi-platform deployment
  async deployToMultiplePlatforms(platforms, options = {}) {
    console.log(`🌐 Deploying to multiple platforms: ${platforms.join(', ')}`);
    
    const results = [];
    const failures = [];

    for (const platform of platforms) {
      try {
        console.log(`\n--- Deploying to ${platform.toUpperCase()} ---`);
        const result = await this.deploy(platform, options);
        results.push(result);
        console.log(`✅ ${platform} deployment successful`);
      } catch (error) {
        console.error(`❌ ${platform} deployment failed:`, error.message);
        failures.push({ platform, error: error.message });
      }
    }

    // Summary
    console.log('\n================================');
    console.log('MULTI-PLATFORM DEPLOYMENT SUMMARY');
    console.log('================================');
    
    if (results.length > 0) {
      console.log('\n✅ Successful Deployments:');
      results.forEach(result => {
        console.log(`  ${result.platform}: ${result.url || 'deployed'}`);
      });
    }

    if (failures.length > 0) {
      console.log('\n❌ Failed Deployments:');
      failures.forEach(failure => {
        console.log(`  ${failure.platform}: ${failure.error}`);
      });
    }

    return {
      successful: results,
      failed: failures,
      totalPlatforms: platforms.length,
      successCount: results.length,
      failureCount: failures.length
    };
  }
}

// CLI interface
async function main() {
  const [,, command, ...args] = process.argv;
  const deploymentManager = new DeploymentManager();

  const parseOptions = (args) => {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.replace('--', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('--')) {
          options[key] = nextArg;
          i++; // Skip next arg as it's a value
        } else {
          options[key] = true;
        }
      }
    }
    return options;
  };

  try {
    const options = parseOptions(args);

    switch (command) {
      case 'vercel':
        const vercelResult = await deploymentManager.deploy('vercel', options);
        console.log('\nDeployment Result:', JSON.stringify(vercelResult, null, 2));
        break;

      case 'railway':
        const railwayResult = await deploymentManager.deploy('railway', options);
        console.log('\nDeployment Result:', JSON.stringify(railwayResult, null, 2));
        break;

      case 'docker':
        const dockerResult = await deploymentManager.deploy('docker', options);
        console.log('\nDeployment Result:', JSON.stringify(dockerResult, null, 2));
        break;

      case 'multi':
        const platforms = args.filter(arg => !arg.startsWith('--'));
        if (platforms.length === 0) {
          console.error('❌ No platforms specified for multi-deployment');
          process.exit(1);
        }
        
        const multiResult = await deploymentManager.deployToMultiplePlatforms(platforms, options);
        console.log('\nMulti-Platform Result:', JSON.stringify(multiResult, null, 2));
        break;

      case 'status':
        console.log('📊 Deployment Manager Status');
        console.log(`Supported platforms: ${deploymentManager.supportedPlatforms.join(', ')}`);
        console.log(`Current environment: ${deploymentManager.config.app.environment}`);
        break;

      default:
        console.log(`
LexChronos Deployment Manager

Usage: node deploy.js <command> [options]

Commands:
  vercel              Deploy to Vercel
  railway             Deploy to Railway  
  docker              Build/deploy Docker container
  multi <platforms>   Deploy to multiple platforms
  status              Show deployment manager status

Options:
  --env <env>              Environment (production|staging|development)
  --force                  Force deployment
  --skip-tests            Skip tests
  --skip-migrations       Skip database migrations (Railway)
  --skip-build-verification  Skip build verification
  --no-analytics-check    Skip analytics verification (Vercel)
  --service <name>        Service name (Railway)
  --run                   Run container locally (Docker)
  --registry <url>        Push to container registry (Docker)

Examples:
  node deploy.js vercel --env production
  node deploy.js railway --env staging --service web
  node deploy.js docker --run --env development
  node deploy.js multi vercel railway --env production --force
        `);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DeploymentManager;