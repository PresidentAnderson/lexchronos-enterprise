#!/usr/bin/env node

/**
 * Comprehensive Backup System for LexChronos
 * @description Automated backup solution with encryption, compression, and cloud storage
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createReadStream } = require('fs');

// Configuration
const config = require('../../config');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../../database/backups');
    this.s3Client = null;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    this.s3Bucket = process.env.S3_BACKUP_BUCKET;
    
    this.init();
  }

  async init() {
    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true });

    // Initialize S3 client if configured
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && this.s3Bucket) {
      this.s3Client = new S3Client({
        region: process.env.AWS_S3_REGION || 'us-east-1'
      });
      console.log('✅ S3 backup client initialized');
    }
  }

  async createDatabaseBackup(options = {}) {
    const {
      compress = true,
      encrypt = true,
      upload = true,
      format = 'custom'
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `lexchronos_db_${timestamp}`;
    const backupFile = path.join(this.backupDir, `${baseFileName}.sql`);

    console.log('🗄️ Creating database backup...');

    try {
      // Create database backup using pg_dump
      await this.pgDump(backupFile, format);
      console.log(`✅ Database backup created: ${backupFile}`);

      let finalFile = backupFile;
      let fileSize = (await fs.stat(backupFile)).size;

      // Compress if requested
      if (compress) {
        const compressedFile = `${backupFile}.gz`;
        await this.compressFile(backupFile, compressedFile);
        await fs.unlink(backupFile); // Remove original
        finalFile = compressedFile;
        fileSize = (await fs.stat(compressedFile)).size;
        console.log(`✅ Backup compressed: ${compressedFile}`);
      }

      // Encrypt if requested
      if (encrypt && this.encryptionKey) {
        const encryptedFile = `${finalFile}.enc`;
        await this.encryptFile(finalFile, encryptedFile);
        await fs.unlink(finalFile); // Remove unencrypted
        finalFile = encryptedFile;
        console.log(`✅ Backup encrypted: ${encryptedFile}`);
      }

      // Upload to S3 if configured and requested
      if (upload && this.s3Client) {
        await this.uploadToS3(finalFile, path.basename(finalFile));
        console.log('✅ Backup uploaded to S3');
      }

      // Generate manifest
      const manifest = await this.generateManifest({
        type: 'database',
        timestamp: new Date().toISOString(),
        filename: path.basename(finalFile),
        size: fileSize,
        compressed: compress,
        encrypted: encrypt,
        format,
        checksum: await this.calculateChecksum(finalFile)
      });

      return {
        success: true,
        file: finalFile,
        manifest,
        size: fileSize
      };

    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  async createFileBackup(directories = [], options = {}) {
    const {
      compress = true,
      encrypt = true,
      upload = true
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `lexchronos_files_${timestamp}`;
    const backupFile = path.join(this.backupDir, `${baseFileName}.tar`);

    console.log('📁 Creating file backup...');

    try {
      // Default directories if none provided
      if (directories.length === 0) {
        directories = [
          './uploads',
          './logs',
          './config',
          './.env.example'
        ].filter(async (dir) => {
          try {
            await fs.access(dir);
            return true;
          } catch {
            return false;
          }
        });
      }

      // Create tar archive
      await this.createTarArchive(directories, backupFile);
      console.log(`✅ File backup created: ${backupFile}`);

      let finalFile = backupFile;
      let fileSize = (await fs.stat(backupFile)).size;

      // Compress if requested
      if (compress) {
        const compressedFile = `${backupFile}.gz`;
        await this.compressFile(backupFile, compressedFile);
        await fs.unlink(backupFile);
        finalFile = compressedFile;
        fileSize = (await fs.stat(compressedFile)).size;
        console.log(`✅ File backup compressed: ${compressedFile}`);
      }

      // Encrypt if requested
      if (encrypt && this.encryptionKey) {
        const encryptedFile = `${finalFile}.enc`;
        await this.encryptFile(finalFile, encryptedFile);
        await fs.unlink(finalFile);
        finalFile = encryptedFile;
        console.log(`✅ File backup encrypted: ${encryptedFile}`);
      }

      // Upload to S3 if configured
      if (upload && this.s3Client) {
        await this.uploadToS3(finalFile, path.basename(finalFile));
        console.log('✅ File backup uploaded to S3');
      }

      const manifest = await this.generateManifest({
        type: 'files',
        timestamp: new Date().toISOString(),
        filename: path.basename(finalFile),
        directories,
        size: fileSize,
        compressed: compress,
        encrypted: encrypt,
        checksum: await this.calculateChecksum(finalFile)
      });

      return {
        success: true,
        file: finalFile,
        manifest,
        size: fileSize
      };

    } catch (error) {
      console.error('❌ File backup failed:', error);
      throw error;
    }
  }

  async createFullBackup(options = {}) {
    console.log('🚀 Starting full system backup...');
    
    const results = {
      timestamp: new Date().toISOString(),
      database: null,
      files: null,
      totalSize: 0,
      success: false
    };

    try {
      // Create database backup
      console.log('📊 Backing up database...');
      results.database = await this.createDatabaseBackup(options);
      results.totalSize += results.database.size;

      // Create file backup
      console.log('📁 Backing up files...');
      results.files = await this.createFileBackup([], options);
      results.totalSize += results.files.size;

      // Save backup manifest
      const fullManifest = {
        type: 'full',
        timestamp: results.timestamp,
        database: results.database.manifest,
        files: results.files.manifest,
        totalSize: results.totalSize,
        environment: config.app.environment
      };

      const manifestFile = path.join(
        this.backupDir,
        `manifest_${results.timestamp.replace(/[:.]/g, '-')}.json`
      );

      await fs.writeFile(manifestFile, JSON.stringify(fullManifest, null, 2));

      // Upload manifest to S3
      if (this.s3Client && options.upload !== false) {
        await this.uploadToS3(manifestFile, path.basename(manifestFile));
      }

      results.success = true;
      console.log('✅ Full backup completed successfully');
      console.log(`📊 Total backup size: ${this.formatBytes(results.totalSize)}`);

      return results;

    } catch (error) {
      console.error('❌ Full backup failed:', error);
      results.error = error.message;
      return results;
    }
  }

  async pgDump(outputFile, format = 'custom') {
    return new Promise((resolve, reject) => {
      const databaseUrl = config.database.url || process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        reject(new Error('Database URL not configured'));
        return;
      }

      const args = [
        databaseUrl,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists'
      ];

      if (format === 'custom') {
        args.push('--format=custom');
      }

      args.push('--file', outputFile);

      const pgDump = spawn('pg_dump', args, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pgDump.stdout.on('data', (data) => {
        output += data.toString();
      });

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', (error) => {
        reject(new Error(`pg_dump process error: ${error.message}`));
      });
    });
  }

  async createTarArchive(directories, outputFile) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-cf', outputFile, ...directories], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let errorOutput = '';

      tar.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar failed with code ${code}: ${errorOutput}`));
        }
      });

      tar.on('error', (error) => {
        reject(new Error(`tar process error: ${error.message}`));
      });
    });
  }

  async compressFile(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
      const gzip = spawn('gzip', ['-c', inputFile], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      const output = require('fs').createWriteStream(outputFile);
      gzip.stdout.pipe(output);

      let errorOutput = '';
      gzip.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      gzip.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`gzip failed with code ${code}: ${errorOutput}`));
        }
      });

      gzip.on('error', (error) => {
        reject(new Error(`gzip process error: ${error.message}`));
      });
    });
  }

  async encryptFile(inputFile, outputFile) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key, iv);
    
    const input = createReadStream(inputFile);
    const output = require('fs').createWriteStream(outputFile);

    // Write IV to the beginning of the file
    output.write(iv);

    input.pipe(cipher).pipe(output);

    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
      input.on('error', reject);
      cipher.on('error', reject);
    });
  }

  async uploadToS3(filePath, key) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const fileStream = createReadStream(filePath);
    const uploadParams = {
      Bucket: this.s3Bucket,
      Key: `lexchronos-backups/${key}`,
      Body: fileStream,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA',
      Metadata: {
        'backup-timestamp': new Date().toISOString(),
        'backup-source': 'lexchronos',
        'backup-environment': config.app.environment
      }
    };

    await this.s3Client.send(new PutObjectCommand(uploadParams));
  }

  async calculateChecksum(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async generateManifest(data) {
    return {
      ...data,
      version: '1.0',
      created: new Date().toISOString(),
      environment: config.app.environment,
      appVersion: config.app.version
    };
  }

  async listBackups(location = 'local') {
    if (location === 'local') {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }

      return backups.sort((a, b) => b.created - a.created);
    }

    if (location === 's3' && this.s3Client) {
      const command = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: 'lexchronos-backups/'
      });

      const response = await this.s3Client.send(command);
      
      return (response.Contents || []).map(object => ({
        filename: object.Key.replace('lexchronos-backups/', ''),
        size: object.Size,
        created: object.LastModified,
        storageClass: object.StorageClass,
        etag: object.ETag
      })).sort((a, b) => b.created - a.created);
    }

    throw new Error(`Unsupported backup location: ${location}`);
  }

  async cleanupOldBackups(retentionDays = 30, location = 'local') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backups = await this.listBackups(location);
    const oldBackups = backups.filter(backup => backup.created < cutoffDate);

    console.log(`🧹 Cleaning up ${oldBackups.length} old backups older than ${retentionDays} days`);

    let cleaned = 0;

    for (const backup of oldBackups) {
      try {
        if (location === 'local') {
          await fs.unlink(path.join(this.backupDir, backup.filename));
        } else if (location === 's3' && this.s3Client) {
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.s3Bucket,
            Key: `lexchronos-backups/${backup.filename}`
          }));
        }
        cleaned++;
        console.log(`🗑️ Deleted old backup: ${backup.filename}`);
      } catch (error) {
        console.error(`❌ Failed to delete backup ${backup.filename}:`, error.message);
      }
    }

    console.log(`✅ Cleaned up ${cleaned} old backups`);
    return cleaned;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async healthCheck() {
    const health = {
      backupDirectory: {
        exists: false,
        writable: false,
        path: this.backupDir
      },
      s3: {
        configured: Boolean(this.s3Client),
        bucket: this.s3Bucket
      },
      encryption: {
        configured: Boolean(this.encryptionKey)
      },
      tools: {
        pgDump: false,
        tar: false,
        gzip: false
      }
    };

    // Check backup directory
    try {
      await fs.access(this.backupDir);
      health.backupDirectory.exists = true;
      
      // Test write permissions
      const testFile = path.join(this.backupDir, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      health.backupDirectory.writable = true;
    } catch (error) {
      console.warn('Backup directory not accessible:', error.message);
    }

    // Check required tools
    const tools = ['pg_dump', 'tar', 'gzip'];
    for (const tool of tools) {
      try {
        await new Promise((resolve, reject) => {
          const proc = spawn(tool, ['--version'], { stdio: 'ignore' });
          proc.on('close', (code) => code === 0 ? resolve() : reject());
          proc.on('error', reject);
        });
        health.tools[tool.replace('_', '')] = true;
      } catch {
        console.warn(`Tool not available: ${tool}`);
      }
    }

    return health;
  }
}

// CLI interface
async function main() {
  const [,, command, ...args] = process.argv;
  const backupManager = new BackupManager();

  try {
    switch (command) {
      case 'database':
      case 'db':
        const dbResult = await backupManager.createDatabaseBackup({
          compress: !args.includes('--no-compress'),
          encrypt: !args.includes('--no-encrypt'),
          upload: !args.includes('--no-upload')
        });
        console.log('✅ Database backup completed:', dbResult.file);
        break;

      case 'files':
        const filesResult = await backupManager.createFileBackup([], {
          compress: !args.includes('--no-compress'),
          encrypt: !args.includes('--no-encrypt'),
          upload: !args.includes('--no-upload')
        });
        console.log('✅ Files backup completed:', filesResult.file);
        break;

      case 'full':
        const fullResult = await backupManager.createFullBackup({
          compress: !args.includes('--no-compress'),
          encrypt: !args.includes('--no-encrypt'),
          upload: !args.includes('--no-upload')
        });
        console.log('✅ Full backup completed');
        break;

      case 'list':
        const location = args[0] || 'local';
        const backups = await backupManager.listBackups(location);
        console.log(`\n📋 Backups (${location}):`);
        backups.forEach(backup => {
          console.log(`  ${backup.filename} - ${backupManager.formatBytes(backup.size)} - ${backup.created}`);
        });
        break;

      case 'cleanup':
        const retentionDays = parseInt(args[0]) || 30;
        const cleanupLocation = args[1] || 'local';
        await backupManager.cleanupOldBackups(retentionDays, cleanupLocation);
        break;

      case 'health':
        const health = await backupManager.healthCheck();
        console.log('\n🏥 Backup System Health:');
        console.log(JSON.stringify(health, null, 2));
        break;

      default:
        console.log(`
LexChronos Backup Manager

Usage: node backup.js <command> [options]

Commands:
  database, db    Create database backup
  files          Create files backup  
  full           Create full system backup
  list [local|s3] List available backups
  cleanup <days> [local|s3] Remove backups older than specified days
  health         Check backup system health

Options:
  --no-compress  Skip compression
  --no-encrypt   Skip encryption
  --no-upload    Skip S3 upload

Examples:
  node backup.js full
  node backup.js database --no-upload
  node backup.js list s3
  node backup.js cleanup 7
        `);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Backup operation failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupManager;